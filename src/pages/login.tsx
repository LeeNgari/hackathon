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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Hexagon className="w-7 h-7 fill-current" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Fieldwork</h1>
          <p className="text-slate-500 mt-1">Real work. Real proof.</p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to continue to your portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    defaultValue="password123"
                    required
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Demo accounts switcher */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowAccounts(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span><span className="font-semibold text-slate-700">Demo Mode</span> — Any password works. Switch persona:</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAccounts ? "rotate-180" : ""}`} />
                </button>
                {showAccounts && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => { setEmail(acc.email); setShowAccounts(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white transition-colors ${email === acc.email ? "bg-white" : ""}`}
                      >
                        <div>
                          <span className="font-medium text-slate-800">{acc.label}</span>
                          <span className="ml-2 text-slate-400">{acc.email}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          acc.label === "Student" ? "bg-blue-100 text-blue-700" :
                          acc.label === "Admin" ? "bg-purple-100 text-purple-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{acc.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
