import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Target } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { marketSignals } from "@/lib/admin-data";

const trendConfig = {
  rising: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100", label: "Rising" },
  stable: { icon: Minus, color: "text-blue-600", bg: "bg-blue-100", label: "Stable" },
  falling: { icon: TrendingDown, color: "text-slate-400", bg: "bg-slate-100", label: "Falling" },
};

const priorityConfig = {
  High: "bg-red-100 text-red-700 border-red-100",
  Medium: "bg-amber-100 text-amber-700 border-amber-100",
  Low: "bg-slate-100 text-slate-500 border-slate-100",
};

export default function AdminMarket() {
  const highPriority = marketSignals.filter(s => s.priority === "High");

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Market Signals</h1>
          <p className="text-slate-500 mt-1">Track where the job market is shifting to inform which courses to prioritize next.</p>
        </motion.div>

        {/* High priority alert */}
        {highPriority.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-sm bg-amber-50 border-amber-100">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">Recommended: Commission New Courses</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    High-demand gaps detected in <strong>{highPriority.map(s => s.category).join(", ")}</strong>.
                    Consider reaching out to partners to fill these gaps before competitors do.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Signal cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {marketSignals.map((signal) => {
            const trend = trendConfig[signal.trend];
            const TrendIcon = trend.icon;
            return (
              <Card key={signal.category} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${trend.bg}`}>
                        <TrendIcon className={`w-5 h-5 ${trend.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{signal.category}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Top skill: {signal.topSkill}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-xs ${priorityConfig[signal.priority]}`}>
                        {signal.priority} Priority
                      </Badge>
                      <span className={`text-xs font-semibold ${trend.color}`}>{trend.label}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-500">Demand Score</span>
                      <span className="text-slate-900 font-bold">{signal.demandScore}/100</span>
                    </div>
                    <Progress
                      value={signal.demandScore}
                      className={`h-2 [&>div]:${signal.trend === "rising" ? "bg-emerald-500" : signal.trend === "stable" ? "bg-blue-500" : "bg-slate-300"}`}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">{signal.openRoles} open roles currently hiring</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
