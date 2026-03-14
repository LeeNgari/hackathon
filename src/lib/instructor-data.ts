export interface InstructorUser {
  name: string;
  email: string;
  title: string;
  institution: string;
  joinDate: string;
  totalEarned: number;
  pendingPayout: number;
}

export interface InstructorCourse {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  status: "Live" | "Draft" | "Under Review";
  studentsEnrolled: number;
  sprints: number;
  tickets: number;
  completionRate: number;
  avgRating: number;
  earnedToDate: number;
  companyPartner: string | null;
}

export interface StudentEnrollment {
  name: string;
  course: string;
  progress: number;
  streak: number;
  lastTicket: string;
  lastActivity: string;
  status: "On Track" | "At Risk" | "Completed";
}

export interface TicketPerformance {
  title: string;
  course: string;
  type: string;
  avgScore: number;
  attempts: number;
  passRate: number;
  avgTime: string;
}

export interface PayoutRecord {
  period: string;
  courseName: string;
  studentsCompleted: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
  status: "Paid" | "Pending" | "Processing";
}
