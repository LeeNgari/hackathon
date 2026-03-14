import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockUser, mockCourses, Ticket } from "@/lib/mock-data";
import type { Course, Sprint } from "@/lib/mock-data";
import type { InstructorCourse } from "@/lib/instructor-data";
import type { User } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateTicketsForCourseApi,
  useGenerateSprintTickets,
} from "@/lib/api/ai";

// When Supabase auth is configured and user is logged in, use real user + profile.
// Otherwise fall back to mock data for demo/prototype.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function mapAuthToUser(
  userId: string,
  email: string | undefined,
  profile: { full_name: string; degree: string | null; institution: string | null; current_streak: number; best_streak: number }
): User {
  return {
    id: userId,
    name: profile.full_name || email || "User",
    email: email ?? "",
    degree: profile.degree ?? "",
    institution: profile.institution ?? "",
    joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    currentStreak: profile.current_streak,
    bestStreak: profile.best_streak,
    feeRefunded: 0,
    feeTotal: 0,
    ticketsCompleted: 0,
    certificates: [],
  };
}

export function useUser() {
  const { user: authUser, profile } = useAuth();
  const isAuthenticated = !!authUser && !!profile;

  return useQuery({
    queryKey: ["user", authUser?.id ?? "anonymous"],
    queryFn: async (): Promise<User> => {
      if (isAuthenticated && authUser && profile) {
        return mapAuthToUser(authUser.id, authUser.email, profile);
      }
      await delay(400);
      return mockUser;
    },
  });
}

export function useCourses() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', authUser?.id ?? 'anonymous'],
    queryFn: async (): Promise<Course[]> => {
      if (!supabase) {
        await delay(500);
        return mockCourses;
      }

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          category,
          difficulty,
          fee_amount,
          total_sprints,
          total_tickets,
          company_partner,
          profiles!instructor_id(full_name)
        `)
        .eq('status', 'live');

      if (coursesError) {
        console.error('[useCourses] Failed to load courses', coursesError);
        return [];
      }

      type CourseRow = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      const rows: CourseRow[] = (coursesData ?? []) as CourseRow[];

      let enrolledCourseIds = new Set<string>();
      if (authUser?.id) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', authUser.id)
          .eq('status', 'active');
        if (enrollments) {
          enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
        }
      }

      const getInstructorName = (c: CourseRow): string => {
        const p = c.profiles;
        const name = Array.isArray(p) ? p[0]?.full_name : p?.full_name;
        return c.company_partner ?? name ?? 'Instructor';
      };

      return rows.map((c): Course => ({
        id: c.id,
        title: c.title,
        instructor: getInstructorName(c),
        category: c.category as Course['category'],
        difficulty: c.difficulty as Course['difficulty'],
        totalSprints: c.total_sprints ?? 0,
        totalTickets: c.total_tickets ?? 0,
        fee: Number(c.fee_amount ?? 0),
        isEnrolled: enrolledCourseIds.has(c.id),
        sprints: [],
      }));
    },
  });
}

export function useEnrolledCourses() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', 'enrolled', authUser?.id ?? 'anonymous'],
    queryFn: async (): Promise<Course[]> => {
      if (!supabase || !authUser?.id) {
        await delay(300);
        return mockCourses.filter(c => c.isEnrolled);
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', authUser.id)
        .eq('status', 'active');

      if (enrollError || !enrollments?.length) {
        return [];
      }

      const courseIds = enrollments.map(e => e.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          category,
          difficulty,
          fee_amount,
          total_sprints,
          total_tickets,
          company_partner,
          profiles!instructor_id(full_name)
        `)
        .in('id', courseIds);

      if (coursesError || !coursesData?.length) {
        return [];
      }

      type Row = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      return (coursesData as Row[]).map((c): Course => ({
        id: c.id,
        title: c.title,
        instructor: c.company_partner ?? (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) ?? 'Instructor',
        category: c.category as Course['category'],
        difficulty: c.difficulty as Course['difficulty'],
        totalSprints: c.total_sprints ?? 0,
        totalTickets: c.total_tickets ?? 0,
        fee: Number(c.fee_amount ?? 0),
        isEnrolled: true,
        sprints: [],
      }));
    },
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string): Promise<void> => {
      if (!supabase) {
        await delay(500);
        return;
      }
      if (!authUser?.id) {
        throw new Error('You must be signed in to enroll.');
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: authUser.id,
          course_id: courseId,
          status: 'active',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already enrolled in this course.');
        }
        throw new Error(error.message ?? 'Enrollment failed.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
    },
  });
}

