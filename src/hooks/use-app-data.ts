import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockCourses, Ticket } from "@/lib/mock-data";
import type { Course as DomainCourse, Sprint as DomainSprint, Ticket as DomainTicket } from "@/lib/domain-types";
import { supabase } from "@/lib/supabase";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Row from courses with joined instructor profile. Supabase may return profiles as object or array. */
type CourseRowWithInstructor = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  fee_amount: number;
  total_sprints: number;
  total_tickets: number;
  status?: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function getInstructorName(row: CourseRowWithInstructor): string {
  const p = row.profiles;
  if (!p) return 'Instructor';
  const name = Array.isArray(p) ? p[0]?.full_name : p.full_name;
  return name ?? 'Instructor';
}


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
    queryFn: async (): Promise<DomainCourse[]> => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: courseRows, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, category, difficulty, fee_amount, total_sprints, total_tickets, status, profiles!instructor_id(full_name)');

      const courses = coursesError ? [] : ((courseRows ?? []) as unknown as CourseRowWithInstructor[]);

      let enrolledCourseIds: Set<string> = new Set();
      if (session?.user?.id) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', session.user.id);
        if (enrollments) enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
      }

      const fromDb: DomainCourse[] = courses.map(c => ({
        id: c.id,
        title: c.title,
        instructor: getInstructorName(c),
        category: c.category as DomainCourse['category'],
        difficulty: c.difficulty as DomainCourse['difficulty'],
        totalSprints: c.total_sprints,
        totalTickets: c.total_tickets,
        fee: Number(c.fee_amount),
        progressPercent: 0,
        sprints: [],
        isEnrolled: enrolledCourseIds.has(c.id),
      }));

      const mockAsDomain: DomainCourse[] = mockCourses.map(c => ({
        id: c.id,
        title: c.title,
        instructor: c.instructor,
        category: c.category,
        difficulty: c.difficulty,
        totalSprints: c.totalSprints,
        totalTickets: c.totalTickets,
        fee: c.fee,
        progressPercent: c.progressPercent ?? 0,
        sprints: [],
        isEnrolled: c.isEnrolled,
      }));

      return [...fromDb, ...mockAsDomain];
    },
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
    enabled: !!id,
    queryFn: async (): Promise<DomainCourse> => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select('id, title, category, difficulty, fee_amount, total_sprints, total_tickets, profiles!instructor_id(full_name)')
        .eq('id', id)
        .single();

      if (courseError || !courseRow) throw new Error("Course not found");
      const c = courseRow as unknown as CourseRowWithInstructor;

      let enrollment: { id: string; progress_percent: number } | null = null;
      if (session?.user?.id) {
        const { data: enr } = await supabase
          .from('enrollments')
          .select('id, progress_percent')
          .eq('course_id', id)
          .eq('student_id', session.user.id)
          .maybeSingle();
        enrollment = enr ?? null;
      }

      const { data: sprintRows, error: sprintsError } = await supabase
        .from('sprints')
        .select('id, title, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (sprintsError) throw new Error(sprintsError.message);
      const sprints = sprintRows ?? [];

      const { data: ticketRows, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, sprint_id, title, type, duration_estimate_minutes, is_urgent, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (ticketsError) throw new Error(ticketsError.message);
      const tickets = ticketRows ?? [];

      let passedTicketIds: Set<string> = new Set();
      if (enrollment) {
        const { data: attempts } = await supabase
          .from('ticket_attempts')
          .select('ticket_id')
          .eq('enrollment_id', enrollment.id)
          .eq('status', 'passed');
        if (attempts) passedTicketIds = new Set(attempts.map(a => a.ticket_id));
      }

      const sprintOrder = new Map(sprints.map((s, i) => [s.id, i]));
      const ticketsBySprint = new Map<string, typeof tickets>();
      for (const t of tickets) {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push(t);
        ticketsBySprint.set(t.sprint_id, list);
      }
      for (const list of ticketsBySprint.values()) {
        list.sort((a, b) => a.order_index - b.order_index);
      }

      const deriveStatus = (ticketId: string, sprintId: string, indexInSprint: number): "Completed" | "Active" | "Locked" => {
        if (passedTicketIds.has(ticketId)) return "Completed";
        const list = ticketsBySprint.get(sprintId) ?? [];
        const prevTicket = list[indexInSprint - 1];
        const prevCompleted = prevTicket ? passedTicketIds.has(prevTicket.id) : false;
        const isFirstInCourse = sprintId === sprints[0]?.id && indexInSprint === 0;
        if (isFirstInCourse || prevCompleted) return "Active";
        return "Locked";
      };

      const domainSprints: DomainSprint[] = sprints.map(s => {
        const list = ticketsBySprint.get(s.id) ?? [];
        const domainTickets: DomainTicket[] = list.map((t, i) => ({
          id: t.id,
          title: t.title,
          type: t.type as DomainTicket['type'],
          durationEstimate: `${t.duration_estimate_minutes} mins`,
          status: deriveStatus(t.id, s.id, i),
          isUrgent: t.is_urgent,
        }));
        return {
          id: s.id,
          title: s.title,
          order: s.order_index,
          tickets: domainTickets,
        };
      });

      return {
        id: c.id,
        title: c.title,
        instructor: getInstructorName(c),
        category: c.category as DomainCourse['category'],
        difficulty: c.difficulty as DomainCourse['difficulty'],
        totalSprints: c.total_sprints,
        totalTickets: c.total_tickets,
        fee: Number(c.fee_amount),
        progressPercent: enrollment ? Number(enrollment.progress_percent) : 0,
        sprints: domainSprints,
        isEnrolled: !!enrollment,
      };
    },
  });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function useTicket(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['courses', courseId, 'tickets', ticketId],
    enabled: options?.enabled !== false && !!courseId && !!ticketId,
    queryFn: async (): Promise<Ticket> => {
      if (isUuid(ticketId) && isUuid(courseId)) {
        const { data: ticketRow, error: ticketError } = await supabase
          .from('tickets')
          .select('id, title, type, duration_estimate_minutes, is_urgent')
          .eq('id', ticketId)
          .eq('course_id', courseId)
          .single();

        if (!ticketError && ticketRow) {
          const { data: scenarioRow } = await supabase
            .from('ticket_scenarios')
            .select('scenario_text, expected_outcome')
            .eq('ticket_id', ticketId)
            .maybeSingle();

          const { data: deliverableRows } = await supabase
            .from('ticket_deliverables')
            .select('description')
            .eq('ticket_id', ticketId)
            .order('order_index', { ascending: true });

          const scenario = scenarioRow as { scenario_text: string; expected_outcome: string | null } | null;
          const deliverables = (deliverableRows ?? []).map((d: { description: string }) => d.description);

          return {
            id: ticketRow.id,
            title: ticketRow.title,
            type: ticketRow.type as Ticket['type'],
            durationEstimate: `${ticketRow.duration_estimate_minutes} mins`,
            status: 'Active',
            isUrgent: ticketRow.is_urgent,
            scenario: scenario?.scenario_text ?? undefined,
            deliverables: deliverables.length > 0 ? deliverables : undefined,
            expectedOutput: scenario?.expected_outcome ?? undefined,
          };
        }
      }

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
    },
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
