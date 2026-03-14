import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "@/lib/domain-types";
import type { Course, Sprint, User, Certificate } from "@/lib/domain-types";
import type {
  InstructorCourse,
  InstructorUser,
  StudentEnrollment,
  TicketPerformance,
  PayoutRecord,
} from "@/lib/instructor-data";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateTicketsForCourseApi,
  useGenerateSprintTickets,
} from "@/lib/api/ai";

function guestUser(): User {
  return {
    id: "",
    name: "",
    email: "",
    degree: "",
    institution: "",
    joinDate: "",
    currentStreak: 0,
    bestStreak: 0,
    feeRefunded: 0,
    feeTotal: 0,
    ticketsCompleted: 0,
    certificates: [],
  };
}

function mapAuthToUser(
  userId: string,
  email: string | undefined,
  profile: { full_name: string; degree: string | null; institution: string | null; current_streak: number; best_streak: number; created_at?: string }
): User {
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return {
    id: userId,
    name: (profile.full_name || email || "User").trim() || "User",
    email: email ?? "",
    degree: profile.degree ?? "",
    institution: profile.institution ?? "",
    joinDate,
    currentStreak: profile.current_streak,
    bestStreak: profile.best_streak,
    feeRefunded: 0,
    feeTotal: 0,
    ticketsCompleted: 0,
    certificates: [],
  };
}

export function useUser() {
  const { user: authUser, profile } = useAuth();
  const isAuthenticated = !!authUser && !!profile;

  return useQuery({
    queryKey: ["user", authUser?.id ?? "anonymous", profile?.created_at ?? ""],
    queryFn: async (): Promise<User> => {
      // When profile failed to load (e.g. timeout), still show auth user info and try to get profile fields from DB
      if (authUser && !profile) {
        let name = authUser.email || "User";
        let degree = "";
        let institution = "";
        let joinDate = "—";
        let currentStreak = 0;
        let bestStreak = 0;
        if (supabase) {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("full_name, degree, institution, current_streak, best_streak, created_at")
            .eq("id", authUser.id)
            .single();
          if (profileRow) {
            name = (profileRow.full_name || authUser.email || "User").trim() || "User";
            degree = profileRow.degree ?? "";
            institution = profileRow.institution ?? "";
            currentStreak = profileRow.current_streak ?? 0;
            bestStreak = profileRow.best_streak ?? 0;
            if (profileRow.created_at) {
              joinDate = new Date(profileRow.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }
          }
        }
        const fallback: User = {
          id: authUser.id,
          name,
          email: authUser.email ?? "",
          degree,
          institution,
          joinDate,
          currentStreak,
          bestStreak,
          feeRefunded: 0,
          feeTotal: 0,
          ticketsCompleted: 0,
          certificates: [],
        };
        if (!supabase) return fallback;
        const { count: ticketsCount } = await supabase
          .from("ticket_attempts")
          .select("id", { count: "exact", head: true })
          .eq("student_id", authUser.id)
          .in("status", ["submitted", "passed", "failed"]);
        if (ticketsCount != null) fallback.ticketsCompleted = ticketsCount;
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, course_id, completed_at, updated_at")
          .eq("student_id", authUser.id)
          .or("status.eq.completed,progress_percent.gte.100");
        if (enrollments?.length) {
          const courseIds = enrollments.map((e: { course_id: string }) => e.course_id);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("id, title, total_sprints")
            .in("id", courseIds);
          const courseById = new Map(
            (coursesData ?? []).map((c: { id: string; title: string; total_sprints: number }) => [c.id, c])
          );
          fallback.certificates = enrollments.map((e: { id: string; course_id: string; completed_at: string | null; updated_at: string }) => {
            const c = courseById.get(e.course_id);
            const dateEarned = e.completed_at ?? e.updated_at ?? new Date().toISOString();
            return {
              id: e.id,
              courseTitle: c?.title ?? "Course",
              dateEarned: typeof dateEarned === "string" ? dateEarned : new Date(dateEarned).toISOString(),
              sprintsCompleted: c?.total_sprints ?? 0,
            };
          });
        }
        return fallback;
      }
      if (isAuthenticated && authUser && profile) {
        const base = mapAuthToUser(authUser.id, authUser.email, profile);
        if (!supabase) return base;

        // Tickets completed = graded attempts (submitted, passed, or failed) — not in_progress
        const { count: ticketsCount, error: ticketsError } = await supabase
          .from("ticket_attempts")
          .select("id", { count: "exact", head: true })
          .eq("student_id", authUser.id)
          .in("status", ["submitted", "passed", "failed"]);
        if (!ticketsError && ticketsCount != null) base.ticketsCompleted = ticketsCount;

        // Proof of work: only completed sprints/courses (status = 'completed' or progress_percent >= 100)
        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select("id, course_id, completed_at, updated_at")
          .eq("student_id", authUser.id)
          .or("status.eq.completed,progress_percent.gte.100");

        if (!enrollError && enrollments?.length) {
          const courseIds = enrollments.map((e: { course_id: string }) => e.course_id);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("id, title, total_sprints")
            .in("id", courseIds);
          const courseById = new Map(
            (coursesData ?? []).map((c: { id: string; title: string; total_sprints: number }) => [c.id, c])
          );
          const certs: Certificate[] = enrollments.map((e: { id: string; course_id: string; completed_at: string | null; updated_at: string }) => {
            const c = courseById.get(e.course_id);
            const dateEarned = e.completed_at ?? e.updated_at ?? new Date().toISOString();
            return {
              id: e.id,
              courseTitle: c?.title ?? "Course",
              dateEarned: typeof dateEarned === "string" ? dateEarned : new Date(dateEarned).toISOString(),
              sprintsCompleted: c?.total_sprints ?? 0,
            };
          });
          base.certificates = certs;
        }
        return base;
      }
      return guestUser();
    },
  });
}

export type StreakRecord = { date: string; tickets_completed: number };

export function useStreakRecords(options?: { enabled?: boolean }) {
  const { user: authUser } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["streak-records", authUser?.id ?? "anonymous"],
    queryFn: async (): Promise<StreakRecord[]> => {
      if (!supabase || !authUser?.id) return [];
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const fromDate = ninetyDaysAgo.toISOString().slice(0, 10);
      const toDate = today.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("streak_records")
        .select("date, tickets_completed")
        .eq("student_id", authUser.id)
        .gte("date", fromDate)
        .lte("date", toDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        date: typeof r.date === "string" ? r.date : (r.date as unknown as string),
        tickets_completed: r.tickets_completed ?? 0,
      }));
    },
    enabled: !!authUser?.id && enabled,
  });
}

