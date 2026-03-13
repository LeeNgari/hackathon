import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { UserRole } from "@/types/database.types";

export function ProtectedRoute({
  component: Component,
  allowedRoles,
  ...rest
}: {
  component: React.ComponentType<any>,
  allowedRoles?: UserRole[],
  [key: string]: any
}) {
  const { user, role, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard if role is not allowed
        if (role === 'admin') setLocation('/admin/dashboard');
        else if (role === 'instructor') setLocation('/instructor/dashboard');
        else setLocation('/dashboard');
      }
    }
  }, [user, role, isLoading, setLocation, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null; // Will redirect in useEffect
  }

  return <Component {...rest} />;
}