export function useInstructorCourses() {
  return useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: async () => {
      // If Supabase is not configured, fall back to an empty list.
      if (!supabase) {
        return [] as InstructorCourse[];
      }

      await delay(300);

      const { data, error } = await supabase
        .from('courses')
        .select(
          'id,title,category,difficulty,status,total_sprints,total_tickets,avg_rating,company_partner',
        )
        .neq('status', 'archived');

      if (error) {
        // eslint-disable-next-line no-console
        console.error('[useInstructorCourses] Failed to load courses', error);
        return [] as InstructorCourse[];
      }

      return (data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        difficulty: c.difficulty,
        status:
          c.status === 'live'
            ? 'Live'
            : c.status === 'under_review'
              ? 'Under Review'
              : 'Draft',
        studentsEnrolled: 0,
        sprints: c.total_sprints ?? 0,
        tickets: c.total_tickets ?? 0,
        completionRate: 0,
        avgRating: Number(c.avg_rating ?? 0),
        earnedToDate: 0,
        companyPartner: c.company_partner,
      })) as InstructorCourse[];
    },
  });
}

export interface InstructorCourseMaterial {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  orderIndex: number;
}

export interface InstructorTicketSummary {
  id: string;
  title: string;
  type: string | null;
  durationEstimateMinutes: number | null;
  isUrgent: boolean;
  orderIndex: number;
}

export interface InstructorSprintWithTickets {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  tickets: InstructorTicketSummary[];
}

export interface InstructorCourseDetailData {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  description: string | null;
  materials: InstructorCourseMaterial[];
  sprints: InstructorSprintWithTickets[];
}

export interface CreateSprintPayload {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface AssignMaterialsToSprintPayload {
  courseId: string;
  sprintId: string;
  materialIds: string[];
}

export interface UploadCourseMaterialPayload {
  courseId: string;
  file: File;
  title?: string;
  description?: string;
  shouldTriggerGeneration?: boolean;
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      title,
      description,
      orderIndex,
    }: CreateSprintPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot create sprint.",
        );
      }

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error("Sprint title is required.");
      }

      const { data, error } = await supabase
        .from("sprints")
        .insert({
          course_id: courseId,
          title: trimmedTitle,
          description: description?.trim() || null,
          order_index: orderIndex ?? 0,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(
          error?.message ?? "Failed to create sprint.",
        );
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", variables.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor", "courses"],
      });
    },
  });
}