export function useCourses() {
  const { user: authUser, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['courses', authUser?.id ?? 'anonymous'],
    enabled: !authLoading,
    queryFn: async (): Promise<Course[]> => {
      if (!supabase) return [];

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          category,
          difficulty,
          fee_amount,
          total_sprints,
          total_tickets,
          company_partner,
          profiles!instructor_id(full_name)
        `)
        .eq('status', 'live');

      if (coursesError) {
        console.error('[useCourses] Failed to load courses', coursesError);
        return [];
      }

      type CourseRow = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      const rows: CourseRow[] = (coursesData ?? []) as CourseRow[];

      const courseIds = rows.map((c) => c.id);
      const sprintCountByCourse = new Map<string, number>();
      if (courseIds.length > 0) {
        const { data: sprintsRows } = await supabase
          .from('sprints')
          .select('course_id')
          .in('course_id', courseIds);
        (sprintsRows ?? []).forEach((s: { course_id: string }) => {
          sprintCountByCourse.set(s.course_id, (sprintCountByCourse.get(s.course_id) ?? 0) + 1);
        });
      }

      let enrolledCourseIds = new Set<string>();
      if (authUser?.id) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', authUser.id)
          .in('status', ['active', 'completed']);
        if (enrollments) {
          enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
        }
      }

      const getInstructorName = (c: CourseRow): string => {
        const p = c.profiles;
        const name = Array.isArray(p) ? p[0]?.full_name : p?.full_name;
        return c.company_partner ?? name ?? 'Instructor';
      };

      return rows.map((c): Course => ({
        id: c.id,
        title: c.title,
        instructor: getInstructorName(c),
        category: c.category as Course['category'],
        difficulty: c.difficulty as Course['difficulty'],
        totalSprints: sprintCountByCourse.get(c.id) ?? 0,
        totalTickets: c.total_tickets ?? 0,
        fee: Number(c.fee_amount ?? 0),
        isEnrolled: enrolledCourseIds.has(c.id),
        sprints: [],
      }));
    },
  });
}

export function useEnrolledCourses() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', 'enrolled', authUser?.id ?? 'anonymous'],
    queryFn: async (): Promise<Course[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id, progress_percent, current_sprint_id')
        .eq('student_id', authUser.id)
        .eq('status', 'active');

      if (enrollError || !enrollments?.length) {
        return [];
      }

      const courseIds = enrollments.map((e: { course_id: string }) => e.course_id);
      const enrollmentByCourse = new Map(
        (enrollments as { course_id: string; progress_percent?: number; current_sprint_id?: string | null }[]).map((e) => [
          e.course_id,
          {
            progress_percent: Number(e.progress_percent ?? 0),
            current_sprint_id: e.current_sprint_id ?? null,
          },
        ])
      );

      const [coursesResult, sprintsResult] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            id,
            title,
            category,
            difficulty,
            fee_amount,
            total_sprints,
            total_tickets,
            company_partner,
            profiles!instructor_id(full_name)
          `)
          .in('id', courseIds),
        supabase
          .from('sprints')
          .select('id, course_id, order_index')
          .in('course_id', courseIds)
          .order('order_index', { ascending: true }),
      ]);

      const { data: coursesData, error: coursesError } = coursesResult;
      const { data: sprintsRows } = sprintsResult;

      if (coursesError || !coursesData?.length) {
        return [];
      }

      const sprintsByCourse = new Map<string, { id: string; order_index: number }[]>();
      (sprintsRows ?? []).forEach((s: { id: string; course_id: string; order_index: number }) => {
        const list = sprintsByCourse.get(s.course_id) ?? [];
        list.push({ id: s.id, order_index: s.order_index ?? 0 });
        sprintsByCourse.set(s.course_id, list);
      });

      function currentSprintOneBased(courseId: string): number {
        const enrollment = enrollmentByCourse.get(courseId);
        const sprintId = enrollment?.current_sprint_id;
        if (!sprintId) return 1;
        const list = sprintsByCourse.get(courseId) ?? [];
        const idx = list.findIndex((s) => s.id === sprintId);
        return idx >= 0 ? idx + 1 : 1;
      }

      type Row = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      return (coursesData as Row[]).map((c): Course => {
        const enrollment = enrollmentByCourse.get(c.id);
        return {
          id: c.id,
          title: c.title,
          instructor: c.company_partner ?? (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) ?? 'Instructor',
          category: c.category as Course['category'],
          difficulty: c.difficulty as Course['difficulty'],
          totalSprints: c.total_sprints ?? 0,
          totalTickets: c.total_tickets ?? 0,
          fee: Number(c.fee_amount ?? 0),
          isEnrolled: true,
          progressPercent: enrollment ? enrollment.progress_percent : 0,
          currentSprint: currentSprintOneBased(c.id),
          sprints: [],
        };
      });
    },
  });
}

