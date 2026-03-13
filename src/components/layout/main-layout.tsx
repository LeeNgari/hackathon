import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center h-14 px-4 border-b border-border bg-white shrink-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="mr-4 hover:bg-slate-100" />
            <div className="ml-auto flex items-center gap-4">
              {/* Optional header actions can go here */}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