export function useUploadCourseMaterial() {
  const queryClient = useQueryClient();

  const mapFileToMaterialType = (file: File): 'pdf' | 'video' | 'doc' | 'link' | 'other' => {
    const mime = (file.type || '').toLowerCase();
    const name = file.name.toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';

    if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi')) {
      return 'video';
    }

    if (
      mime === 'application/msword' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/vnd.ms-powerpoint' ||
      mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      name.endsWith('.ppt') ||
      name.endsWith('.pptx')
    ) {
      return 'doc';
    }

    if (mime === 'text/html' || mime === 'application/xhtml+xml' || name.endsWith('.html') || name.endsWith('.htm')) {
      return 'link';
    }

    return 'other';
  };

  return useMutation({
    mutationFn: async ({
      courseId,
      file,
      title,
      description,
      shouldTriggerGeneration,
    }: UploadCourseMaterialPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot upload course materials.",
        );
      }

      const existingDetail =
        queryClient.getQueryData<InstructorCourseDetailData | null>([
          "instructor",
          "course-detail",
          courseId,
        ]) ?? null;

      const hadNoMaterials =
        !existingDetail || (existingDetail.materials?.length ?? 0) === 0;
      const hadNoSprints =
        !existingDetail || (existingDetail.sprints?.length ?? 0) === 0;

      const baseName =
        title?.trim() ||
        file.name.replace(/\.[^/.]+$/, "").replace(/[_\-.]+/g, " ");

      const timestamp = Date.now();
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${courseId}/${timestamp}-${safeFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError || !uploadData) {
        throw new Error(
          uploadError?.message ?? "Failed to upload course material file.",
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("course-materials")
        .getPublicUrl(uploadData.path);

      const fileUrl = publicUrlData.publicUrl;

      const orderIndex =
        (existingDetail?.materials?.length ?? 0) > 0
          ? (existingDetail?.materials?.length ?? 0)
          : 0;

      const { data: insertedMaterials, error: insertError } = await supabase
        .from("course_materials")
        .insert({
          course_id: courseId,
          title: baseName,
          description: description?.trim() || null,
          file_url: fileUrl,
          file_type: mapFileToMaterialType(file),
          order_index: orderIndex,
        })
        .select("*");

      if (insertError || !insertedMaterials || !insertedMaterials[0]) {
        throw new Error(
          insertError?.message ??
            "Failed to save course material metadata in the database.",
        );
      }

      let generationResult: Awaited<
        ReturnType<typeof generateTicketsForCourseApi>
      > | null = null;

      if (shouldTriggerGeneration && hadNoMaterials && hadNoSprints) {
        try {
          generationResult = await generateTicketsForCourseApi(courseId, {
            mode: "initial",
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            "[useUploadCourseMaterial] Failed to auto-generate tickets",
            err,
          );
        }
      }

      return {
        material: insertedMaterials[0],
        generationResult,
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", variables.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor", "courses"],
      });
    },
  });
}

export function useAssignMaterialsToSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      sprintId,
      materialIds,
    }: AssignMaterialsToSprintPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot assign materials to sprint.",
        );
      }

      const { error: clearError } = await supabase
        .from("course_materials")
        .update({}) // no-op to satisfy type, actual mapping handled via separate join table if added
        .eq("course_id", courseId);

      if (clearError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useAssignMaterialsToSprint] Failed to clear existing sprint-material mapping",
          clearError,
        );
      }

      if (materialIds.length === 0) {
        return;
      }

      const { error: updateError } = await supabase
        .from("course_materials")
        .update({}) // placeholder, real mapping should be implemented via schema changes
        .in("id", materialIds);

      if (updateError) {
        throw new Error(
          updateError.message ??
            "Failed to assign materials to sprint.",
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "instructor",
          "course-detail",
          variables.courseId,
        ],
      });
    },
  });
}

export function useInstructorCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: ["instructor", "course-detail", courseId],
    enabled: !!courseId && !!supabase,
    queryFn: async (): Promise<InstructorCourseDetailData | null> => {
      if (!supabase || !courseId) return null;

      const client = supabase;

      const [
        { data: course, error: courseError },
        { data: materials, error: materialsError },
        { data: sprints, error: sprintsError },
        { data: tickets, error: ticketsError },
      ] = await Promise.all([
        client
          .from("courses")
          .select("id, title, category, difficulty, description")
          .eq("id", courseId)
          .single(),
        client
          .from("course_materials")
          .select("id, title, description, file_url, file_type, order_index")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
        client
          .from("sprints")
          .select("id, title, description, order_index")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
        client
          .from("tickets")
          .select(
            "id, title, type, duration_estimate_minutes, is_urgent, order_index, sprint_id",
          )
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
      ]);

      if (courseError || !course) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorCourseDetail] Failed to load course", courseError);
        return null;
      }

      if (materialsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load materials",
          materialsError,
        );
      }

      if (sprintsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load sprints",
          sprintsError,
        );
      }

      if (ticketsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load tickets",
          ticketsError,
        );
      }

      const materialsMapped: InstructorCourseMaterial[] = (materials ?? []).map(
        (m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description ?? null,
          fileUrl: m.file_url ?? null,
          fileType: m.file_type ?? null,
          orderIndex: m.order_index ?? 0,
        }),
      );

      const ticketsBySprintId = new Map<string, InstructorTicketSummary[]>();
      (tickets ?? []).forEach((t: any) => {
        const list = ticketsBySprintId.get(t.sprint_id) ?? [];
        list.push({
          id: t.id,
          title: t.title,
          type: t.type ?? null,
          durationEstimateMinutes: t.duration_estimate_minutes ?? null,
          isUrgent: !!t.is_urgent,
          orderIndex: t.order_index ?? 0,
        });
        ticketsBySprintId.set(t.sprint_id, list);
      });

      const sprintsMapped: InstructorSprintWithTickets[] = (sprints ?? []).map(
        (s: any) => {
          const sprintTickets = (ticketsBySprintId.get(s.id) ?? []).sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          return {
            id: s.id,
            title: s.title,
            description: s.description ?? null,
            orderIndex: s.order_index ?? 0,
            tickets: sprintTickets,
          };
        },
      );

      return {
        id: course.id,
        title: course.title,
        category: course.category ?? null,
        difficulty: course.difficulty ?? null,
        description: course.description ?? null,
        materials: materialsMapped,
        sprints: sprintsMapped,
      };
    },
  });
}

