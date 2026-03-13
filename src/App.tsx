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

      {/* Student */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/courses/:courseId/ticket/:ticketId" component={TicketView} />
      <Route path="/profile" component={Profile} />
      <Route path="/streaks" component={Streaks} />
      <Route path="/editor" component={IDE}/>

      {/* Admin */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/finance" component={AdminFinance} />
      <Route path="/admin/market" component={AdminMarket} />

      {/* Instructor */}
      <Route path="/instructor/dashboard" component={InstructorDashboard} />
      <Route path="/instructor/courses" component={InstructorCourses} />
      <Route path="/instructor/students" component={InstructorStudents} />
      <Route path="/instructor/tickets" component={InstructorTickets} />
      <Route path="/instructor/earnings" component={InstructorEarnings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
