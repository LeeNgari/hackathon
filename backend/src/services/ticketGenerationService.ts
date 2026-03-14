import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../errors.js";
import type {
  CourseContext,
  CourseMaterialContext,
  GeneratedTicket,
  TicketGenerationContext,
} from "../ai/types.js";
import { generateTicketsForCourse, OpenRouterError } from "../ai/llmClient.js";

/** Wraps ticket generation and converts 429 rate-limit to HttpError for a clean API response. */
async function generateTicketsWithRateLimitHandling(
  context: TicketGenerationContext,
): Promise<GeneratedTicket[]> {
  try {
    return await generateTicketsForCourse(context);
  } catch (err) {
    if (err instanceof OpenRouterError && err.status === 429) {
      throw new HttpError(
        429,
        "RATE_LIMITED",
        "AI provider is temporarily rate-limited. Please try again in a moment.",
      );
    }
    throw err;
  }
}

export interface GenerateTicketsParams {
  courseId: string;
  mode: "initial" | "regenerate_all" | "append";
  targetTicketCount?: number;
}

export interface GenerateTicketsResult {
  courseId: string;
  mode: string;
  totalSprints: number;
  totalTickets: number;
}

export interface GenerateSprintTicketsParams {
  courseId: string;
  sprintId: string;
  mode: "initial" | "regenerate_all" | "append";
  targetTicketCount?: number;
  materialIds?: string[];
}

export interface GenerateSprintTicketsResult {
  courseId: string;
  sprintId: string;
  mode: string;
  totalTickets: number;
}

export async function generateTicketsForCourseId(
  supabaseClient: SupabaseClient,
  params: GenerateTicketsParams,
): Promise<GenerateTicketsResult> {
  const { courseId, mode, targetTicketCount } = params;

  const { data: course, error: courseError } = await supabaseClient
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Course not found.",
      courseError?.message,
    );
  }

  const { data: materials, error: materialsError } = await supabaseClient
    .from("course_materials")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (materialsError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to load course materials.",
      materialsError.message,
    );
  }

  if (!materials || materials.length === 0) {
    throw new HttpError(
      400,
      "NO_MATERIALS",
      "No course materials found for this course. Upload materials before generating tickets.",
    );
  }

  const courseContext: CourseContext = {
    id: course.id,
    title: course.title,
    description: course.description ?? null,
    category: course.category ?? null,
    difficulty: course.difficulty ?? null,
  };

  const materialContext: CourseMaterialContext[] = (materials ?? []).map(
    (m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? null,
      fileUrl: m.file_url ?? null,
      fileType: m.file_type ?? null,
    }),
  );

  const generationContext: TicketGenerationContext = {
    course: courseContext,
    materials: materialContext,
    targetTicketCount,
    maxTicketsPerRequest: 8,
  };

  if (mode === "initial" && course.ai_generated_tickets) {
    throw new HttpError(
      409,
      "ALREADY_GENERATED",
      "AI tickets have already been generated for this course.",
    );
  }

  const generatedTickets: GeneratedTicket[] =
    await generateTicketsWithRateLimitHandling(generationContext);

  if (!generatedTickets.length) {
    throw new HttpError(
      500,
      "AI_EMPTY",
      "AI did not return any tickets for this course.",
    );
  }

  const sprintKey = (t: GeneratedTicket) =>
    `${t.sprintOrderIndex}::${t.sprintTitle}`;

  const uniqueSprintsMap = new Map<
    string,
    {
      title: string;
      description?: string;
      order_index: number;
    }
  >();

  for (const t of generatedTickets) {
    const key = sprintKey(t);
    if (!uniqueSprintsMap.has(key)) {
      uniqueSprintsMap.set(key, {
        title: t.sprintTitle,
        description: t.sprintDescription,
        order_index: t.sprintOrderIndex,
      });
    }
  }

  const sprintPayload = Array.from(uniqueSprintsMap.values()).map((s) => ({
    course_id: courseId,
    title: s.title,
    description: s.description ?? null,
    order_index: s.order_index,
  }));

  const { data: insertedSprints, error: sprintsError } = await supabaseClient
    .from("sprints")
    .insert(sprintPayload)
    .select("*");

  if (sprintsError || !insertedSprints) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to insert sprints.",
      sprintsError?.message,
    );
  }

  const sprintIdByKey = new Map<string, string>();
  for (const sprint of insertedSprints) {
    const key = `${sprint.order_index}::${sprint.title}`;
    sprintIdByKey.set(key, sprint.id);
  }

  const ticketPayload = generatedTickets.map((t, index) => {
    const key = sprintKey(t);
    const sprintId = sprintIdByKey.get(key);
    if (!sprintId) {
      throw new HttpError(
        500,
        "DB_ERROR",
        `Missing sprint mapping for key ${key}`,
      );
    }

    return {
      sprint_id: sprintId,
      course_id: courseId,
      title: t.title,
      description: t.description,
      type: t.type,
      challenge_type: t.challengeType,
      duration_estimate_minutes: t.durationEstimateMinutes,
      is_urgent: t.isUrgent,
      order_index: index,
      ai_generated: true,
    };
  });

  const { data: insertedTickets, error: ticketsError } = await supabaseClient
    .from("tickets")
    .insert(ticketPayload)
    .select("*");

  if (ticketsError || !insertedTickets) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to insert tickets.",
      ticketsError?.message,
    );
  }

  const scenarioPayload: {
    ticket_id: string;
    scenario_text: string;
    context: string | null;
    expected_outcome: string;
  }[] = [];
  const deliverablePayload: {
    ticket_id: string;
    description: string;
    order_index: number;
  }[] = [];

  for (let i = 0; i < generatedTickets.length; i++) {
    const t = generatedTickets[i];
    const ticket = insertedTickets[i];
    if (!ticket) continue;

    scenarioPayload.push({
      ticket_id: ticket.id,
      scenario_text: t.scenarioText,
      context: t.context ?? null,
      expected_outcome: t.expectedOutcome,
    });

    for (const d of t.deliverables) {
      deliverablePayload.push({
        ticket_id: ticket.id,
        description: d.description,
        order_index: d.orderIndex,
      });
    }
  }

  if (scenarioPayload.length > 0) {
    const { error: scenariosError } = await supabaseClient
      .from("ticket_scenarios")
      .insert(scenarioPayload);

    if (scenariosError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to insert ticket scenarios.",
        scenariosError.message,
      );
    }
  }

  if (deliverablePayload.length > 0) {
    const { error: deliverablesError } = await supabaseClient
      .from("ticket_deliverables")
      .insert(deliverablePayload);

    if (deliverablesError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to insert ticket deliverables.",
        deliverablesError.message,
      );
    }
  }

  const totalSprints = sprintPayload.length;
  const totalTickets = generatedTickets.length;

  const { error: updateCourseError } = await supabaseClient
    .from("courses")
    .update({
      ai_generated_tickets: true,
      total_sprints: (course.total_sprints ?? 0) + totalSprints,
      total_tickets: (course.total_tickets ?? 0) + totalTickets,
    })
    .eq("id", courseId);

  if (updateCourseError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to update course ticket counts.",
      updateCourseError.message,
    );
  }

  return {
    courseId,
    mode,
    totalSprints,
    totalTickets,
  };
}