export interface TicketDetailData {
  title: string;
  type: string | null;
  durationEstimate: string;
  isUrgent: boolean;
  scenario: string | null;
  deliverables: string[];
}

/** Instructor: list attempts for a course (for review / Grade with AI). */
export interface InstructorAttemptListItem {
  id: string;
  ticket_id: string;
  ticket_title: string;
  student_id: string;
  student_name: string;
  status: AttemptStatus;
  submitted_at: string | null;
  ai_score: number | null;
  created_at: string;
}

export function useInstructorCourseAttempts(courseId: string | null) {
  return useQuery({
    queryKey: ["instructor", "course-attempts", courseId],
    enabled: !!courseId && !!supabase,
    queryFn: async (): Promise<InstructorAttemptListItem[]> => {
      if (!supabase || !courseId) return [];

      const { data: ticketRows, error: ticketsError } = await supabase
        .from("tickets")
        .select("id")
        .eq("course_id", courseId);

      if (ticketsError || !ticketRows?.length) return [];

      const ticketIds = ticketRows.map((t: { id: string }) => t.id);

      const { data: attemptRows, error: attemptsError } = await supabase
        .from("ticket_attempts")
        .select(
          `
          id,
          ticket_id,
          student_id,
          status,
          submitted_at,
          ai_score,
          created_at,
          tickets(title),
          profiles(full_name)
        `
        )
        .in("ticket_id", ticketIds)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (attemptsError) {
        console.error("[useInstructorCourseAttempts]", attemptsError);
        return [];
      }

      const list = (attemptRows ?? []).map((row: Record<string, unknown>) => {
        const tickets = row.tickets as { title: string } | null;
        const profiles = row.profiles as { full_name: string } | null;
        return {
          id: row.id as string,
          ticket_id: row.ticket_id as string,
          ticket_title: tickets?.title ?? "—",
          student_id: row.student_id as string,
          student_name: profiles?.full_name ?? "Student",
          status: row.status as AttemptStatus,
          submitted_at: row.submitted_at as string | null,
          ai_score: row.ai_score as number | null,
          created_at: row.created_at as string,
        };
      });

      return list;
    },
  });
}

/** Instructor: full detail for one attempt (for review sheet). */
export interface InstructorAttemptDetail {
  attempt: TicketAttemptRow;
  deliverableSubmissions: (DeliverableSubmissionRow & { deliverable_description?: string })[];
}

export function useInstructorAttemptDetail(attemptId: string | null) {
  return useQuery({
    queryKey: ["instructor", "attempt-detail", attemptId],
    enabled: !!attemptId && !!supabase,
    queryFn: async (): Promise<InstructorAttemptDetail | null> => {
      if (!supabase || !attemptId) return null;

      const { data: attempt, error: attemptError } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptError || !attempt) return null;

      const { data: subs, error: subsError } = await supabase
        .from("deliverable_submissions")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      if (subsError) return { attempt: attempt as TicketAttemptRow, deliverableSubmissions: [] };

      const deliverableIds = (subs ?? []).map((s: { deliverable_id: string }) => s.deliverable_id);
      let descriptions: Record<string, string> = {};
      if (deliverableIds.length > 0) {
        const { data: delivRows } = await supabase
          .from("ticket_deliverables")
          .select("id, description")
          .in("id", deliverableIds);
        descriptions = ((delivRows ?? []) as { id: string; description: string }[]).reduce(
          (acc, d) => {
            acc[d.id] = d.description;
            return acc;
          },
          {} as Record<string, string>
        );
      }

      const deliverableSubmissions = (subs ?? []).map(
        (s: DeliverableSubmissionRow & { deliverable_id: string }) => ({
          ...s,
          deliverable_description: descriptions[s.deliverable_id] ?? "",
        })
      );

      return {
        attempt: attempt as TicketAttemptRow,
        deliverableSubmissions,
      };
    },
  });
}

