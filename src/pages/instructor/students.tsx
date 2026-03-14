import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Flame } from "lucide-react";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
const statusConfig = {
  "On Track": "bg-emerald-100 text-emerald-700 border-emerald-100",
  "At Risk": "bg-red-100 text-red-700 border-red-100",
  "Completed": "bg-blue-100 text-blue-700 border-blue-100",
};

type Enrollment = { name: string; course: string; progress: number; streak: number; lastTicket: string; lastActivity: string; status: "On Track" | "At Risk" | "Completed" };

export default function InstructorStudents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const studentEnrollments: Enrollment[] = [];

  const filtered = studentEnrollments.filter(s => {
    if (statusFilter !== "All" && s.status !== statusFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const onTrack = studentEnrollments.filter(s => s.status === "On Track").length;
  const atRisk = studentEnrollments.filter(s => s.status === "At Risk").length;
  const completed = studentEnrollments.filter(s => s.status === "Completed").length;

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Track enrollment progress and identify students who need support.</p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "On Track", count: onTrack, color: "text-emerald-700" },
            { label: "At Risk", count: atRisk, color: "text-red-600" },
            { label: "Completed", count: completed, color: "text-blue-700" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <span className={`text-3xl font-bold ${s.color}`}>{s.count}</span>
                <span className="text-sm font-medium text-slate-500">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="On Track">On Track</TabsTrigger>
              <TabsTrigger value="At Risk">At Risk</TabsTrigger>
              <TabsTrigger value="Completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search students..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Student</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide w-44">Progress</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Streak</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Last Ticket</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => (
                  <tr key={`${s.name}-${s.course}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-xs ${statusConfig[s.status]}`}>{s.status}</Badge>
                    </td>
                    <td className="px-6 py-4 w-44">
                      <div className="flex items-center gap-2">
                        <Progress value={s.progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-bold text-slate-700 w-8 shrink-0">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Flame className={`w-3.5 h-3.5 ${s.streak > 0 ? "text-amber-500" : "text-slate-300"}`} />
                        <span className={`text-sm font-bold ${s.streak > 0 ? "text-slate-800" : "text-slate-400"}`}>{s.streak}d</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">{s.lastTicket}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{s.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </InstructorLayout>
  );
}
