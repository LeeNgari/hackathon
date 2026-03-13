import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Landing
import Landing from "@/pages/landing";

// Student pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import TicketView from "@/pages/ticket-view";
import Profile from "@/pages/profile";
import Streaks from "@/pages/streaks";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses";
import AdminPartners from "@/pages/admin/partners";
import AdminFinance from "@/pages/admin/finance";
import AdminMarket from "@/pages/admin/market";

// Instructor pages
import InstructorDashboard from "@/pages/instructor/dashboard";
import InstructorCourses from "@/pages/instructor/courses";
import InstructorStudents from "@/pages/instructor/students";
import InstructorTickets from "@/pages/instructor/tickets";
import InstructorEarnings from "@/pages/instructor/earnings";
import IDE from "./pages/editor";
import Signup from "@/pages/signup";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Landing & Auth */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Student */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} allowedRoles={['student']} />
      </Route>
      <Route path="/courses">
        <ProtectedRoute component={Courses} allowedRoles={['student']} />
      </Route>
      <Route path="/courses/:id">
        {(params) => <ProtectedRoute component={CourseDetail} allowedRoles={['student']} params={params} />}
      </Route>
      <Route path="/courses/:courseId/ticket/:ticketId">
        {(params) => <ProtectedRoute component={TicketView} allowedRoles={['student']} params={params} />}
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} allowedRoles={['student']} />
      </Route>
      <Route path="/streaks">
        <ProtectedRoute component={Streaks} allowedRoles={['student']} />
      </Route>
      <Route path="/editor">
        <ProtectedRoute component={IDE} allowedRoles={['student']} />
      </Route>

      {/* Admin */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute component={AdminCourses} allowedRoles={['admin']} />
      </Route>
      <Route path="/admin/partners">
        <ProtectedRoute component={AdminPartners} allowedRoles={['admin']} />
      </Route>
      <Route path="/admin/finance">
        <ProtectedRoute component={AdminFinance} allowedRoles={['admin']} />
      </Route>
      <Route path="/admin/market">
        <ProtectedRoute component={AdminMarket} allowedRoles={['admin']} />
      </Route>

      {/* Instructor */}
      <Route path="/instructor/dashboard">
        <ProtectedRoute component={InstructorDashboard} allowedRoles={['instructor']} />
      </Route>
      <Route path="/instructor/courses">
        <ProtectedRoute component={InstructorCourses} allowedRoles={['instructor']} />
      </Route>
      <Route path="/instructor/students">
        <ProtectedRoute component={InstructorStudents} allowedRoles={['instructor']} />
      </Route>
      <Route path="/instructor/tickets">
        <ProtectedRoute component={InstructorTickets} allowedRoles={['instructor']} />
      </Route>
      <Route path="/instructor/earnings">
        <ProtectedRoute component={InstructorEarnings} allowedRoles={['instructor']} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
