import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, TicketCheck, CheckCircle2, AlertCircle, Clock, Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { partnerCourses } from "@/lib/admin-data";

const statusConfig = {
  Live: { color: "bg-emerald-100 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
  "Under Review": { color: "bg-amber-100 text-amber-700 border-amber-100", icon: AlertCircle },
  Draft: { color: "bg-slate-100 text-slate-600 border-slate-100", icon: Clock },
};

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = partnerCourses.filter(c => {
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const liveCourses = partnerCourses.filter(c => c.status === "Live").length;
  const underReview = partnerCourses.filter(c => c.status === "Under Review").length;
  const drafts = partnerCourses.filter(c => c.status === "Draft").length;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Course Management</h1>
          <p className="text-slate-500 mt-1">Review, approve, and monitor all courses on the platform.</p>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
          {[
            { label: "Live", count: liveCourses, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { label: "Under Review", count: underReview, color: "text-amber-700 bg-amber-50 border-amber-100" },
            { label: "Draft", count: drafts, color: "text-slate-600 bg-slate-50 border-slate-100" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`text-3xl font-bold ${s.color.split(" ")[0]}`}>{s.count}</div>
                <span className="text-sm font-medium text-slate-500">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Live">Live</TabsTrigger>
              <TabsTrigger value="Under Review">Under Review</TabsTrigger>
              <TabsTrigger value="Draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search courses..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Course</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Instructor</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Students</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(course => {
                    const cfg = statusConfig[course.status];
                    const Icon = cfg.icon;
                    return (
                      <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{course.title}</div>
                          {course.company && <div className="text-xs text-slate-400 mt-0.5">Partner: {course.company}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{course.instructor}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">{course.category}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`text-xs ${cfg.color} inline-flex items-center gap-1`}>
                            <Icon className="w-3 h-3" /> {course.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-slate-900">{course.students.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-slate-600">{course.tickets}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
