// Mock Data Store for Fieldwork Platform

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

export const mockUser: User = {
  id: "u_1",
  name: "Amara Osei",
  email: "student@fieldwork.io",
  degree: "B.S. Computer Science",
  institution: "University of Nairobi",
  joinDate: "Jan 2025",
  currentStreak: 12,
  bestStreak: 21,
  feeRefunded: 2100,
  feeTotal: 3000,
  ticketsCompleted: 28,
  certificates: [
    {
      id: "cert_1",
      courseTitle: "Frontend Engineering Fundamentals",
      dateEarned: "2025-02-14",
      sprintsCompleted: 4
    }
  ]
};

export const mockCourses: Course[] = [
  {
    id: "c_1",
    title: "Cloud Infrastructure Fundamentals",
    instructor: "David Chen",
    category: "Tech",
    difficulty: "Intermediate",
    totalSprints: 4,
    totalTickets: 12,
    fee: 1000,
    progressPercent: 68,
    currentSprint: 2,
    isEnrolled: true,
    sprints: [
      {
        id: "s_1_1",
        title: "Sprint 1: AWS Core Services",
        order: 1,
        tickets: [
          { id: "t_1", title: "Provision VPC Architecture", type: "Build", durationEstimate: "45 mins", status: "Completed" },
          { id: "t_2", title: "IAM Policy Audit", type: "Analyze", durationEstimate: "30 mins", status: "Completed" },
          { id: "t_3", title: "Deploy EC2 Web Server", type: "Build", durationEstimate: "60 mins", status: "Completed" },
        ]
      },
      {
        id: "s_1_2",
        title: "Sprint 2: High Availability",
        order: 2,
        tickets: [
          { 
            id: "t_4", 
            title: "Configure Auto-Scaling Group", 
            type: "Build", 
            durationEstimate: "45 mins", 
            status: "Completed" 
          },
          { 
            id: "t_5", 
            title: "Load Balancer Routing Fix", 
            type: "Analyze", 
            durationEstimate: "25 mins", 
            status: "Active",
            isUrgent: true,
            scenario: "Production traffic is failing to reach the newly deployed microservices. The application load balancer (ALB) is showing healthy hosts, but 502 Bad Gateway errors are spiking. The engineering lead needs you to audit the listener rules and target group configurations immediately.",
            deliverables: [
              "Identify the misconfigured listener port",
              "Update target group health check path",
              "Draft a post-mortem explanation of the failure"
            ]
          },
          { id: "t_6", title: "Multi-AZ Database Migration", type: "Build", durationEstimate: "90 mins", status: "Locked" },
        ]
      }
    ]
  },
  {
    id: "c_2",
    title: "Financial Modelling for Startups",
    instructor: "Sarah Jenkins",
    category: "Finance",
    difficulty: "Beginner",
    totalSprints: 3,
    totalTickets: 9,
    fee: 1000,
    progressPercent: 40,
    currentSprint: 1,
    isEnrolled: true,
    sprints: [
      {
        id: "s_2_1",
        title: "Sprint 1: Unit Economics",
        order: 1,
        tickets: [
          { id: "t_2_1", title: "Calculate CAC vs LTV", type: "Analyze", durationEstimate: "40 mins", status: "Completed" },
          { id: "t_2_2", title: "Build Cohort Retention Model", type: "Build", durationEstimate: "60 mins", status: "Active" },
          { id: "t_2_3", title: "Board Presentation Draft", type: "Present", durationEstimate: "30 mins", status: "Locked" },
        ]
      }
    ]
  },
  {
    id: "c_3",
    title: "Product Strategy Practicum",
    instructor: "Elena Rodriguez",
    category: "Business",
    difficulty: "Intermediate",
    totalSprints: 5,
    totalTickets: 15,
    fee: 1000,
    progressPercent: 15,
    currentSprint: 1,
    isEnrolled: true,
    sprints: [
       {
        id: "s_3_1",
        title: "Sprint 1: Market Positioning",
        order: 1,
        tickets: [
          { id: "t_3_1", title: "Competitor Feature Matrix", type: "Research", durationEstimate: "45 mins", status: "Active" },
          { id: "t_3_2", title: "Define User Personas", type: "Build", durationEstimate: "50 mins", status: "Locked" },
        ]
      }
    ]
  },
  {
    id: "c_4",
    title: "UX Research in Practice",
    instructor: "Marcus Tay",
    category: "Design",
    difficulty: "Beginner",
    totalSprints: 3,
    totalTickets: 10,
    fee: 800,
    progressPercent: 0,
    isEnrolled: false,
    sprints: []
  },
  {
    id: "c_5",
    title: "Data Analysis with Python",
    instructor: "Wei Lin",
    category: "Tech",
    difficulty: "Intermediate",
    totalSprints: 6,
    totalTickets: 18,
    fee: 1200,
    progressPercent: 0,
    isEnrolled: false,
    sprints: []
  },
  {
    id: "c_6",
    title: "Brand Identity for Founders",
    instructor: "Jessica Walsh",
    category: "Design",
    difficulty: "Beginner",
    totalSprints: 2,
    totalTickets: 6,
    fee: 500,
    progressPercent: 0,
    isEnrolled: false,
    sprints: []
  },
  {
    id: "c_7",
    title: "Growth Marketing Fundamentals",
    instructor: "Tom Hassan",
    category: "Business",
    difficulty: "Beginner",
    totalSprints: 4,
    totalTickets: 12,
    fee: 900,
    progressPercent: 0,
    isEnrolled: false,
    sprints: []
  },
  {
    id: "c_8",
    title: "Cybersecurity Essentials",
    instructor: "Nina Patel",
    category: "Tech",
    difficulty: "Intermediate",
    totalSprints: 5,
    totalTickets: 15,
    fee: 1100,
    progressPercent: 0,
    isEnrolled: false,
    sprints: []
  }
];
