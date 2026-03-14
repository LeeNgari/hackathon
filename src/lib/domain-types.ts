// Domain types for Fieldwork Platform (shared by hooks and UI; no mock data)

export type TicketStatus = "Completed" | "Active" | "Locked";
export type CourseCategory = "Tech" | "Business" | "Design" | "Finance";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Ticket {
  id: string;
  title: string;
  type: "Build" | "Analyze" | "Present" | "Research";
  durationEstimate: string;
  status: TicketStatus;
  isUrgent?: boolean;
  scenario?: string;
  deliverables?: string[];
  /** True when the user has at least one attempt (any status) for this ticket */
  hasAttemptedBefore?: boolean;
}

export interface Sprint {
  id: string;
  title: string;
  order: number;
  tickets: Ticket[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: CourseCategory;
  difficulty: Difficulty;
  totalSprints: number;
  totalTickets: number;
  fee: number;
  progressPercent?: number; // 0 if not enrolled
  currentSprint?: number;
  sprints: Sprint[];
  isEnrolled: boolean;
}

export interface Certificate {
  id: string;
  courseTitle: string;
  dateEarned: string;
  sprintsCompleted: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  degree: string;
  institution: string;
  joinDate: string;
  currentStreak: number;
  bestStreak: number;
  feeRefunded: number;
  feeTotal: number;
  ticketsCompleted: number;
  certificates: Certificate[];
}
