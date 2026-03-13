export interface AdminUser {
  name: string;
  email: string;
  role: string;
}

export interface PartnerCourse {
  id: string;
  title: string;
  instructor: string;
  company: string | null;
  category: string;
  status: "Live" | "Under Review" | "Draft";
  students: number;
  tickets: number;
  dateAdded: string;
}

export interface FinancialEntry {
  studentName: string;
  course: string;
  feePaid: number;
  refunded: number;
  progress: number;
  lastActivity: string;
}

export interface Partner {
  id: string;
  name: string;
  type: "Instructor" | "Company";
  courses: number;
  students: number;
  totalPaid: number;
  status: "Active" | "Pending" | "Inactive";
  joinDate: string;
  category: string;
}

export interface MarketSignal {
  category: string;
  trend: "rising" | "stable" | "falling";
  demandScore: number;
  topSkill: string;
  openRoles: string;
  priority: "High" | "Medium" | "Low";
}

export const adminUser: AdminUser = {
  name: "Dorcas Kimani",
  email: "admin@fieldwork.io",
  role: "Platform Administrator",
};

export const platformStats = {
  totalStudents: 1_284,
  activeThisWeek: 847,
  totalCourses: 24,
  liveCourses: 18,
  platformFeesCollected: 128_400,
  feesRefunded: 61_320,
  ticketsCompleted: 14_760,
  avgStreakDays: 8,
};

export const partnerCourses: PartnerCourse[] = [
  { id: "pc_1", title: "Cloud Infrastructure Fundamentals", instructor: "David Chen", company: "AWS Partner", category: "Tech", status: "Live", students: 312, tickets: 12, dateAdded: "2025-01-10" },
  { id: "pc_2", title: "Financial Modelling for Startups", instructor: "Sarah Jenkins", company: null, category: "Finance", status: "Live", students: 198, tickets: 9, dateAdded: "2025-01-22" },
  { id: "pc_3", title: "Product Strategy Practicum", instructor: "Elena Rodriguez", company: "Safaricom", category: "Business", status: "Live", students: 254, tickets: 15, dateAdded: "2025-02-01" },
  { id: "pc_4", title: "UX Research in Practice", instructor: "Marcus Tay", company: null, category: "Design", status: "Live", students: 143, tickets: 10, dateAdded: "2025-02-14" },
  { id: "pc_5", title: "Data Analysis with Python", instructor: "Wei Lin", company: "Microsoft Kenya", category: "Tech", status: "Live", students: 221, tickets: 18, dateAdded: "2025-02-20" },
  { id: "pc_6", title: "Cybersecurity Essentials", instructor: "Nina Patel", company: null, category: "Tech", status: "Under Review", students: 0, tickets: 15, dateAdded: "2025-03-05" },
  { id: "pc_7", title: "Brand Identity for Founders", instructor: "Jessica Walsh", company: null, category: "Design", status: "Live", students: 87, tickets: 6, dateAdded: "2025-02-28" },
  { id: "pc_8", title: "Growth Marketing Fundamentals", instructor: "Tom Hassan", company: "Google for Startups", category: "Business", status: "Draft", students: 0, tickets: 12, dateAdded: "2025-03-10" },
];

export const financialEntries: FinancialEntry[] = [
  { studentName: "Amara Osei", course: "Cloud Infrastructure Fundamentals", feePaid: 1000, refunded: 680, progress: 68, lastActivity: "2026-03-13" },
  { studentName: "James Mutua", course: "Financial Modelling for Startups", feePaid: 1000, refunded: 400, progress: 40, lastActivity: "2026-03-12" },
  { studentName: "Lydia Njoroge", course: "Product Strategy Practicum", feePaid: 1000, refunded: 150, progress: 15, lastActivity: "2026-03-13" },
  { studentName: "Brian Otieno", course: "Data Analysis with Python", feePaid: 1200, refunded: 840, progress: 70, lastActivity: "2026-03-11" },
  { studentName: "Fatuma Ali", course: "UX Research in Practice", feePaid: 800, refunded: 320, progress: 40, lastActivity: "2026-03-13" },
  { studentName: "Kevin Njiru", course: "Cloud Infrastructure Fundamentals", feePaid: 1000, refunded: 1000, progress: 100, lastActivity: "2026-03-10" },
  { studentName: "Sonia Waweru", course: "Brand Identity for Founders", feePaid: 500, refunded: 250, progress: 50, lastActivity: "2026-03-09" },
  { studentName: "David Kariuki", course: "Financial Modelling for Startups", feePaid: 1000, refunded: 600, progress: 60, lastActivity: "2026-03-12" },
];

