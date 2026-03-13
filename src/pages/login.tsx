import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "student@fieldwork.io", role: "Student Portal" },
  { label: "Admin", email: "admin@fieldwork.io", role: "Admin Portal" },
  { label: "Instructor", email: "instructor@fieldwork.io", role: "Instructor Portal" },
];

function getRedirectPath(email: string): string {
  const lower = email.toLowerCase();
  if (lower.includes("admin")) return "/admin/dashboard";
  if (lower.includes("instructor") || lower.includes("company")) return "/instructor/dashboard";
  return "/dashboard";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("student@fieldwork.io");
  const [showAccounts, setShowAccounts] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setLocation(getRedirectPath(email));
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative Grid Background Elements */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary flex items-center justify-center text-primary-foreground mb-6 border-4 border-foreground transform -rotate-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Hexagon className="w-10 h-10 fill-current" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight underline decoration-primary decoration-4 underline-offset-8">Fieldwork</h1>
        </div>

        <Card className="border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] bg-card rounded-none">
          <CardHeader className="bg-secondary border-b-2 border-border pb-6">
            <CardTitle className="text-2xl font-display font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-base mt-1">Sign in to continue to your portal.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-foreground font-bold text-sm uppercase tracking-wider">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-2 border-border text-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus-visible:ring-0 focus-visible:border-primary transition-colors h-12 text-base font-medium placeholder:text-muted-foreground"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground font-bold text-sm uppercase tracking-wider">Password</Label>
                    <a href="#" className="text-sm text-primary hover:text-primary/80 hover:underline font-bold">Forgot?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    defaultValue="password123"
                    required
                    className="bg-background border-2 border-border text-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus-visible:ring-0 focus-visible:border-primary transition-colors h-12 text-base font-medium"
                  />
                </div>
              </div>

              {/* Demo accounts switcher */}
              <div className="border-2 border-border bg-background transition-all">
                <button
                  type="button"
                  onClick={() => setShowAccounts(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-foreground hover:bg-secondary transition-colors"
                >
                  <span className="text-sm"><span className="font-bold text-primary">Demo Mode</span> <span className="text-muted-foreground">— Any password works. Switch persona:</span></span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showAccounts ? "rotate-180" : ""}`} />
                </button>
                {showAccounts && (
                  <div className="border-t-2 border-border bg-card">
                    {DEMO_ACCOUNTS.map((acc, idx) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => { setEmail(acc.email); setShowAccounts(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary transition-colors ${idx !== DEMO_ACCOUNTS.length - 1 ? 'border-b border-border/50' : ''} ${email === acc.email ? "bg-secondary" : ""}`}
                      >
                        <div>
                          <span className="font-bold text-foreground block md:inline-block">{acc.label}</span>
                          <span className="md:ml-2 text-muted-foreground text-sm">{acc.email}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 border-2 ${
                          acc.label === "Student" ? "bg-blue-900/40 text-blue-400 border-blue-500/50" :
                          acc.label === "Admin" ? "bg-purple-900/40 text-purple-400 border-purple-500/50" :
                          "bg-emerald-900/40 text-emerald-400 border-emerald-500/50"
                        }`}>{acc.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow-[4px_4px_0px_0px_rgba(255,211,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
