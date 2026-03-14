import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
      const progressByCourse: Record<string, number> = {};
      if (session?.user?.id) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, progress_percent')
          .eq('student_id', session.user.id);
        if (enrollments) {
          enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
          for (const e of enrollments) {
            progressByCourse[e.course_id] = Number(e.progress_percent);
          }
        }
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
        progressPercent: progressByCourse[c.id] ?? 0,
        sprints: [],
        isEnrolled: enrolledCourseIds.has(c.id),
      }));

      return fromDb;
    },
  });
}

export function useEnrolledCourses() {
  return useQuery({
    queryKey: ['courses', 'enrolled'],
    queryFn: async (): Promise<DomainCourse[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, course_id, progress_percent')
        .eq('student_id', session.user.id);
      if (!enrollments?.length) return [];

      const courseIds = enrollments.map(e => e.course_id);
      const progressByCourse: Record<string, number> = {};
      const enrollmentIdByCourse: Record<string, string> = {};
      for (const e of enrollments) {
        progressByCourse[e.course_id] = Number(e.progress_percent);
        enrollmentIdByCourse[e.course_id] = e.id;
      }

      const { data: courseRows, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, category, difficulty, fee_amount, total_sprints, total_tickets, profiles!instructor_id(full_name)')
        .in('id', courseIds);

      if (coursesError || !courseRows?.length) return [];
      const courses = courseRows as unknown as CourseRowWithInstructor[];

      const { data: sprintRows } = await supabase
        .from('sprints')
        .select('id, course_id, title, order_index')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true });
      const sprints = sprintRows ?? [];

      const { data: ticketRows } = await supabase
        .from('tickets')
        .select('id, sprint_id, course_id, title, type, duration_estimate_minutes, is_urgent, order_index')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true });
      const tickets = ticketRows ?? [];

      const enrollmentIds = enrollments.map(e => e.id);
      const { data: attempts } = await supabase
        .from('ticket_attempts')
        .select('ticket_id, enrollment_id')
        .in('enrollment_id', enrollmentIds)
        .eq('status', 'passed');
      const passedByEnrollment = new Map<string, Set<string>>();
      for (const a of attempts ?? []) {
        let set = passedByEnrollment.get(a.enrollment_id);
        if (!set) { set = new Set(); passedByEnrollment.set(a.enrollment_id, set); }
        set.add(a.ticket_id);
      }

      const ticketsBySprint = new Map<string, typeof tickets>();
      for (const t of tickets) {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push(t);
        ticketsBySprint.set(t.sprint_id, list);
      }
      for (const list of ticketsBySprint.values()) {
        list.sort((a, b) => a.order_index - b.order_index);
      }

      return courses.map(c => {
        const enrollmentId = enrollmentIdByCourse[c.id];
        const passedTicketIds = passedByEnrollment.get(enrollmentId) ?? new Set();
        const courseSprints = sprints.filter(s => s.course_id === c.id).sort((a, b) => a.order_index - b.order_index);

        const deriveStatus = (ticketId: string, sprintId: string, indexInSprint: number): "Completed" | "Active" | "Locked" => {
          if (passedTicketIds.has(ticketId)) return "Completed";
          const list = ticketsBySprint.get(sprintId) ?? [];
          const prevTicket = list[indexInSprint - 1];
          const prevCompleted = prevTicket ? passedTicketIds.has(prevTicket.id) : false;
          const isFirstInCourse = courseSprints[0]?.id === sprintId && indexInSprint === 0;
          if (isFirstInCourse || prevCompleted) return "Active";
          return "Locked";
        };

        const domainSprints: DomainSprint[] = courseSprints.map(s => {
          const list = ticketsBySprint.get(s.id) ?? [];
          const domainTickets: DomainTicket[] = list.map((t, i) => ({
            id: t.id,
            title: t.title,
            type: t.type as DomainTicket['type'],
            durationEstimate: `${t.duration_estimate_minutes} mins`,
            status: deriveStatus(t.id, s.id, i),
            isUrgent: t.is_urgent,
          }));
          return { id: s.id, title: s.title, order: s.order_index, tickets: domainTickets };
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
          progressPercent: progressByCourse[c.id] ?? 0,
          sprints: domainSprints,
          isEnrolled: true,
        };
      });
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
    queryFn: async (): Promise<DomainTicket> => {
      if (!isUuid(ticketId) || !isUuid(courseId)) {
        throw new Error("Ticket not found");
      }

      const { data: ticketRow, error: ticketError } = await supabase
        .from('tickets')
        .select('id, title, type, duration_estimate_minutes, is_urgent')
        .eq('id', ticketId)
        .eq('course_id', courseId)
        .single();

      if (ticketError || !ticketRow) throw new Error("Ticket not found");

      const { data: scenarioRow } = await supabase
        .from('ticket_scenarios')
        .select('scenario_text, expected_outcome, starter_code')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      const { data: deliverableRows } = await supabase
        .from('ticket_deliverables')
        .select('description')
        .eq('ticket_id', ticketId)
        .order('order_index', { ascending: true });

      const scenario = scenarioRow as { scenario_text: string; expected_outcome: string | null; starter_code?: string | null } | null;
      const deliverables = (deliverableRows ?? []).map((d: { description: string }) => d.description);

      return {
        id: ticketRow.id,
        title: ticketRow.title,
        type: ticketRow.type as DomainTicket['type'],
        durationEstimate: `${ticketRow.duration_estimate_minutes} mins`,
        status: 'Active',
        isUrgent: ticketRow.is_urgent,
        scenario: scenario?.scenario_text ?? undefined,
        deliverables: deliverables.length > 0 ? deliverables : undefined,
        expectedOutput: scenario?.expected_outcome ?? undefined,
        lessonContent: scenario?.scenario_text ?? undefined,
        starterCode: scenario?.starter_code ?? undefined,
      };
    },
  });
}