export function useEnrolledCoursesWithSprints() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', 'enrolled', 'with-sprints', authUser?.id ?? 'anonymous'],
    queryFn: async (): Promise<Course[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, course_id, progress_percent, current_sprint_id')
        .eq('student_id', authUser.id)
        .in('status', ['active', 'completed']);

      if (enrollError || !enrollments?.length) {
        return [];
      }

      const courseIds = enrollments.map((e: { course_id: string }) => e.course_id);
      const enrollmentIds = (enrollments as { id: string }[]).map((e) => e.id);
      const enrollmentByCourse = new Map(
        (enrollments as { id: string; course_id: string; progress_percent?: number; current_sprint_id?: string | null }[]).map((e) => [
          e.course_id,
          {
            id: e.id,
            progress_percent: Number(e.progress_percent ?? 0),
            current_sprint_id: e.current_sprint_id ?? null,
          },
        ])
      );
      const enrollmentIdToCourseId = new Map(
        (enrollments as { id: string; course_id: string }[]).map((e) => [e.id, e.course_id])
      );

      const [coursesResult, sprintsResult, ticketsResult, attemptsResult] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            id,
            title,
            category,
            difficulty,
            fee_amount,
            total_sprints,
            total_tickets,
            company_partner,
            profiles!instructor_id(full_name)
          `)
          .in('id', courseIds),
        supabase
          .from('sprints')
          .select('id, course_id, title, order_index')
          .in('course_id', courseIds)
          .order('order_index', { ascending: true }),
        supabase
          .from('tickets')
          .select('id, sprint_id, course_id, title, type, duration_estimate_minutes, order_index')
          .in('course_id', courseIds)
          .order('order_index', { ascending: true }),
        supabase
          .from('ticket_attempts')
          .select('enrollment_id, ticket_id')
          .in('enrollment_id', enrollmentIds),
      ]);

      const { data: coursesData, error: coursesError } = coursesResult;
      const { data: sprintsRows } = sprintsResult;
      const { data: ticketsRows } = ticketsResult;
      const { data: attemptsRows } = attemptsResult;

      if (coursesError || !coursesData?.length) {
        return [];
      }

      const attemptedByCourse = new Map<string, Set<string>>();
      for (const a of (attemptsRows ?? []) as { enrollment_id: string; ticket_id: string }[]) {
        const cid = enrollmentIdToCourseId.get(a.enrollment_id);
        if (!cid) continue;
        let set = attemptedByCourse.get(cid);
        if (!set) {
          set = new Set<string>();
          attemptedByCourse.set(cid, set);
        }
        set.add(a.ticket_id);
      }

      const sprintsByCourse = new Map<string, { id: string; title: string; order_index: number }[]>();
      (sprintsRows ?? []).forEach((s: { id: string; course_id: string; title: string; order_index: number }) => {
        const list = sprintsByCourse.get(s.course_id) ?? [];
        list.push({ id: s.id, title: s.title, order_index: s.order_index ?? 0 });
        sprintsByCourse.set(s.course_id, list);
      });

      const ticketsBySprint = new Map<string, { id: string; title: string; type: string; duration_estimate_minutes: number | null; order_index: number }[]>();
      (ticketsRows ?? []).forEach((t: { id: string; sprint_id: string; title: string; type: string; duration_estimate_minutes: number | null; order_index: number }) => {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push({
          id: t.id,
          title: t.title,
          type: t.type,
          duration_estimate_minutes: t.duration_estimate_minutes,
          order_index: t.order_index ?? 0,
        });
        ticketsBySprint.set(t.sprint_id, list);
      });

      type CourseRow = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      type TicketStatus = Ticket['status'];

      return (coursesData as CourseRow[]).map((c): Course => {
        const enrollment = enrollmentByCourse.get(c.id);
        const attemptedTicketIds = attemptedByCourse.get(c.id) ?? new Set<string>();
        const sprintsList = sprintsByCourse.get(c.id) ?? [];
        const currentSprintId = enrollment?.current_sprint_id ?? sprintsList[0]?.id ?? null;
        const sprintOrder = new Map(sprintsList.map((s, i) => [s.id, i]));

        const getTicketStatus = (ticketId: string, sprintId: string): TicketStatus => {
          if (attemptedTicketIds.has(ticketId)) return 'Completed';
          const sprintIdx = sprintOrder.get(sprintId) ?? 0;
          const currentIdx = currentSprintId != null ? (sprintOrder.get(currentSprintId) ?? 0) : 0;
          if (sprintIdx < currentIdx) return 'Active';
          if (sprintIdx > currentIdx) return 'Locked';
          return 'Active';
        };

        const sprints: Sprint[] = sprintsList.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order_index,
          tickets: (ticketsBySprint.get(s.id) ?? []).map((t) => ({
            id: t.id,
            title: t.title,
            type: (t.type ?? 'Build') as Ticket['type'],
            durationEstimate: t.duration_estimate_minutes != null ? `${t.duration_estimate_minutes} mins` : '30 mins',
            status: getTicketStatus(t.id, s.id),
            hasAttemptedBefore: attemptedTicketIds.has(t.id),
          } as Ticket)),
        }));

        return {
          id: c.id,
          title: c.title,
          instructor: c.company_partner ?? (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) ?? 'Instructor',
          category: c.category as Course['category'],
          difficulty: c.difficulty as Course['difficulty'],
          totalSprints: c.total_sprints ?? 0,
          totalTickets: c.total_tickets ?? 0,
          fee: Number(c.fee_amount ?? 0),
          isEnrolled: true,
          progressPercent: enrollment ? enrollment.progress_percent : 0,
          currentSprint: currentSprintId ? (sprintOrder.get(currentSprintId) ?? 0) + 1 : 1,
          sprints,
        };
      });
    },
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string): Promise<void> => {
      if (!supabase) return;
      if (!authUser?.id) {
        throw new Error('You must be signed in to enroll.');
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: authUser.id,
          course_id: courseId,
          status: 'active',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already enrolled in this course.');
        }
        throw new Error(error.message ?? 'Enrollment failed.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
    },
    onError: (error) => {
      if (error?.message?.includes('already enrolled')) {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
      }
    },
  });
}

export function useInstructorCourses() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['instructor', 'courses', authUser?.id ?? ''],
    enabled: !!authUser?.id,
    queryFn: async (): Promise<InstructorCourse[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(
          'id,title,category,difficulty,status,total_sprints,total_tickets,avg_rating,company_partner',
        )
        .eq('instructor_id', authUser.id)
        .neq('status', 'archived');

      if (coursesError) {
        console.error('[useInstructorCourses] Failed to load courses', coursesError);
        return [];
      }

      const courses = coursesData ?? [];
      if (courses.length === 0) return [];

      const courseIds = courses.map((c: { id: string }) => c.id);

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, course_id, status')
        .in('course_id', courseIds);

      const enrollments = enrollmentsData ?? [];
      const enrollmentsByCourse = new Map<string, { id: string; status: string }[]>();
      for (const e of enrollments as { id: string; course_id: string; status: string }[]) {
        const list = enrollmentsByCourse.get(e.course_id) ?? [];
        list.push({ id: e.id, status: e.status });
        enrollmentsByCourse.set(e.course_id, list);
      }

      const enrollmentIds = enrollments.map((e: { id: string }) => e.id);
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('enrollment_id, instructor_share_amount')
        .in('enrollment_id', enrollmentIds);

      const enrollmentById = new Map(enrollments.map((e: { id: string; course_id: string; status: string }) => [e.id, e]));
      const earnedByCourse = new Map<string, number>();
      for (const p of paymentsData ?? [] as { enrollment_id: string; instructor_share_amount: number }[]) {
        const enr = enrollmentById.get(p.enrollment_id);
        if (!enr || enr.status !== 'completed') continue;
        const cur = earnedByCourse.get(enr.course_id) ?? 0;
        earnedByCourse.set(enr.course_id, cur + Number(p.instructor_share_amount ?? 0));
      }

      return courses.map((c: {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        status: string;
        total_sprints: number;
        total_tickets: number;
        avg_rating: number;
        company_partner: string | null;
      }) => {
        const enrList = enrollmentsByCourse.get(c.id) ?? [];
        const activeCount = enrList.filter((e) => e.status === 'active').length;
        const completedCount = enrList.filter((e) => e.status === 'completed').length;
        const totalEnr = enrList.length;
        const completionRate = totalEnr > 0 ? Math.round((completedCount / totalEnr) * 100) : 0;
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          difficulty: c.difficulty,
          status:
            c.status === 'live' ? 'Live' : c.status === 'under_review' ? 'Under Review' : 'Draft',
          studentsEnrolled: activeCount + completedCount,
          sprints: c.total_sprints ?? 0,
          tickets: c.total_tickets ?? 0,
          completionRate,
          avgRating: Number(c.avg_rating ?? 0),
          earnedToDate: Math.round(earnedByCourse.get(c.id) ?? 0),
          companyPartner: c.company_partner,
        } as InstructorCourse;
      });
    },
  });
}

export function useInstructorProfile() {
  const { user: authUser, profile } = useAuth();

  return useQuery({
    queryKey: ['instructor', 'profile', authUser?.id ?? ''],
    enabled: !!authUser?.id && !!supabase,
    queryFn: async (): Promise<InstructorUser | null> => {
      if (!supabase || !authUser?.id || !profile) return null;

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('professional_title, bio, created_at')
        .eq('id', authUser.id)
        .single();
      const joinDate = profileRow?.created_at
        ? new Date(profileRow.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '';

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', authUser.id);
      const courseIds = (coursesData ?? []).map((c: { id: string }) => c.id);
      if (courseIds.length === 0) {
        return {
          name: profile.full_name || authUser.email || 'Instructor',
          email: authUser.email ?? '',
          title: profileRow?.professional_title ?? '',
          institution: profileRow?.bio ?? '',
          joinDate,
          totalEarned: 0,
          pendingPayout: 0,
        };
      }

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, course_id, status')
        .in('course_id', courseIds);
      const enrollments = (enrollmentsData ?? []) as { id: string; course_id: string; status: string }[];
      const enrollmentIds = enrollments.map((e) => e.id);
      const completedEnrollmentIds = new Set(enrollments.filter((e) => e.status === 'completed').map((e) => e.id));
      const activeEnrollmentIds = new Set(enrollments.filter((e) => e.status === 'active').map((e) => e.id));

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('enrollment_id, instructor_share_amount')
        .in('enrollment_id', enrollmentIds);

      let totalEarned = 0;
      let pendingPayout = 0;
      for (const p of (paymentsData ?? []) as { enrollment_id: string; instructor_share_amount: number }[]) {
        const amt = Number(p.instructor_share_amount ?? 0);
        if (completedEnrollmentIds.has(p.enrollment_id)) totalEarned += amt;
        else if (activeEnrollmentIds.has(p.enrollment_id)) pendingPayout += amt;
      }

      return {
        name: profile.full_name || authUser.email || 'Instructor',
        email: authUser.email ?? '',
        title: profileRow?.professional_title ?? '',
        institution: profileRow?.bio ?? '',
        joinDate,
        totalEarned: Math.round(totalEarned),
        pendingPayout: Math.round(pendingPayout),
      };
    },
  });
}

export function useInstructorStudentEnrollments(options?: { courseId?: string }) {
  const { user: authUser } = useAuth();
  const courseId = options?.courseId;

  return useQuery({
    queryKey: ['instructor', 'student-enrollments', authUser?.id ?? '', courseId ?? 'all'],
    enabled: !!authUser?.id && !!supabase,
    queryFn: async (): Promise<StudentEnrollment[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', authUser.id);
      const instructorCourseIds = (coursesData ?? []).map((c: { id: string }) => c.id);
      if (instructorCourseIds.length === 0) return [];

      const courseIds = courseId
        ? (instructorCourseIds.includes(courseId) ? [courseId] : [])
        : instructorCourseIds;

      const { data: enrollmentsData, error: enrError } = await supabase
        .from('enrollments')
        .select('id, student_id, course_id, progress_percent, status, courses(title)')
        .in('course_id', courseIds);

      if (enrError || !enrollmentsData?.length) return [];

      const enrollmentIds = (enrollmentsData as { id: string }[]).map((e) => e.id);
      const studentIds = [...new Set((enrollmentsData as { student_id: string }[]).map((e) => e.student_id).filter(Boolean))];

      const [lastAttemptsRes, profilesRes] = await Promise.all([
        supabase
          .from('ticket_attempts')
          .select('enrollment_id, submitted_at, updated_at')
          .in('enrollment_id', enrollmentIds)
          .order('updated_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, current_streak').in('id', studentIds),
      ]);

      const lastAttempts = lastAttemptsRes.data ?? [];
      const lastByEnrollment = new Map<string, { submitted_at: string | null; updated_at: string }>();
      for (const a of lastAttempts as { enrollment_id: string; submitted_at: string | null; updated_at: string }[]) {
        if (!lastByEnrollment.has(a.enrollment_id)) {
          lastByEnrollment.set(a.enrollment_id, { submitted_at: a.submitted_at, updated_at: a.updated_at });
        }
      }

      const profilesData = profilesRes.data ?? [];
      const nameByStudent = new Map(profilesData.map((p: { id: string; full_name: string }) => [p.id, p.full_name ?? 'Student']));
      const streakByStudent = new Map(profilesData.map((p: { id: string; current_streak: number }) => [p.id, p.current_streak ?? 0]));

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const formatRelative = (iso: string) => {
        const d = new Date(iso).getTime();
        const diffDays = Math.floor((now - d) / oneDay);
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return `${Math.floor(diffDays / 7)} weeks ago`;
      };

      return (enrollmentsData as {
        id: string;
        student_id: string;
        course_id: string;
        progress_percent: number;
        status: string;
        courses: { title: string } | { title: string }[] | null;
      }[]).map((e) => {
        const last = lastByEnrollment.get(e.id);
        const lastIso = last?.submitted_at ?? last?.updated_at;
        const lastActivity = lastIso ? formatRelative(lastIso) : '—';
        const progress = Math.round(Number(e.progress_percent ?? 0));
        const streak = streakByStudent.get(e.student_id) ?? 0;
        let status: StudentEnrollment['status'] = 'On Track';
        if (e.status === 'completed') status = 'Completed';
        else if (lastIso && (now - new Date(lastIso).getTime()) > 7 * oneDay) status = 'At Risk';

        const courseTitle = e.courses && (Array.isArray(e.courses) ? e.courses[0]?.title : (e.courses as { title: string }).title);
        return {
          name: nameByStudent.get(e.student_id) ?? 'Student',
          course: courseTitle ?? 'Course',
          progress,
          streak,
          lastTicket: '—',
          lastActivity,
          status,
        };
      });
    },
  });
}

export function useInstructorTicketPerformance(options?: { courseId?: string }) {
  const { user: authUser } = useAuth();
  const courseId = options?.courseId;

  return useQuery({
    queryKey: ['instructor', 'ticket-performance', authUser?.id ?? '', courseId ?? 'all'],
    enabled: !!authUser?.id && !!supabase,
    queryFn: async (): Promise<TicketPerformance[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', authUser.id);
      const instructorCourseIds = (coursesData ?? []).map((c: { id: string }) => c.id);
      if (instructorCourseIds.length === 0) return [];
      const courseTitles = new Map((coursesData ?? []).map((c: { id: string; title: string }) => [c.id, c.title]));

      const courseIds = courseId && instructorCourseIds.includes(courseId) ? [courseId] : instructorCourseIds;

      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, title, type, course_id')
        .in('course_id', courseIds);
      if (!ticketsData?.length) return [];

      const ticketIds = (ticketsData as { id: string }[]).map((t) => t.id);
      const { data: attemptsData } = await supabase
        .from('ticket_attempts')
        .select('ticket_id, status, ai_score, time_spent_minutes')
        .in('ticket_id', ticketIds);

      const byTicket = new Map<string, { passed: number; total: number; scoreSum: number; timeSum: number; timeCount: number }>();
      for (const a of (attemptsData ?? []) as { ticket_id: string; status: string; ai_score: number | null; time_spent_minutes: number | null }[]) {
        let cur = byTicket.get(a.ticket_id);
        if (!cur) {
          cur = { passed: 0, total: 0, scoreSum: 0, timeSum: 0, timeCount: 0 };
          byTicket.set(a.ticket_id, cur);
        }
        cur.total += 1;
        if (a.status === 'passed') cur.passed += 1;
        if (a.ai_score != null) cur.scoreSum += a.ai_score;
        if (a.time_spent_minutes != null) {
          cur.timeSum += a.time_spent_minutes;
          cur.timeCount += 1;
        }
      }

      return (ticketsData as { id: string; title: string; type: string | null; course_id: string }[]).map((t) => {
        const agg = byTicket.get(t.id) ?? { passed: 0, total: 0, scoreSum: 0, timeSum: 0, timeCount: 0 };
        const passRate = agg.total > 0 ? Math.round((agg.passed / agg.total) * 100) : 0;
        const avgScore = agg.total > 0 ? Math.round(agg.scoreSum / agg.total) : 0;
        const avgMins = agg.timeCount > 0 ? Math.round(agg.timeSum / agg.timeCount) : 0;
        return {
          title: t.title,
          course: courseTitles.get(t.course_id) ?? 'Course',
          type: t.type ?? 'Build',
          avgScore,
          attempts: agg.total,
          passRate,
          avgTime: avgMins ? `${avgMins} mins` : '—',
        };
      });
    },
  });
}

export function useInstructorPayoutRecords() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['instructor', 'payout-records', authUser?.id ?? ''],
    enabled: !!authUser?.id && !!supabase,
    queryFn: async (): Promise<PayoutRecord[]> => {
      if (!supabase || !authUser?.id) return [];

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', authUser.id);
      const courseIds = (coursesData ?? []).map((c: { id: string }) => c.id);
      if (courseIds.length === 0) return [];
      const courseTitles = new Map((coursesData ?? []).map((c: { id: string; title: string }) => [c.id, c.title]));

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, course_id, completed_at, status')
        .eq('status', 'completed')
        .in('course_id', courseIds);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('enrollment_id, course_id, instructor_share_amount, amount_paid, platform_fee_amount, refunded_at, payment_status')
        .in('course_id', courseIds);

      const enrollmentById = new Map(
        (enrollmentsData ?? []).map((e: { id: string; course_id: string; completed_at: string | null; status: string }) => [e.id, e])
      );

      const byPeriodCourse = new Map<
        string,
        { studentsCompleted: number; grossRevenue: number; platformFee: number; netPayout: number; refundedAt: string | null }
      >();

      for (const p of (paymentsData ?? []) as {
        enrollment_id: string;
        course_id: string;
        instructor_share_amount: number;
        amount_paid: number;
        platform_fee_amount: number;
        refunded_at: string | null;
        payment_status: string;
      }[]) {
        const enr = enrollmentById.get(p.enrollment_id);
        if (!enr || enr.status !== 'completed') continue;
        const periodKey = p.refunded_at
          ? new Date(p.refunded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const key = `${periodKey}|${p.course_id}`;
        const existing = byPeriodCourse.get(key);
        if (!existing) {
          byPeriodCourse.set(key, {
            studentsCompleted: 1,
            grossRevenue: Number(p.amount_paid ?? 0),
            platformFee: Number(p.platform_fee_amount ?? 0),
            netPayout: Number(p.instructor_share_amount ?? 0),
            refundedAt: p.refunded_at,
          });
        } else {
          existing.studentsCompleted += 1;
          existing.grossRevenue += Number(p.amount_paid ?? 0);
          existing.platformFee += Number(p.platform_fee_amount ?? 0);
          existing.netPayout += Number(p.instructor_share_amount ?? 0);
        }
      }

      const records: PayoutRecord[] = [];
      byPeriodCourse.forEach((x, key) => {
        const [period, courseId] = key.split('|');
        const courseName = courseTitles.get(courseId) ?? 'Course';
        records.push({
          period,
          courseName,
          studentsCompleted: x.studentsCompleted,
          grossRevenue: Math.round(x.grossRevenue),
          platformFee: Math.round(x.platformFee),
          netPayout: Math.round(x.netPayout),
          status: x.refundedAt ? 'Paid' : 'Pending',
        });
      });

      records.sort((a, b) => {
        const aDate = new Date(a.period);
        const bDate = new Date(b.period);
        return bDate.getTime() - aDate.getTime();
      });
      return records;
    },
  });
}

export interface InstructorCourseMaterial {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  orderIndex: number;
  sprintId?: string | null;
}

export interface InstructorTicketSummary {
  id: string;
  title: string;
  type: string | null;
  durationEstimateMinutes: number | null;
  isUrgent: boolean;
  orderIndex: number;
}

export interface InstructorSprintWithTickets {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  tickets: InstructorTicketSummary[];
}

export interface InstructorCourseDetailData {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  description: string | null;
  materials: InstructorCourseMaterial[];
  sprints: InstructorSprintWithTickets[];
}

export interface CreateSprintPayload {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface AssignMaterialsToSprintPayload {
  courseId: string;
  sprintId: string;
  materialIds: string[];
}

export interface UploadCourseMaterialPayload {
  courseId: string;
  file: File;
  title?: string;
  description?: string;
  shouldTriggerGeneration?: boolean;
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      title,
      description,
      orderIndex,
    }: CreateSprintPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot create sprint.",
        );
      }

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error("Sprint title is required.");
      }

      const { data, error } = await supabase
        .from("sprints")
        .insert({
          course_id: courseId,
          title: trimmedTitle,
          description: description?.trim() || null,
          order_index: orderIndex ?? 0,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(
          error?.message ?? "Failed to create sprint.",
        );
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", variables.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor", "courses"],
      });
    },
  });
}

export function useUploadCourseMaterial() {
  const queryClient = useQueryClient();

  const mapFileToMaterialType = (file: File): 'pdf' | 'video' | 'doc' | 'link' | 'other' => {
    const mime = (file.type || '').toLowerCase();
    const name = file.name.toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';

    if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi')) {
      return 'video';
    }

    if (
      mime === 'application/msword' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/vnd.ms-powerpoint' ||
      mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      name.endsWith('.ppt') ||
      name.endsWith('.pptx')
    ) {
      return 'doc';
    }

    if (mime === 'text/html' || mime === 'application/xhtml+xml' || name.endsWith('.html') || name.endsWith('.htm')) {
      return 'link';
    }

    return 'other';
  };

  return useMutation({
    mutationFn: async ({
      courseId,
      file,
      title,
      description,
      shouldTriggerGeneration,
    }: UploadCourseMaterialPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot upload course materials.",
        );
      }

      const existingDetail =
        queryClient.getQueryData<InstructorCourseDetailData | null>([
          "instructor",
          "course-detail",
          courseId,
        ]) ?? null;

      const hadNoMaterials =
        !existingDetail || (existingDetail.materials?.length ?? 0) === 0;
      const hadNoSprints =
        !existingDetail || (existingDetail.sprints?.length ?? 0) === 0;

      const baseName =
        title?.trim() ||
        file.name.replace(/\.[^/.]+$/, "").replace(/[_\-.]+/g, " ");

      const timestamp = Date.now();
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${courseId}/${timestamp}-${safeFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError || !uploadData) {
        throw new Error(
          uploadError?.message ?? "Failed to upload course material file.",
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("course-materials")
        .getPublicUrl(uploadData.path);

      const fileUrl = publicUrlData.publicUrl;

      const orderIndex =
        (existingDetail?.materials?.length ?? 0) > 0
          ? (existingDetail?.materials?.length ?? 0)
          : 0;

      const { data: insertedMaterials, error: insertError } = await supabase
        .from("course_materials")
        .insert({
          course_id: courseId,
          title: baseName,
          description: description?.trim() || null,
          file_url: fileUrl,
          file_type: mapFileToMaterialType(file),
          order_index: orderIndex,
        })
        .select("*");

      if (insertError || !insertedMaterials || !insertedMaterials[0]) {
        throw new Error(
          insertError?.message ??
            "Failed to save course material metadata in the database.",
        );
      }

      let generationResult: Awaited<
        ReturnType<typeof generateTicketsForCourseApi>
      > | null = null;

      if (shouldTriggerGeneration && hadNoMaterials && hadNoSprints) {
        try {
          generationResult = await generateTicketsForCourseApi(courseId, {
            mode: "initial",
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            "[useUploadCourseMaterial] Failed to auto-generate tickets",
            err,
          );
        }
      }

      return {
        material: insertedMaterials[0],
        generationResult,
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-detail", variables.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["instructor", "courses"],
      });
    },
  });
}

export function useAssignMaterialsToSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      sprintId,
      materialIds,
    }: AssignMaterialsToSprintPayload) => {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Cannot assign materials to sprint.",
        );
      }

      const { error: clearError } = await supabase
        .from("course_materials")
        .update({ sprint_id: null })
        .eq("course_id", courseId);

      if (clearError) {
        console.error(
          "[useAssignMaterialsToSprint] Failed to clear existing sprint-material mapping",
          clearError,
        );
        throw new Error(
          clearError.message ?? "Failed to clear materials from sprints.",
        );
      }

      if (materialIds.length === 0) return;

      const { error: updateError } = await supabase
        .from("course_materials")
        .update({ sprint_id: sprintId })
        .in("id", materialIds)
        .eq("course_id", courseId);

      if (updateError) {
        throw new Error(
          updateError.message ?? "Failed to assign materials to sprint.",
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "instructor",
          "course-detail",
          variables.courseId,
        ],
      });
    },
  });
}

export function useInstructorCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: ["instructor", "course-detail", courseId],
    enabled: !!courseId && !!supabase,
    queryFn: async (): Promise<InstructorCourseDetailData | null> => {
      if (!supabase || !courseId) return null;

      const client = supabase;

      const [
        { data: course, error: courseError },
        { data: materials, error: materialsError },
        { data: sprints, error: sprintsError },
        { data: tickets, error: ticketsError },
      ] = await Promise.all([
        client
          .from("courses")
          .select("id, title, category, difficulty, description")
          .eq("id", courseId)
          .single(),
        client
          .from("course_materials")
          .select("id, title, description, file_url, file_type, order_index, sprint_id")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
        client
          .from("sprints")
          .select("id, title, description, order_index")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
        client
          .from("tickets")
          .select(
            "id, title, type, duration_estimate_minutes, is_urgent, order_index, sprint_id",
          )
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
      ]);

      if (courseError || !course) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorCourseDetail] Failed to load course", courseError);
        return null;
      }

      if (materialsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load materials",
          materialsError,
        );
      }

      if (sprintsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load sprints",
          sprintsError,
        );
      }

      if (ticketsError) {
        // eslint-disable-next-line no-console
        console.error(
          "[useInstructorCourseDetail] Failed to load tickets",
          ticketsError,
        );
      }

      const materialsMapped: InstructorCourseMaterial[] = (materials ?? []).map(
        (m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description ?? null,
          fileUrl: m.file_url ?? null,
          fileType: m.file_type ?? null,
          orderIndex: m.order_index ?? 0,
          sprintId: m.sprint_id ?? null,
        }),
      );

      const ticketsBySprintId = new Map<string, InstructorTicketSummary[]>();
      (tickets ?? []).forEach((t: any) => {
        const list = ticketsBySprintId.get(t.sprint_id) ?? [];
        list.push({
          id: t.id,
          title: t.title,
          type: t.type ?? null,
          durationEstimateMinutes: t.duration_estimate_minutes ?? null,
          isUrgent: !!t.is_urgent,
          orderIndex: t.order_index ?? 0,
        });
        ticketsBySprintId.set(t.sprint_id, list);
      });

      const sprintsMapped: InstructorSprintWithTickets[] = (sprints ?? []).map(
        (s: any) => {
          const sprintTickets = (ticketsBySprintId.get(s.id) ?? []).sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          return {
            id: s.id,
            title: s.title,
            description: s.description ?? null,
            orderIndex: s.order_index ?? 0,
            tickets: sprintTickets,
          };
        },
      );

      return {
        id: course.id,
        title: course.title,
        category: course.category ?? null,
        difficulty: course.difficulty ?? null,
        description: course.description ?? null,
        materials: materialsMapped,
        sprints: sprintsMapped,
      };
    },
  });
}

export interface TicketDetailData {
  title: string;
  type: string | null;
  durationEstimate: string;
  isUrgent: boolean;
  scenario: string | null;
  deliverables: string[];
}

/** Instructor: list attempts for a course (for review / Grade with AI). */
export interface InstructorAttemptListItem {
  id: string;
  ticket_id: string;
  ticket_title: string;
  student_id: string;
  student_name: string;
  status: AttemptStatus;
  submitted_at: string | null;
  ai_score: number | null;
  created_at: string;
}

export function useInstructorCourseAttempts(courseId: string | null) {
  return useQuery({
    queryKey: ["instructor", "course-attempts", courseId],
    enabled: !!courseId && !!supabase,
    queryFn: async (): Promise<InstructorAttemptListItem[]> => {
      if (!supabase || !courseId) return [];

      const { data: ticketRows, error: ticketsError } = await supabase
        .from("tickets")
        .select("id")
        .eq("course_id", courseId);

      if (ticketsError || !ticketRows?.length) return [];

      const ticketIds = ticketRows.map((t: { id: string }) => t.id);

      const { data: attemptRows, error: attemptsError } = await supabase
        .from("ticket_attempts")
        .select(
          `
          id,
          ticket_id,
          student_id,
          status,
          submitted_at,
          ai_score,
          created_at,
          tickets(title),
          profiles(full_name)
        `
        )
        .in("ticket_id", ticketIds)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (attemptsError) {
        console.error("[useInstructorCourseAttempts]", attemptsError);
        return [];
      }

      const list = (attemptRows ?? []).map((row: Record<string, unknown>) => {
        const tickets = row.tickets as { title: string } | null;
        const profiles = row.profiles as { full_name: string } | null;
        return {
          id: row.id as string,
          ticket_id: row.ticket_id as string,
          ticket_title: tickets?.title ?? "—",
          student_id: row.student_id as string,
          student_name: profiles?.full_name ?? "Student",
          status: row.status as AttemptStatus,
          submitted_at: row.submitted_at as string | null,
          ai_score: row.ai_score as number | null,
          created_at: row.created_at as string,
        };
      });

      return list;
    },
  });
}

/** Instructor: full detail for one attempt (for review sheet). */
export interface InstructorAttemptDetail {
  attempt: TicketAttemptRow;
  deliverableSubmissions: (DeliverableSubmissionRow & { deliverable_description?: string })[];
}

export function useInstructorAttemptDetail(attemptId: string | null) {
  return useQuery({
    queryKey: ["instructor", "attempt-detail", attemptId],
    enabled: !!attemptId && !!supabase,
    queryFn: async (): Promise<InstructorAttemptDetail | null> => {
      if (!supabase || !attemptId) return null;

      const { data: attempt, error: attemptError } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptError || !attempt) return null;

      const { data: subs, error: subsError } = await supabase
        .from("deliverable_submissions")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      if (subsError) return { attempt: attempt as TicketAttemptRow, deliverableSubmissions: [] };

      const deliverableIds = (subs ?? []).map((s: { deliverable_id: string }) => s.deliverable_id);
      let descriptions: Record<string, string> = {};
      if (deliverableIds.length > 0) {
        const { data: delivRows } = await supabase
          .from("ticket_deliverables")
          .select("id, description")
          .in("id", deliverableIds);
        descriptions = ((delivRows ?? []) as { id: string; description: string }[]).reduce(
          (acc, d) => {
            acc[d.id] = d.description;
            return acc;
          },
          {} as Record<string, string>
        );
      }

      const deliverableSubmissions = (subs ?? []).map(
        (s: DeliverableSubmissionRow & { deliverable_id: string }) => ({
          ...s,
          deliverable_description: descriptions[s.deliverable_id] ?? "",
        })
      );

      return {
        attempt: attempt as TicketAttemptRow,
        deliverableSubmissions,
      };
    },
  });
}

/** Fetch a single ticket's scenario and deliverables (for instructor Supabase path). */
export function useInstructorTicketDetail(
  courseId: string | null,
  ticketId: string | null
) {
  return useQuery({
    queryKey: ["instructor", "ticket-detail", courseId, ticketId],
    enabled: !!courseId && !!ticketId && !!supabase,
    queryFn: async (): Promise<TicketDetailData | null> => {
      if (!supabase || !ticketId) return null;

      const [
        { data: ticket, error: ticketError },
        { data: scenarioRow, error: scenarioError },
        { data: deliverableRows, error: deliverablesError },
      ] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, title, type, duration_estimate_minutes, is_urgent")
          .eq("id", ticketId)
          .single(),
        supabase
          .from("ticket_scenarios")
          .select("scenario_text")
          .eq("ticket_id", ticketId)
          .maybeSingle(),
        supabase
          .from("ticket_deliverables")
          .select("description, order_index")
          .eq("ticket_id", ticketId)
          .order("order_index", { ascending: true }),
      ]);

      if (ticketError || !ticket) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load ticket", ticketError);
        return null;
      }
      if (scenarioError) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load scenario", scenarioError);
      }
      if (deliverablesError) {
        // eslint-disable-next-line no-console
        console.error("[useInstructorTicketDetail] Failed to load deliverables", deliverablesError);
      }

      const scenario =
        scenarioRow?.scenario_text ?? null;
      const deliverables = (deliverableRows ?? []).map(
        (r: { description: string }) => r.description
      );

      const mins = ticket.duration_estimate_minutes ?? 0;
      const durationEstimate =
        mins >= 60
          ? `${Math.floor(mins / 60)} h ${mins % 60} min`
          : `${mins} mins`;

      return {
        title: ticket.title,
        type: ticket.type ?? null,
        durationEstimate,
        isUrgent: !!ticket.is_urgent,
        scenario,
        deliverables,
      };
    },
  });
}

export function useCourse(id: string) {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ['courses', id, authUser?.id ?? 'anonymous'],
    enabled: !!id,
    queryFn: async (): Promise<Course> => {
      if (!supabase || !id) throw new Error("Course not found");

      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          category,
          difficulty,
          fee_amount,
          total_sprints,
          total_tickets,
          company_partner,
          profiles!instructor_id(full_name)
        `)
        .eq('id', id)
        .single();

      if (courseError || !courseRow) {
        throw new Error("Course not found");
      }

      type CourseRow = {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        fee_amount: number;
        total_sprints: number;
        total_tickets: number;
        company_partner: string | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      };
      const c = courseRow as CourseRow;
      const instructorName = c.company_partner ?? (Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name) ?? 'Instructor';

      const { data: sprintsRows, error: sprintsError } = await supabase
        .from('sprints')
        .select('id, title, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (sprintsError) throw new Error("Failed to load course content");

      const sprintsList = sprintsRows ?? [];

      const { data: ticketsRows, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, sprint_id, title, type, duration_estimate_minutes, order_index')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (ticketsError) throw new Error("Failed to load course content");

      const ticketsList = ticketsRows ?? [];

      let enrollment: { progress_percent: number; current_sprint_id: string | null } | null = null;
      const attemptedTicketIds = new Set<string>();
      if (authUser?.id) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('id, progress_percent, current_sprint_id')
          .eq('course_id', id)
          .eq('student_id', authUser.id)
          .in('status', ['active', 'completed'])
          .maybeSingle();
        if (enrollData) {
          enrollment = { progress_percent: Number(enrollData.progress_percent ?? 0), current_sprint_id: enrollData.current_sprint_id };
          const { data: anyAttempts } = await supabase
            .from('ticket_attempts')
            .select('ticket_id')
            .eq('enrollment_id', enrollData.id);
          if (anyAttempts) anyAttempts.forEach(a => attemptedTicketIds.add(a.ticket_id));
        }
      }

      const currentSprintId = enrollment?.current_sprint_id ?? sprintsList[0]?.id ?? null;
      const sprintOrder = new Map(sprintsList.map((s, i) => [s.id, i]));
      type TicketStatus = Ticket['status'];
      const getTicketStatus = (ticketId: string, sprintId: string): TicketStatus => {
        if (attemptedTicketIds.has(ticketId)) return 'Completed';
        const sprintIdx = sprintOrder.get(sprintId) ?? 0;
        const currentIdx = currentSprintId != null ? (sprintOrder.get(currentSprintId) ?? 0) : 0;
        if (sprintIdx < currentIdx) return 'Active';
        if (sprintIdx > currentIdx) return 'Locked';
        return 'Active';
      };

      const ticketsBySprint = new Map<string, typeof ticketsList>();
      for (const t of ticketsList) {
        const list = ticketsBySprint.get(t.sprint_id) ?? [];
        list.push(t);
        ticketsBySprint.set(t.sprint_id, list);
      }

      const sprints: Sprint[] = sprintsList.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order_index ?? 0,
        tickets: (ticketsBySprint.get(s.id) ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          type: (t.type ?? 'Build') as Ticket['type'],
          durationEstimate: t.duration_estimate_minutes != null ? `${t.duration_estimate_minutes} mins` : '30 mins',
          status: getTicketStatus(t.id, s.id),
          hasAttemptedBefore: attemptedTicketIds.has(t.id),
        } as Ticket)),
      }));

      return {
        id: c.id,
        title: c.title,
        instructor: instructorName,
        category: c.category as Course['category'],
        difficulty: c.difficulty as Course['difficulty'],
        totalSprints: c.total_sprints ?? 0,
        totalTickets: c.total_tickets ?? 0,
        fee: Number(c.fee_amount ?? 0),
        progressPercent: enrollment ? Number(enrollment.progress_percent) : 0,
        currentSprint: currentSprintId ? (sprintOrder.get(currentSprintId) ?? 0) + 1 : 1,
        sprints,
        isEnrolled: !!enrollment,
      };
    },
  });
}