export async function generateTicketsForSprintId(
  supabaseClient: SupabaseClient,
  params: GenerateSprintTicketsParams,
): Promise<GenerateSprintTicketsResult> {
  const { courseId, sprintId, mode, targetTicketCount, materialIds } = params;
  const courseIdStr = String(courseId);
  const sprintIdStr = String(sprintId);

  const { data: sprint, error: sprintError } = await supabaseClient
    .from("sprints")
    .select("*")
    .eq("id", sprintIdStr)
    .maybeSingle();

  if (sprintError) {
    // eslint-disable-next-line no-console
    console.error("[generateTicketsForSprintId] Sprint fetch error:", sprintError.message, sprintError);
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to load sprint.",
      sprintError.message,
    );
  }

  if (!sprint) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Sprint not found.",
      undefined,
    );
  }

  const sprintCourseId = sprint.course_id == null ? "" : String(sprint.course_id);
  if (sprintCourseId !== courseIdStr) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Sprint does not belong to this course.",
      undefined,
    );
  }

  const { data: course, error: courseError } = await supabaseClient
    .from("courses")
    .select("*")
    .eq("id", courseIdStr)
    .single();

  if (courseError || !course) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Course not found.",
      courseError?.message,
    );
  }

  if (mode === "regenerate_all" || mode === "append") {
    const { error: deleteError } = await supabaseClient
      .from("tickets")
      .delete()
      .eq("course_id", courseIdStr)
      .eq("sprint_id", sprintIdStr)
      .eq("ai_generated", true);

    if (deleteError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to clear existing AI tickets for sprint.",
        deleteError.message,
      );
    }
  }

  let materialsQuery = supabaseClient
    .from("course_materials")
    .select("*")
    .eq("course_id", courseIdStr)
    .order("order_index", { ascending: true });

  if (materialIds && materialIds.length > 0) {
    materialsQuery = materialsQuery.in("id", materialIds);
  }

  const { data: materials, error: materialsError } = await materialsQuery;

  if (materialsError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to load course materials.",
      materialsError.message,
    );
  }

  let materialsToUse = materials ?? [];

  if (materialsToUse.length === 0 && materialIds && materialIds.length > 0) {
    const { data: allMaterials } = await supabaseClient
      .from("course_materials")
      .select("*")
      .eq("course_id", courseIdStr)
      .order("order_index", { ascending: true });
    if (allMaterials && allMaterials.length > 0) {
      materialsToUse = allMaterials;
    }
  }

  if (!materialsToUse.length) {
    const { count: totalForCourse } = await supabaseClient
      .from("course_materials")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseIdStr);
    // eslint-disable-next-line no-console
    console.warn(
      "[generate-for-sprint] NO_MATERIALS: courseId=%s materialIds=%s total rows for course in DB=%s",
      courseIdStr,
      materialIds?.length ?? 0,
      totalForCourse ?? "?",
    );
    throw new HttpError(
      400,
      "NO_MATERIALS",
      "No course materials found for this sprint. Upload materials in the course materials section first, then select which ones to use for this sprint.",
    );
  }

  const courseContext: CourseContext = {
    id: course.id,
    title: course.title,
    description: course.description ?? null,
    category: course.category ?? null,
    difficulty: course.difficulty ?? null,
  };

  const materialContext: CourseMaterialContext[] = materialsToUse.map(
    (m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? null,
      fileUrl: m.file_url ?? null,
      fileType: m.file_type ?? null,
    }),
  );

  const targetCount = targetTicketCount ?? 6;
  const maxPerRequest = 5;
  const generatedTickets: GeneratedTicket[] = [];
  let contextWithChunking: TicketGenerationContext = {
    course: courseContext,
    materials: materialContext,
    targetTicketCount: targetCount,
    maxTicketsPerRequest: Math.min(maxPerRequest, targetCount),
  };

  while (generatedTickets.length < targetCount) {
    const batch = await generateTicketsWithRateLimitHandling(contextWithChunking);
    if (batch.length === 0) break;
    generatedTickets.push(...batch);
    const requested = contextWithChunking.maxTicketsPerRequest ?? maxPerRequest;
    if (batch.length < requested || generatedTickets.length >= targetCount) break;
    contextWithChunking = {
      ...contextWithChunking,
      alreadyGeneratedTitles: generatedTickets.map((t) => t.title),
      maxTicketsPerRequest: Math.min(maxPerRequest, targetCount - generatedTickets.length),
    };
  }

  if (!generatedTickets.length) {
    throw new HttpError(
      500,
      "AI_EMPTY",
      "AI did not return any tickets for this sprint.",
    );
  }

  const ticketPayload = generatedTickets.map((t, index) => ({
    sprint_id: sprintIdStr,
    course_id: courseIdStr,
    title: t.title,
    description: t.description,
    type: t.type,
    challenge_type: t.challengeType,
    duration_estimate_minutes: t.durationEstimateMinutes,
    is_urgent: t.isUrgent,
    order_index: index,
    ai_generated: true,
  }));

  const { data: insertedTickets, error: ticketsError } = await supabaseClient
    .from("tickets")
    .insert(ticketPayload)
    .select("*");

  if (ticketsError || !insertedTickets) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to insert tickets.",
      ticketsError?.message,
    );
  }

  const scenarioPayload: {
    ticket_id: string;
    scenario_text: string;
    context: string | null;
    expected_outcome: string;
  }[] = [];
  const deliverablePayload: {
    ticket_id: string;
    description: string;
    order_index: number;
  }[] = [];

  for (let i = 0; i < generatedTickets.length; i++) {
    const t = generatedTickets[i];
    const ticket = insertedTickets[i];
    if (!ticket) continue;

    scenarioPayload.push({
      ticket_id: ticket.id,
      scenario_text: t.scenarioText,
      context: t.context ?? null,
      expected_outcome: t.expectedOutcome,
    });

    for (const d of t.deliverables) {
      deliverablePayload.push({
        ticket_id: ticket.id,
        description: d.description,
        order_index: d.orderIndex,
      });
    }
  }

  if (scenarioPayload.length > 0) {
    const { error: scenariosError } = await supabaseClient
      .from("ticket_scenarios")
      .insert(scenarioPayload);

    if (scenariosError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to insert ticket scenarios.",
        scenariosError.message,
      );
    }
  }

  if (deliverablePayload.length > 0) {
    const { error: deliverablesError } = await supabaseClient
      .from("ticket_deliverables")
      .insert(deliverablePayload);

    if (deliverablesError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to insert ticket deliverables.",
        deliverablesError.message,
      );
    }
  }

  const totalTickets = generatedTickets.length;

  const { error: updateCourseError } = await supabaseClient
    .from("courses")
    .update({
      ai_generated_tickets: true,
      total_tickets: (course.total_tickets ?? 0) + totalTickets,
    })
    .eq("id", courseIdStr);

  if (updateCourseError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to update course ticket counts.",
      updateCourseError.message,
    );
  }

  return {
    courseId,
    sprintId,
    mode,
    totalTickets,
  };
}

