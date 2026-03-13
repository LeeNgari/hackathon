import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockUser, mockCourses, Ticket } from "@/lib/mock-data";

// Since this is a static prototype without a real backend, we use TanStack Query 
// with static data and artificial delays to simulate a real API experience.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await delay(400);
      return mockUser;
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
      return { success: true, xpEarned: 150 };
    },
    onSuccess: (_, variables) => {
      // In a real app we'd invalidate queries here
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });
}
