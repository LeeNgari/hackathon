import { Router } from "express";
import { getSupabaseClient } from "../supabaseClient.js";
import { HttpError } from "../errors.js";
import { getAuthUserId } from "../auth.js";
import {
  generateTicketsForCourseId,
  generateTicketsForSprintId,
} from "../services/ticketGenerationService.js";
import {
  gradeAttemptForTicket,
} from "../services/ticketGradingService.js";

export const ticketsRouter = Router();

ticketsRouter.post("/generate", async (req, res) => {
  try {
    const courseId = (req.query.courseId as string | undefined) ??
      (req.body?.courseId as string | undefined);
    const modeParam =
      (req.query.mode as string | undefined) ??
      (req.body?.mode as string | undefined) ?? "initial";
    const targetTicketCountParam =
      (req.query.targetTicketCount as string | undefined) ??
      (req.body?.targetTicketCount as string | undefined);

    if (!courseId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Missing courseId parameter.",
        },
      });
    }

    const mode = modeParam as
      | "initial"
      | "regenerate_all"
      | "append";

    const targetTicketCount = targetTicketCountParam
      ? Number(targetTicketCountParam)
      : undefined;

    const supabase = getSupabaseClient();

    const result = await generateTicketsForCourseId(supabase, {
      courseId,
      mode,
      targetTicketCount,
    });

    return res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    const message = (err as Error)?.message ?? "Unexpected error generating tickets.";
    // eslint-disable-next-line no-console
    console.error("generate tickets error", message);
    const isRateLimit = typeof message === "string" && (message.includes("429") || /rate-limit|rate limit/i.test(message));
    return res.status(isRateLimit ? 429 : 500).json({
      error: {
        code: isRateLimit ? "RATE_LIMITED" : "INTERNAL_ERROR",
        message: isRateLimit ? "AI provider is temporarily rate-limited. Please try again in a moment." : "Unexpected error generating tickets.",
      },
    });
  }
});

ticketsRouter.post(["/generate-for-sprint", "/generate-for-sprint/"], async (req, res) => {
  try {
    const sprintId =
      (req.query.sprintId as string | undefined) ??
      (req.body?.sprintId as string | undefined);
    const courseId =
      (req.query.courseId as string | undefined) ??
      (req.body?.courseId as string | undefined);
    let materialIds = req.body?.materialIds;
    if (materialIds != null && !Array.isArray(materialIds)) {
      materialIds = [materialIds] as string[];
    }
    if (Array.isArray(materialIds) && materialIds.length === 0) {
      materialIds = undefined;
    }
    const modeParam =
      (req.query.mode as string | undefined) ??
      (req.body?.mode as string | undefined) ??
      "initial";
    const targetTicketCountParam =
      (req.query.targetTicketCount as string | undefined) ??
      (req.body?.targetTicketCount as string | undefined);

    if (!sprintId || !courseId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Missing sprintId or courseId parameter.",
        },
      });
    }

    const mode = modeParam as "initial" | "regenerate_all" | "append";

    const targetTicketCount = targetTicketCountParam
      ? Number(targetTicketCountParam)
      : undefined;

    const supabase = getSupabaseClient();

    const result = await generateTicketsForSprintId(supabase, {
      courseId,
      sprintId,
      mode,
      targetTicketCount,
      materialIds,
    });

    return res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    const message = (err as Error)?.message ?? "Unexpected error generating tickets for sprint.";
    // eslint-disable-next-line no-console
    console.error("generate tickets for sprint error", err);
    const isRateLimit = typeof message === "string" && (message.includes("429") || /rate-limit|rate limit/i.test(message));
    return res.status(isRateLimit ? 429 : 500).json({
      error: {
        code: isRateLimit ? "RATE_LIMITED" : "INTERNAL_ERROR",
        message: isRateLimit ? "AI provider is temporarily rate-limited. Please try again in a moment." : message,
      },
    });
  }
});

ticketsRouter.post("/grade", async (req, res) => {
  try {
    const ticketId = req.body?.ticketId as string | undefined;
    const attemptId = req.body?.attemptId as string | undefined;

    if (!ticketId || !attemptId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message:
            "ticketId and attemptId are required in the request body.",
        },
      });
    }

    const supabase = getSupabaseClient();
    const userId = await getAuthUserId(req);

    if (userId) {
      const { data: attempt, error: attemptErr } = await supabase
        .from("ticket_attempts")
        .select("student_id")
        .eq("id", attemptId)
        .single();

      if (attemptErr || !attempt) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket attempt not found." },
        });
      }

      const isStudent = attempt.student_id === userId;
      if (!isStudent) {
        const { data: ticket, error: ticketErr } = await supabase
          .from("tickets")
          .select("course_id")
          .eq("id", ticketId)
          .single();
        if (ticketErr || !ticket) {
          return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Not allowed to grade this attempt." },
          });
        }
        const { data: course } = await supabase
          .from("courses")
          .select("instructor_id")
          .eq("id", ticket.course_id)
          .single();
        const isInstructor = course?.instructor_id === userId;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        const isAdmin = profile?.role === "admin";
        if (!isInstructor && !isAdmin) {
          return res.status(403).json({
            error: { code: "FORBIDDEN", message: "Not allowed to grade this attempt." },
          });
        }
      }
    }

    const result = await gradeAttemptForTicket(supabase, {
      ticketId,
      attemptId,
    });

    return res.status(200).json({ data: result });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    // eslint-disable-next-line no-console
    console.error("grade attempt error", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error grading attempt.",
      },
    });
  }
});

/** Manual override: set attempt status to passed or failed (instructor/admin only). */
ticketsRouter.patch("/attempts/:attemptId", async (req, res) => {
  try {
    const attemptId = req.params?.attemptId as string | undefined;
    const status = req.body?.status as string | undefined;

    if (!attemptId || !status || (status !== "passed" && status !== "failed")) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "attemptId in path and status (passed|failed) in body are required.",
        },
      });
    }

    const userId = await getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const supabase = getSupabaseClient();

    const { data: attempt, error: attemptErr } = await supabase
      .from("ticket_attempts")
      .select("ticket_id")
      .eq("id", attemptId)
      .single();

    if (attemptErr || !attempt) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket attempt not found." },
      });
    }

    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("course_id")
      .eq("id", attempt.ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id")
      .eq("id", ticket.course_id)
      .single();

    const isInstructor = course?.instructor_id === userId;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const isAdmin = profile?.role === "admin";

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only the course instructor or admin can override status." },
      });
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("ticket_attempts")
      .update({
        status,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", attemptId);

    if (updateErr) {
      return res.status(500).json({
        error: {
          code: "DB_ERROR",
          message: "Failed to update attempt status.",
          details: updateErr.message,
        },
      });
    }

    return res.status(200).json({ data: { attemptId, status } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("override attempt error", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error updating attempt.",
      },
    });
  }
});

