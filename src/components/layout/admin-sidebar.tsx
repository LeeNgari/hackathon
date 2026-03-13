import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Wallet,
  LogOut,
  Hexagon,
  TrendingUp,
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
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Overview", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Partners", url: "/admin/partners", icon: Users },
  { title: "Finance", url: "/admin/finance", icon: Wallet },
  { title: "Market Signals", url: "/admin/market", icon: TrendingUp },
];

export function AdminSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Hexagon className="w-5 h-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-base tracking-tight text-primary leading-none">Fieldwork</span>
          <span className="text-[10px] font-semibold text-purple-600 tracking-wide uppercase">Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Management
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
                      className={isActive ? "bg-purple-50 font-medium text-purple-700" : "text-slate-600 hover:text-slate-900"}
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
        <div className="px-2 py-3 rounded-lg bg-purple-50 border border-purple-100">
          <p className="text-xs font-semibold text-purple-800">Dorcas Kimani</p>
          <p className="text-[11px] text-purple-500 mt-0.5">Platform Administrator</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-slate-500 hover:text-destructive">
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