/** Fetch a single ticket's scenario and deliverables (for instructor Supabase path). */
export function useInstructorTicketDetail(
  courseId: string | null,
  ticketId: string | null
) {
  return useQuery({
    queryKey: ["instructor", "ticket-detail", courseId, ticketId],
    enabled: !!courseId && !!ticketId && !!supabase,
    queryFn: async (): Promise<TicketDetailData | null> => {
      if (!supabase || !ticketId) return null;

      const [
        { data: ticket, error: ticketError },
        { data: scenarioRow, error: scenarioError },
        { data: deliverableRows, error: deliverablesError },
      ] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, title, type, duration_estimate_minutes, is_urgent")
          .eq("id", ticketId)
          .single(),
        supabase
          .from("ticket_scenarios")
          .select("scenario_text")
          .eq("ticket_id", ticketId)
          .maybeSingle(),
        supabase
          .from("ticket_deliverables")
          .select("description, order_index")
          .eq("ticket_id", ticketId)
          .order("order_index", { ascending: true }),
      ]);

      if (ticketError || !ticket) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load ticket", ticketError);
        return null;
      }
      if (scenarioError) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load scenario", scenarioError);
      }
      if (deliverablesError) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load deliverables", deliverablesError);
      }

      const scenario =
        scenarioRow?.scenario_text ?? null;
      const deliverables = (deliverableRows ?? []).map(
        (r: { description: string }) => r.description
      );

      const mins = ticket.duration_estimate_minutes ?? 0;
      const durationEstimate =
        mins >= 60
          ? `${Math.floor(mins / 60)} h ${mins % 60} min`
          : `${mins} mins`;

      return {
        title: ticket.title,
        type: ticket.type ?? null,
        durationEstimate,
        isUrgent: !!ticket.is_urgent,
        scenario,
        deliverables,
      };
    },
  });
}

