import { useMutation, useQueryClient } from "@tanstack/react-query";

/** In dev, use "" so /api is same-origin and Vite proxy forwards to backend. */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

/** Parse JSON from response; if body is HTML (e.g. proxy error page), throw a clear error. */
async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const hint =
      res.status === 404
        ? "Backend returned 404. Is the server running?"
        : /^\s*</.test(text)
          ? "Server returned HTML instead of JSON. Is the backend running on port 4000?"
          : `Server returned ${res.status}. Response was not JSON.`;
    throw new Error(`${hint} (API: ${API_BASE_URL || "same origin"})`);
  }
}

interface GenerateTicketsResponse {
  data?: {
    courseId: string;
    mode: string;
    totalSprints: number;
    totalTickets: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type GenerateTicketsMode =
  | "initial"
  | "regenerate_all"
  | "append";

export async function generateTicketsForCourseApi(
  courseId: string,
  options?: {
    mode?: GenerateTicketsMode;
    targetTicketCount?: number;
  },
): Promise<GenerateTicketsResponse> {
  const params = new URLSearchParams();
  params.set("courseId", courseId);
  if (options?.mode) params.set("mode", options.mode);
  if (options?.targetTicketCount != null) {
    params.set(
      "targetTicketCount",
      String(options.targetTicketCount),
    );
  }

  const res = await fetch(
    `${API_BASE_URL}/api/tickets/generate?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const json = await parseJsonOrThrow<GenerateTicketsResponse>(res);
  if (!res.ok && json.error) {
    throw new Error(json.error.message);
  }

  return json;
}

interface GenerateSprintTicketsResponse {
  data?: {
    courseId: string;
    sprintId: string;
    mode: string;
    totalTickets: number;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export async function generateTicketsForSprintApi(
  courseId: string,
  sprintId: string,
  options?: {
    mode?: GenerateTicketsMode;
    targetTicketCount?: number;
    materialIds?: string[];
  },
): Promise<GenerateSprintTicketsResponse> {
  const body: Record<string, unknown> = {
    courseId,
    sprintId,
  };

  if (options?.mode) {
    body.mode = options.mode;
  }

  if (options?.targetTicketCount != null) {
    body.targetTicketCount = options.targetTicketCount;
  }

  if (options?.materialIds && options.materialIds.length > 0) {
    body.materialIds = options.materialIds;
  }

  const res = await fetch(
    `${API_BASE_URL}/api/tickets/generate-for-sprint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const json = await parseJsonOrThrow<GenerateSprintTicketsResponse>(res);
  if (!res.ok && json.error) {
    const msg = json.error.details
      ? `${json.error.message}: ${json.error.details}`
      : json.error.message;
    throw new Error(msg);
  }

  return json;
}

interface GradeAttemptResponse {
  data?: {
    ticketId: string;
    attemptId: string;
    overallScore: number;
    overallFeedback: string;
    perDeliverable: {
      deliverableId: string;
      score: number;
      feedback: string;
    }[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function gradeAttemptApi(
  ticketId: string,
  attemptId: string,
  accessToken?: string | null,
): Promise<GradeAttemptResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch(`${API_BASE_URL}/api/tickets/grade`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ticketId, attemptId }),
  });

  const json = await parseJsonOrThrow<GradeAttemptResponse>(res);
  if (!res.ok && json.error) {
    throw new Error(json.error.message);
  }

  return json;
}

export function useGenerateTickets(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["ai-generate-tickets", courseId],
    mutationFn: (options?: {
      mode?: GenerateTicketsMode;
      targetTicketCount?: number;
    }) => generateTicketsForCourseApi(courseId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] });
    },
  });
}

export function useGenerateSprintTickets(
  courseId: string,
  sprintId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [
      "ai-generate-sprint-tickets",
      courseId,
      sprintId,
    ],
    mutationFn: (options?: {
      mode?: GenerateTicketsMode;
      targetTicketCount?: number;
      materialIds?: string[];
    }) =>
      generateTicketsForSprintApi(
        courseId,
        sprintId,
        options,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", courseId],
      });
    },
  });
}

export function useGradeAttempt(
  ticketId: string,
  attemptId: string,
  options?: { getAccessToken?: () => string | null | undefined },
) {
  return useMutation({
    mutationKey: [
      "ai-grade-attempt",
      ticketId,
      attemptId,
    ],
    mutationFn: () =>
      gradeAttemptApi(
        ticketId,
        attemptId,
        options?.getAccessToken?.() ?? undefined,
      ),
  });
}

export async function overrideAttemptStatusApi(
  attemptId: string,
  status: "passed" | "failed",
  accessToken: string,
): Promise<{ data?: { attemptId: string; status: string }; error?: { message: string } }> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/attempts/${attemptId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });
  const json = await parseJsonOrThrow<{ data?: { attemptId: string; status: string }; error?: { message: string } }>(res);
  if (!res.ok && json.error) {
    throw new Error(json.error.message);
  }
  return json;
}

