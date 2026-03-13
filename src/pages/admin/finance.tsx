import { motion } from "framer-motion";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { financialEntries, platformStats } from "@/lib/admin-data";

export default function AdminFinance() {
  const totalFeesPaid = financialEntries.reduce((s, e) => s + e.feePaid, 0);
  const totalRefunded = financialEntries.reduce((s, e) => s + e.refunded, 0);
  const platformRetained = totalFeesPaid - totalRefunded;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Financial Oversight</h1>
          <p className="text-slate-500 mt-1">Track fee collection, student refund progress, and instructor payouts.</p>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Collected</p>
                <h3 className="text-2xl font-bold text-slate-900">KES {platformStats.platformFeesCollected.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Platform 10% fee</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Refunded to Students</p>
                <h3 className="text-2xl font-bold text-emerald-700">KES {platformStats.feesRefunded.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Based on progress milestones</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Platform Retained</p>
                <h3 className="text-2xl font-bold text-purple-700">KES {(platformStats.platformFeesCollected - platformStats.feesRefunded).toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Net platform revenue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund mechanic explainer */}
        <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">How the Refund Model Works</h3>
              <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                Students pay a 10% platform fee upfront on each course. As they complete work tickets and sprint milestones, the fee is gradually refunded. A student who completes 100% of a course gets their full 10% back — creating a financial incentive to finish.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Student breakdown table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-display font-bold text-slate-900 mb-4">Student Fee Tracker</h2>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Course</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Fee Paid</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Refunded</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide w-40">Progress</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialEntries.map((entry, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{entry.studentName}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{entry.course}</td>
                      <td className="px-6 py-4 text-right text-slate-900 font-medium">KES {entry.feePaid.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={entry.refunded === entry.feePaid ? "text-emerald-700 font-bold" : "text-emerald-600 font-semibold"}>
                          KES {entry.refunded.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={entry.progress} className="h-1.5 flex-1 [&>div]:bg-primary" />
                          <span className="text-xs font-bold text-slate-700 w-8 shrink-0">{entry.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{entry.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