export function useSubmitTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, ticketId, content }: { courseId: string; ticketId: string; content: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not authenticated");

      const { data: enrollment, error: enrError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', session.user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrError || !enrollment) throw new Error("Enrollment not found");

      const { data: ticket } = await supabase
        .from('tickets')
        .select('challenge_type')
        .eq('id', ticketId)
        .eq('course_id', courseId)
        .single();

      const isCoding = (ticket as { challenge_type?: string } | null)?.challenge_type === 'coding';

      const { error: attemptError } = await supabase
        .from('ticket_attempts')
        .insert({
          student_id: session.user.id,
          ticket_id: ticketId,
          enrollment_id: enrollment.id,
          status: 'submitted',
          submission_code: isCoding ? content : null,
          submission_text: !isCoding ? content : null,
          submitted_at: new Date().toISOString(),
        });

      if (attemptError) throw new Error(attemptError.message);

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'tickets', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
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
  tickets: DomainTicket[];
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
    enabled: !!courseId && isUuid(courseId ?? ''),
    queryFn: async () => {
      if (!courseId) return null;

      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description, category, difficulty, status, fee_amount, company_partner, total_sprints, total_tickets')
        .eq('id', courseId)
        .single();

      if (courseError || !courseRow) {
        return {
          id: courseId,
          title: 'Course',
          description: '',
          category: 'Tech' as const,
          difficulty: 'Beginner' as const,
          status: 'draft' as const,
          fee_amount: 1000,
          company_partner: null as string | null,
          sprints: [] as InstructorSprintWithTickets[],
          materials: [] as InstructorCourseMaterial[],
          total_sprints: 0,
          total_tickets: 0,
        };
      }

      const c = courseRow as {
        id: string; title: string; description: string | null; category: string; difficulty: string;
        status: string; fee_amount: number; company_partner: string | null; total_sprints: number; total_tickets: number;
      };

      const { data: sprintRows } = await supabase
        .from('sprints')
        .select('id, title, description, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const { data: ticketRows } = await supabase
        .from('tickets')
        .select('id, sprint_id, title, type, duration_estimate_minutes, is_urgent, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const { data: materialRows } = await supabase
        .from('course_materials')
        .select('id, title, description, file_url, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      type TicketRow = { id: string; sprint_id: string; title: string; type: string; duration_estimate_minutes: number; is_urgent: boolean; order_index: number };
      const ticketsBySprint = new Map<string, TicketRow[]>();
      for (const t of ticketRows ?? []) {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push(t);
        ticketsBySprint.set(t.sprint_id, list);
      }
      for (const list of ticketsBySprint.values()) {
        list.sort((a, b) => a.order_index - b.order_index);
      }

      const sprints: InstructorSprintWithTickets[] = (sprintRows ?? []).map(s => {
        const list = ticketsBySprint.get(s.id) ?? [];
        const tickets: DomainTicket[] = list.map(t => ({
          id: t.id,
          title: t.title,
          type: t.type as DomainTicket['type'],
          durationEstimate: `${t.duration_estimate_minutes} mins`,
          status: 'Locked' as const,
          isUrgent: t.is_urgent,
        }));
        return {
          id: s.id,
          title: s.title,
          description: (s as { description?: string }).description,
          order: s.order_index,
          tickets,
        };
      });

      const materials: InstructorCourseMaterial[] = (materialRows ?? []).map(m => ({
        id: m.id,
        title: m.title,
        description: (m as { description?: string }).description,
        file_url: (m as { file_url?: string }).file_url,
        created_at: (m as { created_at?: string }).created_at,
      }));

      return {
        id: c.id,
        title: c.title,
        description: c.description ?? '',
        category: c.category as 'Tech' | 'Business' | 'Design' | 'Finance',
        difficulty: c.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        status: (c.status as 'draft' | 'under_review' | 'live' | 'archived') || 'draft',
        fee_amount: Number(c.fee_amount),
        company_partner: c.company_partner,
        sprints,
        materials,
        total_sprints: c.total_sprints,
        total_tickets: c.total_tickets,
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
