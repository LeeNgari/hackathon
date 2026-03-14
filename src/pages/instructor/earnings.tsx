import { motion } from "framer-motion";
import { Wallet, ArrowDownLeft, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorProfile, useInstructorPayoutRecords } from "@/hooks/use-app-data";

export default function InstructorEarnings() {
  const { data: instructorProfile } = useInstructorProfile();
  const { data: payoutRecords = [] } = useInstructorPayoutRecords();

  const totalEarned = instructorProfile?.totalEarned ?? 0;
  const pendingPayout = instructorProfile?.pendingPayout ?? 0;

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Earnings</h1>
          <p className="text-slate-500 mt-1">Your payout history and upcoming earnings from Fieldwork.</p>
        </motion.div>

        {/* Payout summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Earned</p>
                <h3 className="text-2xl font-bold text-emerald-700">KES {totalEarned.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Payout</p>
                <h3 className="text-2xl font-bold text-amber-700">KES {pendingPayout.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Platform Cut</p>
                <h3 className="text-2xl font-bold text-slate-700">10%</h3>
                <p className="text-xs text-slate-400 mt-0.5">Per student completion</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Earnings model explainer */}
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-5 flex gap-4 items-start">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-sm">How You Get Paid</h3>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                Fieldwork takes a 10% platform fee from each student's course payment. The remaining 90% is held and disbursed to you as students complete sprints. Payouts are processed monthly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payout history */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-display font-bold text-slate-900 mb-4">Payout History</h2>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Period</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Course</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Students</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Gross Revenue</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Platform Fee</th>
                    <th className="text-right px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Net Payout</th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutRecords.map((record, i) => (
                    <tr key={`${record.period}-${record.courseName}-${i}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{record.period}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">{record.courseName}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{record.studentsCompleted}</td>
                      <td className="px-6 py-4 text-right text-slate-700">KES {record.grossRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-red-500">-KES {record.platformFee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">KES {record.netPayout.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          record.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-xs inline-flex items-center gap-1"
                            : "bg-amber-50 text-amber-700 border-amber-100 text-xs inline-flex items-center gap-1"
                        }>
                          {record.status === "Paid"
                            ? <><CheckCircle2 className="w-3 h-3" /> Paid</>
                            : <><Clock className="w-3 h-3" /> Pending</>
                          }
                        </Badge>
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