export function useCourse(id: string) {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', id, authUser?.id ?? 'anonymous'],
    enabled: !!id,
    queryFn: async (): Promise<Course> => {
      if (!supabase || !id) {
        await delay(400);
        const course = mockCourses.find(c => c.id === id);
        if (!course) throw new Error("Course not found");
        return course;
      }

      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          category,
          difficulty,
          fee_amount,
          total_sprints,
          total_tickets,
          company_partner,
          profiles!instructor_id(full_name)
        `)
        .eq('id', id)
        .single();

      if (courseError || !courseRow) {
        throw new Error("Course not found");
      }

      type CourseRow = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      const c = courseRow as CourseRow;
      const instructorName = c.company_partner ?? (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) ?? 'Instructor';

      const { data: sprintsRows, error: sprintsError } = await supabase
        .from('sprints')
        .select('id, title, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (sprintsError) throw new Error("Failed to load course content");

      const sprintsList = sprintsRows ?? [];

      const { data: ticketsRows, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, sprint_id, title, type, duration_estimate_minutes, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (ticketsError) throw new Error("Failed to load course content");

      const ticketsList = ticketsRows ?? [];

      let enrollment: { progress_percent: number; current_sprint_id: string | null } | null = null;
      const passedTicketIds = new Set<string>();
      const attemptedTicketIds = new Set<string>();
      if (authUser?.id) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('id, progress_percent, current_sprint_id')
          .eq('course_id', id)
          .eq('student_id', authUser.id)
          .eq('status', 'active')
          .maybeSingle();
        if (enrollData) {
          enrollment = { progress_percent: Number(enrollData.progress_percent ?? 0), current_sprint_id: enrollData.current_sprint_id };
          const { data: passedAttempts } = await supabase
            .from('ticket_attempts')
            .select('ticket_id')
            .eq('enrollment_id', enrollData.id)
            .eq('status', 'passed');
          if (passedAttempts) passedAttempts.forEach(a => passedTicketIds.add(a.ticket_id));
          const { data: anyAttempts } = await supabase
            .from('ticket_attempts')
            .select('ticket_id')
            .eq('enrollment_id', enrollData.id);
          if (anyAttempts) anyAttempts.forEach(a => attemptedTicketIds.add(a.ticket_id));
        }
      }

      const currentSprintId = enrollment?.current_sprint_id ?? sprintsList[0]?.id ?? null;
      const sprintOrder = new Map(sprintsList.map((s, i) => [s.id, i]));
      type TicketStatus = Ticket['status'];
      const getTicketStatus = (ticketId: string, sprintId: string): TicketStatus => {
        if (passedTicketIds.has(ticketId)) return 'Completed';
        const sprintIdx = sprintOrder.get(sprintId) ?? 0;
        const currentIdx = currentSprintId != null ? (sprintOrder.get(currentSprintId) ?? 0) : 0;
        if (sprintIdx < currentIdx) return 'Active';
        if (sprintIdx > currentIdx) return 'Locked';
        return 'Active';
      };

      const ticketsBySprint = new Map<string, typeof ticketsList>();
      for (const t of ticketsList) {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push(t);
        ticketsBySprint.set(t.sprint_id, list);
      }

      const sprints: Sprint[] = sprintsList.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order_index ?? 0,
        tickets: (ticketsBySprint.get(s.id) ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          type: (t.type ?? 'Build') as Ticket['type'],
          durationEstimate: t.duration_estimate_minutes != null ? `${t.duration_estimate_minutes} mins` : '30 mins',
          status: getTicketStatus(t.id, s.id),
          hasAttemptedBefore: attemptedTicketIds.has(t.id),
        } as Ticket)),
      }));

      return {
        id: c.id,
        title: c.title,
        instructor: instructorName,
        category: c.category as Course['category'],
        difficulty: c.difficulty as Course['difficulty'],
        totalSprints: c.total_sprints ?? 0,
        totalTickets: c.total_tickets ?? 0,
        fee: Number(c.fee_amount ?? 0),
        progressPercent: enrollment ? Number(enrollment.progress_percent) : 0,
        currentSprint: currentSprintId ? (sprintOrder.get(currentSprintId) ?? 0) + 1 : 1,
        sprints,
        isEnrolled: !!enrollment,
      };
    },
  });
}

export function useTicket(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['courses', courseId, 'tickets', ticketId],
    enabled: (options?.enabled !== false && !!ticketId && !!courseId),
    queryFn: async (): Promise<Ticket> => {
      if (!supabase || !ticketId || !courseId) {
        await delay(300);
        const course = mockCourses.find(c => c.id === courseId);
        if (!course) throw new Error("Course not found");
        let foundTicket: Ticket | undefined;
        for (const sprint of course.sprints) {
          const t = sprint.tickets.find(t => t.id === ticketId);
          if (t) foundTicket = t;
        }
        if (!foundTicket) throw new Error("Ticket not found");
        return foundTicket;
      }

      const { data: ticketRow, error: ticketError } = await supabase
        .from('tickets')
        .select('id, title, type, duration_estimate_minutes, is_urgent')
        .eq('id', ticketId)
        .eq('course_id', courseId)
        .single();

      if (ticketError || !ticketRow) {
        throw new Error("Ticket not found");
      }

      const [scenarioRes, deliverablesRes] = await Promise.all([
        supabase
          .from('ticket_scenarios')
          .select('scenario_text')
          .eq('ticket_id', ticketId)
          .maybeSingle(),
        supabase
          .from('ticket_deliverables')
          .select('description')
          .eq('ticket_id', ticketId)
          .order('order_index', { ascending: true }),
      ]);

      const scenario = scenarioRes.data && !scenarioRes.error
        ? (scenarioRes.data as { scenario_text: string }).scenario_text
        : undefined;
      const deliverables = deliverablesRes.data && !deliverablesRes.error
        ? (deliverablesRes.data as { description: string }[]).map(d => d.description)
        : undefined;

      const t = ticketRow as {
        id: string;
        title: string;
        type: string;
        duration_estimate_minutes: number | null;
        is_urgent: boolean;
      };

      return {
        id: t.id,
        title: t.title,
        type: (t.type ?? 'Build') as Ticket['type'],
        durationEstimate: t.duration_estimate_minutes != null ? `${t.duration_estimate_minutes} mins` : '30 mins',
        status: 'Active',
        isUrgent: !!t.is_urgent,
        scenario: scenario ?? undefined,
        deliverables: deliverables ?? undefined,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Ticket attempt: get-or-create in_progress attempt + deliverable submissions
// ---------------------------------------------------------------------------
export type AttemptStatus = "in_progress" | "submitted" | "passed" | "failed";

export interface TicketAttemptRow {
  id: string;
  student_id: string;
  ticket_id: string;
  enrollment_id: string;
  status: AttemptStatus;
  submission_text: string | null;
  submission_code: string | null;
  submission_files: unknown;
  ai_score: number | null;
  ai_review_text: string | null;
  time_spent_minutes: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliverableSubmissionRow {
  id: string;
  attempt_id: string;
  deliverable_id: string;
  content: string;
  ai_score: number | null;
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketAttemptData {
  attempt: TicketAttemptRow | null;
  deliverableSubmissions: DeliverableSubmissionRow[];
  noEnrollment: boolean;
  /** True when current attempt is in_progress and user has at least one completed attempt (submitted/passed/failed) for this ticket */
  hasAttemptedBefore: boolean;
}

export function useTicketAttempt(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ["ticket-attempt", courseId, ticketId, authUser?.id ?? "anonymous"],
    enabled:
      options?.enabled !== false && !!ticketId && !!courseId && !!authUser?.id && !!supabase,
    queryFn: async (): Promise<TicketAttemptData> => {
      if (!supabase || !authUser?.id || !ticketId || !courseId) {
        return { attempt: null, deliverableSubmissions: [], noEnrollment: true, hasAttemptedBefore: false };
      }

      // 1. Get enrollment for this student + course
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (enrollError || !enrollment) {
        return { attempt: null, deliverableSubmissions: [], noEnrollment: true, hasAttemptedBefore: false };
      }

      const enrollmentId = enrollment.id;

      // 2. Look for existing in_progress attempt
      const { data: existingAttempt, error: attemptFindError } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("ticket_id", ticketId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptFindError) {
        console.error("[useTicketAttempt] Failed to find attempt", attemptFindError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      if (existingAttempt) {
        const { data: subs } = await supabase
          .from("deliverable_submissions")
          .select("*")
          .eq("attempt_id", existingAttempt.id)
          .order("created_at", { ascending: true });
        const { count: completedCount } = await supabase
          .from("ticket_attempts")
          .select("*", { count: "exact", head: true })
          .eq("enrollment_id", enrollmentId)
          .eq("ticket_id", ticketId)
          .in("status", ["submitted", "passed", "failed"]);
        return {
          attempt: existingAttempt as TicketAttemptRow,
          deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
          noEnrollment: false,
          hasAttemptedBefore: (completedCount ?? 0) >= 1,
        };
      }

      // 3. Load any existing attempt (e.g. submitted/passed/failed) for this enrollment+ticket to return for display
      const { data: anyAttempt } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("ticket_id", ticketId)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (anyAttempt) {
        const { data: subs } = await supabase
          .from("deliverable_submissions")
          .select("*")
          .eq("attempt_id", anyAttempt.id)
          .order("created_at", { ascending: true });
        return {
          attempt: anyAttempt as TicketAttemptRow,
          deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
          noEnrollment: false,
          hasAttemptedBefore: false,
        };
      }

      // 4. Create new attempt: get ticket_deliverables for this ticket
      const { data: deliverables, error: delivError } = await supabase
        .from("ticket_deliverables")
        .select("id")
        .eq("ticket_id", ticketId)
        .order("order_index", { ascending: true });

      if (delivError || !deliverables?.length) {
        console.error("[useTicketAttempt] No deliverables for ticket", delivError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      const { data: newAttempt, error: insertAttemptError } = await supabase
        .from("ticket_attempts")
        .insert({
          student_id: authUser.id,
          ticket_id: ticketId,
          enrollment_id: enrollmentId,
          status: "in_progress",
        })
        .select("*")
        .single();

      if (insertAttemptError || !newAttempt) {
        console.error("[useTicketAttempt] Failed to create attempt", insertAttemptError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      const attemptId = (newAttempt as { id: string }).id;
      const subsPayload = deliverables.map((d: { id: string }) => ({
        attempt_id: attemptId,
        deliverable_id: d.id,
        content: "",
      }));

      const { error: insertSubsError } = await supabase
        .from("deliverable_submissions")
        .insert(subsPayload);

      if (insertSubsError) {
        console.error("[useTicketAttempt] Failed to create deliverable submissions", insertSubsError);
        return {
          attempt: newAttempt as TicketAttemptRow,
          deliverableSubmissions: [],
          noEnrollment: false,
          hasAttemptedBefore: false,
        };
      }

      const { data: subs } = await supabase
        .from("deliverable_submissions")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      return {
        attempt: newAttempt as TicketAttemptRow,
        deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
        noEnrollment: false,
        hasAttemptedBefore: false,
      };
    },
  });
}

/** Start a new attempt for a ticket (e.g. after previous attempt was graded). Invalidates ticket-attempt query. */
export function useStartNewTicketAttempt() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (params: { courseId: string; ticketId: string }) => {
      if (!supabase || !authUser?.id) throw new Error("Not authenticated");
      const { courseId, ticketId } = params;

      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (enrollError || !enrollment) throw new Error("Enrollment not found");

      const { data: deliverables, error: delivError } = await supabase
        .from("ticket_deliverables")
        .select("id")
        .eq("ticket_id", ticketId)
        .order("order_index", { ascending: true });

      if (delivError || !deliverables?.length) throw new Error("No deliverables for this ticket");

      const { data: newAttempt, error: insertAttemptError } = await supabase
        .from("ticket_attempts")
        .insert({
          student_id: authUser.id,
          ticket_id: ticketId,
          enrollment_id: enrollment.id,
          status: "in_progress",
        })
        .select("*")
        .single();

      if (insertAttemptError || !newAttempt) throw new Error("Failed to start new attempt");

      const attemptId = (newAttempt as { id: string }).id;
      const subsPayload = deliverables.map((d: { id: string }) => ({
        attempt_id: attemptId,
        deliverable_id: d.id,
        content: "",
      }));

      const { error: insertSubsError } = await supabase
        .from("deliverable_submissions")
        .insert(subsPayload);

      if (insertSubsError) throw new Error("Failed to create deliverable submissions");

      return { attemptId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-attempt", variables.courseId, variables.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useSubmitTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      ticketId: string;
      attemptId: string;
      content: string;
      timeSpentMinutes?: number;
    }) => {
      if (!supabase) throw new Error("Not connected");
      const { attemptId, content, timeSpentMinutes } = params;

      const now = new Date().toISOString();

      // Get deliverable_submissions for this attempt (ordered) to update first one
      const { data: submissions, error: fetchSubsError } = await supabase
        .from("deliverable_submissions")
        .select("id, deliverable_id")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      if (fetchSubsError || !submissions?.length) {
        throw new Error("Could not load submissions for this attempt.");
      }

      const firstId = submissions[0].id;
      const { error: updateSubError } = await supabase
        .from("deliverable_submissions")
        .update({ content: content || "" })
        .eq("id", firstId);

      if (updateSubError) throw new Error("Failed to save your work.");

      const updatePayload: {
        status: "submitted";
        submitted_at: string;
        submission_text?: string;
        time_spent_minutes?: number;
      } = {
        status: "submitted",
        submitted_at: now,
        submission_text: content,
      };
      if (timeSpentMinutes != null) updatePayload.time_spent_minutes = timeSpentMinutes;

      const { error: updateAttemptError } = await supabase
        .from("ticket_attempts")
        .update(updatePayload)
        .eq("id", attemptId);

      if (updateAttemptError) throw new Error("Failed to submit attempt.");

      return { success: true, attemptId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-attempt", variables.courseId, variables.ticketId],
      });
    },
  });
}
