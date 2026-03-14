import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  LogOut,
  Hexagon,
  TicketCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/instructor/dashboard", icon: LayoutDashboard },
  { title: "My Courses", url: "/instructor/courses", icon: BookOpen },
  { title: "Students", url: "/instructor/students", icon: Users },
  { title: "Ticket Analytics", url: "/instructor/tickets", icon: TicketCheck },
  { title: "Earnings", url: "/instructor/earnings", icon: Wallet },
];

export function InstructorSidebar() {
  const [location, setLocation] = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Hexagon className="w-5 h-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-base tracking-tight text-primary leading-none">Fieldwork</span>
          <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">Instructor</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={isActive ? "bg-emerald-50 font-medium text-emerald-700" : "text-slate-600 hover:text-slate-900"}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="px-2 py-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-800">{user?.user_metadata?.full_name || 'Instructor'}</p>
          <p className="text-[11px] text-emerald-500 mt-0.5">Senior Cloud Architect</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-slate-500 hover:text-destructive cursor-pointer">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
