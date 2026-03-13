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

export const instructorUser: InstructorUser = {
  name: "David Chen",
  email: "instructor@fieldwork.io",
  title: "Senior Cloud Architect",
  institution: "AWS Partner Network",
  joinDate: "Jan 2025",
  totalEarned: 28_080,
  pendingPayout: 3_420,
};

export const instructorCourses: InstructorCourse[] = [
  {
    id: "ic_1",
    title: "Cloud Infrastructure Fundamentals",
    category: "Tech",
    difficulty: "Intermediate",
    status: "Live",
    studentsEnrolled: 312,
    sprints: 4,
    tickets: 12,
    completionRate: 68,
    avgRating: 4.7,
    earnedToDate: 23_400,
    companyPartner: "AWS Partner",
  },
  {
    id: "ic_2",
    title: "Advanced AWS Architecture",
    category: "Tech",
    difficulty: "Advanced",
    status: "Draft",
    studentsEnrolled: 0,
    sprints: 6,
    tickets: 18,
    completionRate: 0,
    avgRating: 0,
    earnedToDate: 0,
    companyPartner: null,
  },
];

export const studentEnrollments: StudentEnrollment[] = [
  { name: "Amara Osei", course: "Cloud Infrastructure Fundamentals", progress: 68, streak: 12, lastTicket: "Load Balancer Routing Fix", lastActivity: "Today", status: "On Track" },
  { name: "Kevin Njiru", course: "Cloud Infrastructure Fundamentals", progress: 100, streak: 0, lastTicket: "Multi-AZ Database Migration", lastActivity: "3 days ago", status: "Completed" },
  { name: "Brian Otieno", course: "Cloud Infrastructure Fundamentals", progress: 70, streak: 7, lastTicket: "Configure Auto-Scaling Group", lastActivity: "Yesterday", status: "On Track" },
  { name: "Grace Mwangi", course: "Cloud Infrastructure Fundamentals", progress: 25, streak: 2, lastTicket: "IAM Policy Audit", lastActivity: "4 days ago", status: "At Risk" },
  { name: "Moses Kamau", course: "Cloud Infrastructure Fundamentals", progress: 42, streak: 5, lastTicket: "Deploy EC2 Web Server", lastActivity: "Yesterday", status: "On Track" },
  { name: "Priya Nair", course: "Cloud Infrastructure Fundamentals", progress: 10, streak: 1, lastTicket: "Provision VPC Architecture", lastActivity: "6 days ago", status: "At Risk" },
  { name: "Samuel Ochieng", course: "Cloud Infrastructure Fundamentals", progress: 83, streak: 15, lastTicket: "Multi-AZ Database Migration", lastActivity: "Today", status: "On Track" },
  { name: "Wanjiru Karimi", course: "Cloud Infrastructure Fundamentals", progress: 58, streak: 9, lastTicket: "Load Balancer Routing Fix", lastActivity: "Today", status: "On Track" },
];

export const ticketPerformance: TicketPerformance[] = [
  { title: "Provision VPC Architecture", course: "Cloud Infrastructure Fundamentals", type: "Build", avgScore: 87, attempts: 312, passRate: 91, avgTime: "38 mins" },
  { title: "IAM Policy Audit", course: "Cloud Infrastructure Fundamentals", type: "Analyze", avgScore: 82, attempts: 298, passRate: 86, avgTime: "27 mins" },
  { title: "Deploy EC2 Web Server", course: "Cloud Infrastructure Fundamentals", type: "Build", avgScore: 79, attempts: 271, passRate: 84, avgTime: "54 mins" },
  { title: "Configure Auto-Scaling Group", course: "Cloud Infrastructure Fundamentals", type: "Build", avgScore: 74, attempts: 230, passRate: 78, avgTime: "41 mins" },
  { title: "Load Balancer Routing Fix", course: "Cloud Infrastructure Fundamentals", type: "Analyze", avgScore: 68, attempts: 189, passRate: 71, avgTime: "23 mins" },
  { title: "Multi-AZ Database Migration", course: "Cloud Infrastructure Fundamentals", type: "Build", avgScore: 81, attempts: 97, passRate: 88, avgTime: "76 mins" },
];

export const payoutRecords: PayoutRecord[] = [
  { period: "Feb 2026", courseName: "Cloud Infrastructure Fundamentals", studentsCompleted: 18, grossRevenue: 18_000, platformFee: 1_800, netPayout: 16_200, status: "Paid" },
  { period: "Jan 2026", courseName: "Cloud Infrastructure Fundamentals", studentsCompleted: 14, grossRevenue: 14_000, platformFee: 1_400, netPayout: 12_600, status: "Paid" },
  { period: "Dec 2025", courseName: "Cloud Infrastructure Fundamentals", studentsCompleted: 9, grossRevenue: 9_000, platformFee: 900, netPayout: 8_100, status: "Paid" },
  { period: "Mar 2026", courseName: "Cloud Infrastructure Fundamentals", studentsCompleted: 4, grossRevenue: 4_000, platformFee: 400, netPayout: 3_420, status: "Pending" },
];