export const partners: Partner[] = [
  { id: "p_1", name: "David Chen", type: "Instructor", courses: 2, students: 312, totalPaid: 28_080, status: "Active", joinDate: "Jan 2025", category: "Tech" },
  { id: "p_2", name: "Sarah Jenkins", type: "Instructor", courses: 1, students: 198, totalPaid: 14_850, status: "Active", joinDate: "Jan 2025", category: "Finance" },
  { id: "p_3", name: "Elena Rodriguez", type: "Instructor", courses: 1, students: 254, totalPaid: 19_050, status: "Active", joinDate: "Feb 2025", category: "Business" },
  { id: "p_4", name: "AWS Partner", type: "Company", courses: 1, students: 312, totalPaid: 0, status: "Active", joinDate: "Jan 2025", category: "Tech" },
  { id: "p_5", name: "Safaricom", type: "Company", courses: 1, students: 254, totalPaid: 0, status: "Active", joinDate: "Feb 2025", category: "Business" },
  { id: "p_6", name: "Microsoft Kenya", type: "Company", courses: 1, students: 221, totalPaid: 0, status: "Active", joinDate: "Feb 2025", category: "Tech" },
  { id: "p_7", name: "Google for Startups", type: "Company", courses: 1, students: 0, totalPaid: 0, status: "Pending", joinDate: "Mar 2025", category: "Business" },
  { id: "p_8", name: "Nina Patel", type: "Instructor", courses: 1, students: 0, totalPaid: 0, status: "Pending", joinDate: "Mar 2025", category: "Tech" },
];

export const marketSignals: MarketSignal[] = [
  { category: "Cloud / DevOps", trend: "rising", demandScore: 94, topSkill: "AWS, Kubernetes", openRoles: "2,300+", priority: "High" },
  { category: "Data & AI", trend: "rising", demandScore: 91, topSkill: "Python, SQL, LLMs", openRoles: "1,900+", priority: "High" },
  { category: "Product Management", trend: "rising", demandScore: 82, topSkill: "Roadmapping, PRDs", openRoles: "1,100+", priority: "High" },
  { category: "Cybersecurity", trend: "stable", demandScore: 77, topSkill: "SOC, Pen Testing", openRoles: "980+", priority: "Medium" },
  { category: "Finance / Fintech", trend: "stable", demandScore: 71, topSkill: "Financial Modelling", openRoles: "760+", priority: "Medium" },
  { category: "UX / Design", trend: "stable", demandScore: 65, topSkill: "User Research, Figma", openRoles: "620+", priority: "Medium" },
  { category: "Growth Marketing", trend: "falling", demandScore: 54, topSkill: "SEO, Paid Ads", openRoles: "430+", priority: "Low" },
];

export const recentActivity = [
  { time: "2 min ago", event: "New enrollment", detail: "James Mutua enrolled in Cloud Infrastructure Fundamentals" },
  { time: "14 min ago", event: "Course submitted", detail: "Nina Patel submitted Cybersecurity Essentials for review" },
  { time: "1 hr ago", event: "Sprint completed", detail: "Kevin Njiru completed Sprint 4 of Cloud Infrastructure" },
  { time: "3 hr ago", event: "Fee refund issued", detail: "KES 320 refunded to Fatuma Ali (UX Research, 40% progress)" },
  { time: "5 hr ago", event: "New partner", detail: "Google for Startups partnership pending approval" },
  { time: "Yesterday", event: "Ticket flagged", detail: "Automated ticket #t_3_1 flagged for quality review" },
];
