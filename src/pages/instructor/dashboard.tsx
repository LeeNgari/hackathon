import { motion } from "framer-motion";
import { Users, BookOpen, Wallet, TicketCheck, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } } };

const defaultInstructorName = "Instructor";
const defaultTitle = "Course Lead";
const defaultInstitution = "—";

export default function InstructorDashboard() {
  const { user: authUser } = useAuth();
  const instructorCourses: { id: string; title: string; status: string; studentsEnrolled: number; completionRate: number; earnedToDate: number; companyPartner: string | null }[] = [];
  const studentEnrollments: { name: string; progress: number; lastTicket: string; lastActivity: string; status: string }[] = [];
  const ticketPerformance: { title: string; passRate: number; attempts: number }[] = [];

  const liveCourse = instructorCourses.find((c: { status: string }) => c.status === "Live");
  const atRiskStudents = studentEnrollments.filter(s => s.status === "At Risk");
  const weakestTicket = [...ticketPerformance].sort((a, b) => a.passRate - b.passRate)[0];

  const displayName = authUser?.user_metadata?.full_name?.split(" ")[0] || defaultInstructorName.split(" ")[0];
  const statCards = [
    { label: "Total Students", value: liveCourse?.studentsEnrolled.toLocaleString() ?? "0", icon: Users, color: "bg-blue-100 text-blue-600", accent: "bg-blue-500" },
    { label: "Active Courses", value: instructorCourses.filter((c: { status: string }) => c.status === "Live").length, icon: BookOpen, color: "bg-purple-100 text-purple-600", accent: "bg-purple-500" },
    { label: "Total Earned", value: "KES 0K", icon: Wallet, color: "bg-emerald-100 text-emerald-600", accent: "bg-emerald-500" },
    { label: "Pending Payout", value: "KES 0", icon: TrendingUp, color: "bg-amber-100 text-amber-600", accent: "bg-amber-500" },
  ];

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-slate-500 mt-1">{defaultTitle} · {defaultInstitution}</p>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm inline-flex items-center">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <motion.div key={card.label} variants={itemVariants}>
              <Card className="border-0 shadow-sm hover-elevate overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${card.accent}`} />
                <CardContent className="p-5 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <h3 className="text-xl font-bold text-slate-900">{card.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course overview */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-bold text-slate-900">Your Courses</h2>
            <div className="space-y-4">
              {instructorCourses.map(course => (
                <Card key={course.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{course.title}</h3>
                        {course.companyPartner && (
                          <p className="text-xs text-slate-400 mt-0.5">In partnership with {course.companyPartner}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={
                        course.status === "Live" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        course.status === "Draft" ? "bg-slate-100 text-slate-500" :
                        "bg-amber-50 text-amber-700 border-amber-100"
                      }>
                        {course.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{course.studentsEnrolled}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Students</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{course.completionRate}%</p>
                        <p className="text-xs text-slate-500 mt-0.5">Completion</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-700">KES {(course.earnedToDate / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-slate-500 mt-0.5">Earned</p>
                      </div>
                    </div>

                    {course.status === "Live" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                          <span>Avg. student progress</span>
                          <span className="font-bold text-slate-800">{course.completionRate}%</span>
                        </div>
                        <Progress value={course.completionRate} className="h-2" />
                      </div>
                    )}

                    {course.status === "Draft" && (
                      <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
                        Course in draft — finish setting up sprints and tickets to publish.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            {/* At-risk students */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-slate-900">At Risk</h2>
                {atRiskStudents.length > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-100 text-xs">{atRiskStudents.length} students</Badge>
                )}
              </div>
              <div className="space-y-3">
                {atRiskStudents.map(s => (
                  <Card key={s.name} className="border-0 shadow-sm border-l-2 border-l-red-400">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                        <span className="text-xs text-slate-400">{s.lastActivity}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Last: {s.lastTicket}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={s.progress} className="h-1 flex-1 [&>div]:bg-red-400" />
                        <span className="text-xs text-red-600 font-semibold">{s.progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Weakest ticket */}
            {weakestTicket && (
              <Card className="border-0 shadow-sm bg-amber-50 border-amber-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">Ticket Needs Attention</h3>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{weakestTicket.title}</p>
                  <p className="text-xs text-slate-500 mt-1">Pass rate: <span className="font-bold text-amber-700">{weakestTicket.passRate}%</span> · {weakestTicket.attempts} attempts</p>
                  <p className="text-xs text-slate-400 mt-1">Consider simplifying the scenario or adding more context.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </InstructorLayout>
  );
}
