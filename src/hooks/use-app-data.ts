import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockCourses, Ticket } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// Since this is a static prototype without a real backend, we use TanStack Query 
// with static data and artificial delays to simulate a real API experience.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!profile) return null;

      const { count: ticketsCount } = await supabase
        .from('ticket_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', session.user.id)
        .eq('status', 'passed');

      const { data: certificates } = await supabase
        .from('certificates')
        .select(`
          id,
          sprints_completed,
          issued_at,
          courses ( title )
        `)
        .eq('student_id', session.user.id);

      const formattedCerts = (certificates || []).map((c: any) => ({
        id: c.id,
        courseTitle: c.courses?.title || 'Unknown Course',
        dateEarned: c.issued_at,
        sprintsCompleted: c.sprints_completed
      }));

      return {
        id: profile.id,
        name: profile.full_name || 'User',
        email: session.user.email || '',
        degree: profile.degree || 'No Degree Listed',
        institution: profile.institution || 'No Institution Listed',
        joinDate: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        currentStreak: profile.current_streak || 0,
        bestStreak: profile.best_streak || 0,
        feeRefunded: 0,
        feeTotal: 0,
        ticketsCompleted: ticketsCount || 0,
        certificates: formattedCerts
      };
    }
  });
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      await delay(500);
      return mockCourses;
    }
  });
}

export function useEnrolledCourses() {
  return useQuery({
    queryKey: ['courses', 'enrolled'],
    queryFn: async () => {
      await delay(300);
      return mockCourses.filter(c => c.isEnrolled);
    }
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      await delay(400);
      const course = mockCourses.find(c => c.id === id);
      if (!course) throw new Error("Course not found");
      return course;
    }
  });
}

export function useTicket(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['courses', courseId, 'tickets', ticketId],
    enabled: options?.enabled !== false && !!courseId && !!ticketId,
    queryFn: async () => {
      await delay(300);
      const course = mockCourses.find(c => c.id === courseId);
      if (!course) throw new Error("Course not found");
      
      let foundTicket: Ticket | undefined;
      for (const sprint of course.sprints) {
        const t = sprint.tickets.find(t => t.id === ticketId);
        if (t) foundTicket = t;
      }
      
      if (!foundTicket) throw new Error("Ticket not found");
      return foundTicket;
    }
  });
}

export function useSubmitTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, ticketId, content }: { courseId: string, ticketId: string, content: string }) => {
      await delay(1200); // Simulate upload/processing
      
      const course = mockCourses.find(c => c.id === courseId);
      if (course) {
        for (const sprint of course.sprints) {
          const index = sprint.tickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            // Mark current as completed
            sprint.tickets[index].status = "Completed";
            
            // Unlock next one directly below it
            if (index + 1 < sprint.tickets.length && sprint.tickets[index + 1].status === "Locked") {
              sprint.tickets[index + 1].status = "Active";
            }
            break;
          }
        }
      }

      return { success: true, xpEarned: 150 };
    },
    onSuccess: (_, variables) => {
      // In a real app we'd invalidate queries here
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });
}

// --- Instructor stubs (no backend yet) ---

export type CreateCoursePayload = {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  fee_amount: number;
  company_partner: string | null;
};

export type UpdateCoursePayload = {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  fee_amount: number;
  company_partner: string | null;
};

export interface InstructorCourseMaterial {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  created_at?: string;
}

export interface InstructorSprintWithTickets {
  id: string;
  title: string;
  description?: string;
  order: number;
  tickets: Ticket[];
}

export function useInstructorTicketPerformance() {
  return useQuery({
    queryKey: ['instructor', 'ticket-performance'],
    queryFn: async () => [] as { title: string; course: string; type: string; avgScore: number; attempts: number; passRate: number; avgTime: string }[],
  });
}

export function useInstructorProfile() {
  return useQuery({
    queryKey: ['instructor', 'profile'],
    queryFn: async () => ({ totalEarned: 0, pendingPayout: 0 }),
  });
}

export function useInstructorPayoutRecords() {
  return useQuery({
    queryKey: ['instructor', 'payout-records'],
    queryFn: async () => [] as { period: string; courseName: string; studentsCompleted: number; grossRevenue: number; platformFee: number; netPayout: number; status: string }[],
  });
}

export function useInstructorTicketDetail(courseId: string, ticketId: string) {
  return useTicket(courseId, ticketId, { enabled: !!courseId && !!ticketId });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['instructor', 'create-course'],
    mutationFn: async (_payload: CreateCoursePayload) => {
      await delay(400);
      return { id: `draft-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}

export function useInstructorCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: ['instructor', 'course', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      await delay(300);
      if (!courseId) return null;
      const course = mockCourses.find(c => c.id === courseId);
      if (course) {
        return {
          id: course.id,
          title: course.title,
          description: (course as { description?: string }).description ?? '',
          category: course.category,
          difficulty: course.difficulty,
          status: 'draft' as const,
          fee_amount: course.fee ?? 1000,
          company_partner: null as string | null,
          sprints: course.sprints.map((s, i) => ({
            id: s.id,
            title: s.title,
            description: undefined,
            order: i,
            tickets: s.tickets,
          })),
          materials: [] as InstructorCourseMaterial[],
          total_sprints: course.sprints.length,
          total_tickets: course.sprints.reduce((n, s) => n + s.tickets.length, 0),
        };
      }
      return {
        id: courseId,
        title: 'Course',
        description: '',
        category: 'Tech',
        difficulty: 'Beginner',
        status: 'draft' as const,
        fee_amount: 1000,
        company_partner: null as string | null,
        sprints: [] as InstructorSprintWithTickets[],
        materials: [] as InstructorCourseMaterial[],
        total_sprints: 0,
        total_tickets: 0,
      };
    },
  });
}

export function useUploadCourseMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['instructor', 'upload-material'],
    mutationFn: async (_: { courseId: string; file: File; title?: string; description?: string; shouldTriggerGeneration?: boolean }) => {
      await delay(800);
      return {};
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', v.courseId] });
    },
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['instructor', 'create-sprint'],
    mutationFn: async (_: { courseId: string; title: string; description?: string }) => {
      await delay(500);
      return { id: `sprint-${Date.now()}` };
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', v.courseId] });
    },
  });
}

export function useUpdateCourse(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['instructor', 'update-course', courseId],
    mutationFn: async (_payload: UpdateCoursePayload) => {
      await delay(400);
      return {};
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
    },
  });
}

export function useSubmitCourseForReview(courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['instructor', 'submit-review', courseId],
    mutationFn: async () => {
      await delay(500);
      return {};
    },
    onSuccess: () => {
      if (courseId) queryClient.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
    },
  });
}

export function useInstructorCourseAttempts(courseId: string | null) {
  return useQuery({
    queryKey: ['instructor', 'course-attempts', courseId],
    enabled: !!courseId,
    queryFn: async () => [] as { id: string; ticketId: string; ticketTitle: string; studentName: string; status: string; submittedAt: string | null }[],
  });
}

export function useInstructorAttemptDetail(attemptId: string | null) {
  return useQuery({
    queryKey: ['instructor', 'attempt', attemptId],
    enabled: !!attemptId,
    queryFn: async () => ({
      attempt: null as { status?: string; submission_text?: string } | null,
      deliverableSubmissions: [] as unknown[],
    }),
  });
}
