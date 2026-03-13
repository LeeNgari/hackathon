export type UserRole = 'student' | 'instructor' | 'admin';

export type CourseCategory = 'Tech' | 'Business' | 'Design' | 'Finance';

export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type CourseStatus = 'draft' | 'under_review' | 'live' | 'archived';

export type MaterialFileType = 'pdf' | 'video' | 'doc' | 'link' | 'other';

export type TicketType = 'Build' | 'Analyze' | 'Present' | 'Research';

export type TicketChallengeType = 'coding' | 'report';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export type AttemptStatus = 'in_progress' | 'submitted' | 'passed' | 'failed';

export type PaymentStatus = 'pending' | 'completed' | 'partially_refunded' | 'fully_refunded';

export interface Profile {
  id: string; // UUID
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  degree: string | null;
  institution: string | null;
  current_streak: number;
  best_streak: number;
  professional_title: string | null;
  bio: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Course {
  id: string; // UUID
  instructor_id: string; // UUID
  title: string;
  description: string | null;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  fee_amount: number; // NUMERIC
  status: CourseStatus;
  company_partner: string | null;
  thumbnail_url: string | null;
  ai_generated_tickets: boolean;
  total_sprints: number;
  total_tickets: number;
  avg_rating: number; // NUMERIC
  published_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface CourseMaterial {
  id: string; // UUID
  course_id: string; // UUID
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: MaterialFileType;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Sprint {
  id: string; // UUID
  course_id: string; // UUID
  title: string;
  description: string | null;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Ticket {
  id: string; // UUID
  sprint_id: string; // UUID
  course_id: string; // UUID
  title: string;
  description: string | null;
  type: TicketType;
  challenge_type: TicketChallengeType;
  duration_estimate_minutes: number;
  is_urgent: boolean;
  order_index: number;
  ai_generated: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface TicketScenario {
  id: string; // UUID
  ticket_id: string; // UUID
  scenario_text: string;
  context: string | null;
  expected_outcome: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface TicketDeliverable {
  id: string; // UUID
  ticket_id: string; // UUID
  description: string;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
}

export interface Enrollment {
  id: string; // UUID
  student_id: string; // UUID
  course_id: string; // UUID
  status: EnrollmentStatus;
  progress_percent: number; // NUMERIC
  current_sprint_id: string | null; // UUID
  enrolled_at: string; // TIMESTAMPTZ
  completed_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Payment {
  id: string; // UUID
  student_id: string; // UUID
  course_id: string; // UUID
  enrollment_id: string; // UUID
  amount_paid: number; // NUMERIC
  platform_fee_amount: number; // NUMERIC
  instructor_share_amount: number; // NUMERIC
  refund_amount: number; // NUMERIC
  payment_status: PaymentStatus;
  simulated_at: string; // TIMESTAMPTZ
  refunded_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface TicketAttempt {
  id: string; // UUID
  student_id: string; // UUID
  ticket_id: string; // UUID
  enrollment_id: string; // UUID
  status: AttemptStatus;
  submission_text: string | null;
  submission_code: string | null;
  submission_files: any; // JSONB
  ai_score: number | null; // SMALLINT
  ai_review_text: string | null;
  time_spent_minutes: number | null;
  submitted_at: string | null; // TIMESTAMPTZ
  reviewed_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface DeliverableSubmission {
  id: string; // UUID
  attempt_id: string; // UUID
  deliverable_id: string; // UUID
  content: string;
  ai_score: number | null; // SMALLINT
  ai_feedback: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Certificate {
  id: string; // UUID
  student_id: string; // UUID
  course_id: string; // UUID
  enrollment_id: string; // UUID
  sprints_completed: number;
  issued_at: string; // TIMESTAMPTZ
  certificate_url: string | null;
}

export interface StreakRecord {
  id: string; // UUID
  student_id: string; // UUID
  date: string; // DATE
  tickets_completed: number;
  created_at: string; // TIMESTAMPTZ
}

export interface PlatformSetting {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null; // UUID
  updated_at: string; // TIMESTAMPTZ
}
