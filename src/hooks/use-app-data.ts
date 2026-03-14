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

export function useTicket(courseId: string, ticketId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'tickets', ticketId],
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
