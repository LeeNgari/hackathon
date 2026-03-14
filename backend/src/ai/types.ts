export type TicketChallengeType = "coding" | "report";

export interface CourseContext {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
}

export interface CourseMaterialContext {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
}

export interface GeneratedDeliverable {
  id: string;
  description: string;
  orderIndex: number;
}

export interface GeneratedTicket {
  title: string;
  description: string;
  type: string;
  challengeType: TicketChallengeType;
  durationEstimateMinutes: number;
  isUrgent: boolean;
  scenarioText: string;
  context?: string;
  expectedOutcome: string;
  deliverables: GeneratedDeliverable[];
  sprintTitle: string;
  sprintDescription?: string;
  sprintOrderIndex: number;
}

export interface TicketGenerationContext {
  course: CourseContext;
  materials: CourseMaterialContext[];
  targetTicketCount?: number;
  /** Max tickets to request in a single LLM call (chunking to avoid truncation). */
  maxTicketsPerRequest?: number;
  /** When chunking, titles already generated so the model can avoid duplicates. */
  alreadyGeneratedTitles?: string[];
}

export interface PerDeliverableGrading {
  deliverableId: string;
  score: number;
  feedback: string;
}

export interface GradingResult {
  overallScore: number;
  overallFeedback: string;
  perDeliverable: PerDeliverableGrading[];
}

export interface GradingContext {
  ticket: {
    id: string;
    title: string;
    description: string | null;
    type: string | null;
    challengeType: TicketChallengeType;
  };
  scenario: {
    scenarioText: string;
    context?: string | null;
    expectedOutcome?: string | null;
  };
  deliverables: {
    id: string;
    description: string;
    orderIndex: number;
  }[];
  submissions: {
    deliverableId: string;
    content: string;
  }[];
  /** Attempt-level code submission (for coding tickets). */
  submissionCode?: string | null;
  /** Attempt-level report/notes (e.g. from ticket_attempts.submission_text). */
  submissionText?: string | null;
}

