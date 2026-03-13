import { motion } from "framer-motion";
import { Users, BookOpen, Wallet, TicketCheck, TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { platformStats, recentActivity, partnerCourses } from "@/lib/admin-data";

const statCards = [
  { label: "Total Students", value: platformStats.totalStudents.toLocaleString(), sub: `${platformStats.activeThisWeek} active this week`, icon: Users, color: "bg-blue-100 text-blue-600", accent: "bg-blue-500" },
  { label: "Live Courses", value: platformStats.liveCourses, sub: `${platformStats.totalCourses} total on platform`, icon: BookOpen, color: "bg-purple-100 text-purple-600", accent: "bg-purple-500" },
  { label: "Fees Collected", value: `KES ${(platformStats.platformFeesCollected / 1000).toFixed(0)}K`, sub: `KES ${(platformStats.feesRefunded / 1000).toFixed(0)}K refunded to students`, icon: Wallet, color: "bg-emerald-100 text-emerald-600", accent: "bg-emerald-500" },
  { label: "Tickets Completed", value: platformStats.ticketsCompleted.toLocaleString(), sub: `Avg. streak ${platformStats.avgStreakDays} days`, icon: TicketCheck, color: "bg-amber-100 text-amber-600", accent: "bg-amber-500" },
];

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: any = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
};

export default function AdminDashboard() {
  const pendingCourses = partnerCourses.filter(c => c.status === "Under Review" || c.status === "Draft");

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Platform Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back, Dorcas. Here's what's happening on Fieldwork.</p>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm inline-flex items-center">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <motion.div key={card.label} variants={itemVariants}>
              <Card className="border-0 shadow-sm hover-elevate overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${card.accent}`} />
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-bold text-slate-900">Recent Activity</h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0 divide-y divide-slate-100">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex gap-4 items-start px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">{item.event}</span>
                        <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Review */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-slate-900">Needs Attention</h2>
              {pendingCourses.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-100">{pendingCourses.length} pending</Badge>
              )}
            </div>
            <div className="space-y-3">
              {pendingCourses.map(course => (
                <Card key={course.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className={course.status === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-100 text-slate-500"}>
                        {course.status === "Under Review" ? <AlertCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {course.status}
                      </Badge>
                      <span className="text-xs text-slate-400">{course.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">by {course.instructor}</p>
                    <p className="text-xs text-slate-400 mt-2">{course.tickets} tickets</p>
                  </CardContent>
                </Card>
              ))}
              {pendingCourses.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">All clear! Nothing pending review.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Fee Refund Summary */}
            <Card className="border-0 shadow-sm mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-800">Fee Refund Pool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Collected</span>
                  <span className="font-bold text-slate-900">KES {platformStats.platformFeesCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Refunded</span>
                  <span className="font-bold text-emerald-700">KES {platformStats.feesRefunded.toLocaleString()}</span>
                </div>
                <Progress value={(platformStats.feesRefunded / platformStats.platformFeesCollected) * 100} className="h-2 [&>div]:bg-emerald-500" />
                <p className="text-xs text-slate-400">{((platformStats.feesRefunded / platformStats.platformFeesCollected) * 100).toFixed(0)}% of collected fees returned to students</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
