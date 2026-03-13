import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  User, 
  Flame,
  LogOut,
  Hexagon
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Streaks", url: "/streaks", icon: Flame },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-2 border-border bg-background">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2 border-b-2 border-border mb-4 pb-6">
        <div className="w-8 h-8 flex items-center justify-center text-primary">
          <Hexagon className="w-6 h-6 fill-current" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">Fieldwork</span>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isActive ? "bg-secondary font-bold text-primary border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] h-10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-bold h-10 border-2 border-transparent hover:border-border transition-all"}
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

      <SidebarFooter className="p-4 border-t-2 border-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold h-10 border-2 border-transparent hover:border-destructive/30 transition-all">
              <Link href="/login">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