export function useTicket(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['courses', courseId, 'tickets', ticketId],
    enabled: (options?.enabled !== false && !!ticketId && !!courseId),
    queryFn: async (): Promise<Ticket> => {
      if (!supabase || !ticketId || !courseId) throw new Error("Ticket not found");

      const { data: ticketRow, error: ticketError } = await supabase
        .from('tickets')
        .select('id, title, type, duration_estimate_minutes, is_urgent')
        .eq('id', ticketId)
        .eq('course_id', courseId)
        .single();

      if (ticketError || !ticketRow) {
        throw new Error("Ticket not found");
      }

      const [scenarioRes, deliverablesRes] = await Promise.all([
        supabase
          .from('ticket_scenarios')
          .select('scenario_text')
          .eq('ticket_id', ticketId)
          .maybeSingle(),
        supabase
          .from('ticket_deliverables')
          .select('description')
          .eq('ticket_id', ticketId)
          .order('order_index', { ascending: true }),
      ]);

      const scenario = scenarioRes.data && !scenarioRes.error
        ? (scenarioRes.data as { scenario_text: string }).scenario_text
        : undefined;
      const deliverables = deliverablesRes.data && !deliverablesRes.error
        ? (deliverablesRes.data as { description: string }[]).map(d => d.description)
        : undefined;

      const t = ticketRow as {
        id: string;
        title: string;
        type: string;
        duration_estimate_minutes: number | null;
        is_urgent: boolean;
      };

      return {
        id: t.id,
        title: t.title,
        type: (t.type ?? 'Build') as Ticket['type'],
        durationEstimate: t.duration_estimate_minutes != null ? `${t.duration_estimate_minutes} mins` : '30 mins',
        status: 'Active',
        isUrgent: !!t.is_urgent,
        scenario: scenario ?? undefined,
        deliverables: deliverables ?? undefined,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Ticket attempt: get-or-create in_progress attempt + deliverable submissions
// ---------------------------------------------------------------------------
export type AttemptStatus = "in_progress" | "submitted" | "passed" | "failed";

export interface TicketAttemptRow {
  id: string;
  student_id: string;
  ticket_id: string;
  enrollment_id: string;
  status: AttemptStatus;
  submission_text: string | null;
  submission_code: string | null;
  submission_files: unknown;
  ai_score: number | null;
  ai_review_text: string | null;
  time_spent_minutes: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliverableSubmissionRow {
  id: string;
  attempt_id: string;
  deliverable_id: string;
  content: string;
  ai_score: number | null;
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketAttemptData {
  attempt: TicketAttemptRow | null;
  deliverableSubmissions: DeliverableSubmissionRow[];
  noEnrollment: boolean;
  /** True when current attempt is in_progress and user has at least one completed attempt (submitted/passed/failed) for this ticket */
  hasAttemptedBefore: boolean;
}

export function useTicketAttempt(
  courseId: string,
  ticketId: string,
  options?: { enabled?: boolean }
) {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ["ticket-attempt", courseId, ticketId, authUser?.id ?? "anonymous"],
    enabled:
      options?.enabled !== false && !!ticketId && !!courseId && !!authUser?.id && !!supabase,
    queryFn: async (): Promise<TicketAttemptData> => {
      if (!supabase || !authUser?.id || !ticketId || !courseId) {
        return { attempt: null, deliverableSubmissions: [], noEnrollment: true, hasAttemptedBefore: false };
      }

      // 1. Get enrollment for this student + course
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (enrollError || !enrollment) {
        return { attempt: null, deliverableSubmissions: [], noEnrollment: true, hasAttemptedBefore: false };
      }

      const enrollmentId = enrollment.id;

      // 2. Look for existing in_progress attempt
      const { data: existingAttempt, error: attemptFindError } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("ticket_id", ticketId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptFindError) {
        console.error("[useTicketAttempt] Failed to find attempt", attemptFindError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      if (existingAttempt) {
        const { data: subs } = await supabase
          .from("deliverable_submissions")
          .select("*")
          .eq("attempt_id", existingAttempt.id)
          .order("created_at", { ascending: true });
        const { count: completedCount } = await supabase
          .from("ticket_attempts")
          .select("*", { count: "exact", head: true })
          .eq("enrollment_id", enrollmentId)
          .eq("ticket_id", ticketId)
          .in("status", ["submitted", "passed", "failed"]);
        return {
          attempt: existingAttempt as TicketAttemptRow,
          deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
          noEnrollment: false,
          hasAttemptedBefore: (completedCount ?? 0) >= 1,
        };
      }

      // 3. Load any existing attempt (e.g. submitted/passed/failed) for this enrollment+ticket to return for display
      const { data: anyAttempt } = await supabase
        .from("ticket_attempts")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("ticket_id", ticketId)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (anyAttempt) {
        const { data: subs } = await supabase
          .from("deliverable_submissions")
          .select("*")
          .eq("attempt_id", anyAttempt.id)
          .order("created_at", { ascending: true });
        return {
          attempt: anyAttempt as TicketAttemptRow,
          deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
          noEnrollment: false,
          hasAttemptedBefore: false,
        };
      }

      // 4. Create new attempt: get ticket_deliverables for this ticket
      const { data: deliverables, error: delivError } = await supabase
        .from("ticket_deliverables")
        .select("id")
        .eq("ticket_id", ticketId)
        .order("order_index", { ascending: true });

      if (delivError || !deliverables?.length) {
        console.error("[useTicketAttempt] No deliverables for ticket", delivError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      const { data: newAttempt, error: insertAttemptError } = await supabase
        .from("ticket_attempts")
        .insert({
          student_id: authUser.id,
          ticket_id: ticketId,
          enrollment_id: enrollmentId,
          status: "in_progress",
        })
        .select("*")
        .single();

      if (insertAttemptError || !newAttempt) {
        console.error("[useTicketAttempt] Failed to create attempt", insertAttemptError);
        return { attempt: null, deliverableSubmissions: [], noEnrollment: false, hasAttemptedBefore: false };
      }

      const attemptId = (newAttempt as { id: string }).id;
      const subsPayload = deliverables.map((d: { id: string }) => ({
        attempt_id: attemptId,
        deliverable_id: d.id,
        content: "",
      }));

      const { error: insertSubsError } = await supabase
        .from("deliverable_submissions")
        .insert(subsPayload);

      if (insertSubsError) {
        console.error("[useTicketAttempt] Failed to create deliverable submissions", insertSubsError);
        return {
          attempt: newAttempt as TicketAttemptRow,
          deliverableSubmissions: [],
          noEnrollment: false,
          hasAttemptedBefore: false,
        };
      }

      const { data: subs } = await supabase
        .from("deliverable_submissions")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      return {
        attempt: newAttempt as TicketAttemptRow,
        deliverableSubmissions: (subs ?? []) as DeliverableSubmissionRow[],
        noEnrollment: false,
        hasAttemptedBefore: false,
      };
    },
  });
}

/** Start a new attempt for a ticket (e.g. after previous attempt was graded). Invalidates ticket-attempt query. */
export function useStartNewTicketAttempt() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (params: { courseId: string; ticketId: string }) => {
      if (!supabase || !authUser?.id) throw new Error("Not authenticated");
      const { courseId, ticketId } = params;

      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      if (enrollError || !enrollment) throw new Error("Enrollment not found");

      const { data: deliverables, error: delivError } = await supabase
        .from("ticket_deliverables")
        .select("id")
        .eq("ticket_id", ticketId)
        .order("order_index", { ascending: true });

      if (delivError || !deliverables?.length) throw new Error("No deliverables for this ticket");

      const { data: newAttempt, error: insertAttemptError } = await supabase
        .from("ticket_attempts")
        .insert({
          student_id: authUser.id,
          ticket_id: ticketId,
          enrollment_id: enrollment.id,
          status: "in_progress",
        })
        .select("*")
        .single();

      if (insertAttemptError || !newAttempt) throw new Error("Failed to start new attempt");

      const attemptId = (newAttempt as { id: string }).id;
      const subsPayload = deliverables.map((d: { id: string }) => ({
        attempt_id: attemptId,
        deliverable_id: d.id,
        content: "",
      }));

      const { error: insertSubsError } = await supabase
        .from("deliverable_submissions")
        .insert(subsPayload);

      if (insertSubsError) throw new Error("Failed to create deliverable submissions");

      return { attemptId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-attempt", variables.courseId, variables.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useSubmitTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      ticketId: string;
      attemptId: string;
      content: string;
      timeSpentMinutes?: number;
    }) => {
      if (!supabase) throw new Error("Not connected");
      const { attemptId, content, timeSpentMinutes } = params;

      const now = new Date().toISOString();

      // Get deliverable_submissions for this attempt (ordered) to update first one
      const { data: submissions, error: fetchSubsError } = await supabase
        .from("deliverable_submissions")
        .select("id, deliverable_id")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true });

      if (fetchSubsError || !submissions?.length) {
        throw new Error("Could not load submissions for this attempt.");
      }

      const firstId = submissions[0].id;
      const { error: updateSubError } = await supabase
        .from("deliverable_submissions")
        .update({ content: content || "" })
        .eq("id", firstId);

      if (updateSubError) throw new Error("Failed to save your work.");

      const updatePayload: {
        status: "submitted";
        submitted_at: string;
        submission_text?: string;
        time_spent_minutes?: number;
      } = {
        status: "submitted",
        submitted_at: now,
        submission_text: content,
      };
      if (timeSpentMinutes != null) updatePayload.time_spent_minutes = timeSpentMinutes;

      const { error: updateAttemptError } = await supabase
        .from("ticket_attempts")
        .update(updatePayload)
        .eq("id", attemptId);

      if (updateAttemptError) throw new Error("Failed to submit attempt.");

      return { success: true, attemptId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-attempt", variables.courseId, variables.ticketId],
      });
    },
  });
}
