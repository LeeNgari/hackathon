import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../errors.js";
import type {
  GradingContext,
  GradingResult,
} from "../ai/types.js";
import { gradeSubmission } from "../ai/llmClient.js";

export interface GradeAttemptParams {
  ticketId: string;
  attemptId: string;
}

export interface GradeAttemptResult extends GradingResult {
  ticketId: string;
  attemptId: string;
}

export async function gradeAttemptForTicket(
  supabaseClient: SupabaseClient,
  params: GradeAttemptParams,
): Promise<GradeAttemptResult> {
  const { ticketId, attemptId } = params;

  const { data: ticket, error: ticketError } = await supabaseClient
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Ticket not found.",
      ticketError?.message,
    );
  }

  const { data: scenario, error: scenarioError } = await supabaseClient
    .from("ticket_scenarios")
    .select("*")
    .eq("ticket_id", ticketId)
    .single();

  if (scenarioError || !scenario) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Ticket scenario not found for this ticket.",
      scenarioError?.message,
    );
  }

  const { data: deliverables, error: deliverablesError } =
    await supabaseClient
      .from("ticket_deliverables")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("order_index", { ascending: true });

  if (deliverablesError || !deliverables) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to load ticket deliverables.",
      deliverablesError?.message,
    );
  }

  const { data: attempt, error: attemptError } = await supabaseClient
    .from("ticket_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Ticket attempt not found.",
      attemptError?.message,
    );
  }

  const {
    data: deliverableSubmissions,
    error: submissionsError,
  } = await supabaseClient
    .from("deliverable_submissions")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  if (submissionsError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to load deliverable submissions.",
      submissionsError.message,
    );
  }

  const gradingContext: GradingContext = {
    ticket: {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description ?? null,
      type: ticket.type ?? null,
      challengeType: ticket.challenge_type,
    },
    scenario: {
      scenarioText: scenario.scenario_text,
      context: scenario.context ?? null,
      expectedOutcome: scenario.expected_outcome ?? null,
    },
    deliverables: deliverables.map((d) => ({
      id: d.id,
      description: d.description,
      orderIndex: d.order_index,
    })),
    submissions: (deliverableSubmissions ?? []).map((s) => ({
      deliverableId: s.deliverable_id,
      content: s.content ?? "",
    })),
    submissionCode: attempt.submission_code ?? null,
    submissionText: attempt.submission_text ?? null,
  };

  const gradingResult: GradingResult = await gradeSubmission(
    gradingContext,
  );

  const now = new Date().toISOString();
  const defaultThreshold =
    typeof process !== "undefined" && process.env.PASS_THRESHOLD_DEFAULT != null
      ? Number.parseInt(process.env.PASS_THRESHOLD_DEFAULT, 10)
      : 70;
  const passedThreshold =
    ticket.pass_threshold_percent != null
      ? ticket.pass_threshold_percent
      : (Number.isFinite(defaultThreshold) ? defaultThreshold : 70);
  const attemptStatus =
    gradingResult.overallScore >= passedThreshold
      ? "passed"
      : "failed";

  const { error: updateAttemptError } = await supabaseClient
    .from("ticket_attempts")
    .update({
      ai_score: gradingResult.overallScore,
      ai_review_text: gradingResult.overallFeedback,
      status: attemptStatus,
      reviewed_at: now,
    })
    .eq("id", attemptId);

  if (updateAttemptError) {
    throw new HttpError(
      500,
      "DB_ERROR",
      "Failed to update ticket attempt with AI grade.",
      updateAttemptError.message,
    );
  }

  for (const d of gradingResult.perDeliverable) {
    const { error: updateSubmissionError } = await supabaseClient
      .from("deliverable_submissions")
      .update({
        ai_score: d.score,
        ai_feedback: d.feedback,
      })
      .eq("attempt_id", attemptId)
      .eq("deliverable_id", d.deliverableId);

    if (updateSubmissionError) {
      throw new HttpError(
        500,
        "DB_ERROR",
        "Failed to update deliverable submission with AI grade.",
        updateSubmissionError.message,
      );
    }
  }

  return {
    ticketId,
    attemptId,
    ...gradingResult,
  };
}

