import { motion } from "framer-motion";
import { TicketCheck, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ticketPerformance } from "@/lib/instructor-data";

const typeColors: Record<string, string> = {
  Build: "bg-blue-100 text-blue-700 border-blue-100",
  Analyze: "bg-purple-100 text-purple-700 border-purple-100",
  Present: "bg-amber-100 text-amber-700 border-amber-100",
  Research: "bg-emerald-100 text-emerald-700 border-emerald-100",
};

export default function InstructorTickets() {
  const avgPassRate = Math.round(ticketPerformance.reduce((s, t) => s + t.passRate, 0) / ticketPerformance.length);
  const totalAttempts = ticketPerformance.reduce((s, t) => s + t.attempts, 0);
  const avgScore = Math.round(ticketPerformance.reduce((s, t) => s + t.avgScore, 0) / ticketPerformance.length);

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Ticket Analytics</h1>
          <p className="text-slate-500 mt-1">See how students are performing on each of your work tickets.</p>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
          {[
            { label: "Avg. Pass Rate", value: `${avgPassRate}%`, icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
            { label: "Total Attempts", value: totalAttempts.toLocaleString(), icon: Users, color: "bg-blue-100 text-blue-600" },
            { label: "Avg. Score", value: `${avgScore}/100`, icon: TicketCheck, color: "bg-purple-100 text-purple-600" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Ticket table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Ticket</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Type</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Attempts</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Avg. Score</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide w-40">Pass Rate</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Avg. Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketPerformance.map(t => (
                    <tr key={t.title} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {t.passRate < 75 && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span className="font-semibold text-slate-900">{t.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`text-xs ${typeColors[t.type] ?? "bg-slate-100 text-slate-600"}`}>{t.type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">{t.attempts.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${t.avgScore >= 80 ? "text-emerald-700" : t.avgScore >= 70 ? "text-amber-600" : "text-red-600"}`}>
                          {t.avgScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={t.passRate}
                            className={`h-1.5 flex-1 [&>div]:${t.passRate >= 85 ? "bg-emerald-500" : t.passRate >= 75 ? "bg-amber-500" : "bg-red-400"}`}
                          />
                          <span className="text-xs font-bold text-slate-700 w-8 shrink-0">{t.passRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">{t.avgTime}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </InstructorLayout>
  );
}
