import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useUser } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Streaks() {
  const { data: user, isLoading } = useUser();

  // Generate mock heatmap data (90 days)
  const generateHeatmap = () => {
    const data = [];
    const today = new Date();
    // Simulate streak logic (last 12 days active, random before that)
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      let intensity = 0; // 0 = none, 1 = low, 2 = high
      if (i < 12) {
        intensity = Math.random() > 0.3 ? 2 : 1; // Current streak is 12 days
      } else {
        intensity = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : 1) : 0;
      }
      
      data.push({
        date,
        intensity
      });
    }
    return data;
  };

  const heatmapData = generateHeatmap();

  if (isLoading || !user) {
    return (
      <MainLayout>
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-lg shadow-amber-500/20"
        >
          {/* Decorative background flames */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 right-[10%] w-32 h-32 bg-amber-300/30 rounded-full blur-2xl translate-y-1/4" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shrink-0">
              <Flame className="w-16 h-16 text-white drop-shadow-md" />
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-3">
                <TrendingUp className="w-4 h-4" /> Active Streak
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold mb-2">
                {user.currentStreak} Days
              </h1>
              <p className="text-amber-100 text-lg md:text-xl font-medium max-w-lg">
                Consistency builds competence. You're doing the actual work every single day.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shrink-0 w-full md:w-auto">
              <p className="text-amber-100 font-medium mb-1">Personal Best</p>
              <p className="text-3xl font-bold">{user.bestStreak} Days</p>
            </div>
          </div>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" /> Activity History
              </CardTitle>
              <div className="text-sm font-medium text-slate-500">Last 90 Days</div>
            </CardHeader>
            <CardContent className="p-6 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[repeat(13,1fr)] gap-2">
                  {/* We render cols of 7 days to simulate a standard github-style graph roughly */}
                  {Array.from({ length: 13 }).map((_, colIndex) => (
                    <div key={colIndex} className="grid grid-rows-7 gap-2">
                      {Array.from({ length: 7 }).map((_, rowIndex) => {
                        const dayIndex = colIndex * 7 + rowIndex;
                        if (dayIndex >= 90) return <div key={rowIndex} className="w-4 h-4 bg-transparent" />; // padding
                        
                        const dayData = heatmapData[dayIndex];
                        return (
                          <div 
                            key={rowIndex} 
                            className={`w-full aspect-square rounded-sm transition-colors duration-300 ${
                              dayData.intensity === 2 ? 'bg-amber-500' : 
                              dayData.intensity === 1 ? 'bg-amber-200' : 
                              'bg-slate-100'
                            }`}
                            title={dayData.date.toDateString()}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end items-center gap-2 mt-6 text-xs font-medium text-slate-500">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-slate-100" />
                  <div className="w-3 h-3 rounded-sm bg-amber-200" />
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Milestones Earned</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <Card className="bg-white border-amber-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-amber-50 opacity-50">
                <Zap className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">7-Day Warrior</h3>
                <p className="text-sm text-slate-500">Completed a full week of continuous tickets.</p>
                <Badge className="mt-4 bg-slate-100 text-slate-600 hover:bg-slate-100 shadow-none border-0">Unlocked</Badge>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-blue-50 opacity-50">
                <Trophy className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">First Sprint</h3>
                <p className="text-sm text-slate-500">Finished all tickets in a single sprint block.</p>
                <Badge className="mt-4 bg-slate-100 text-slate-600 hover:bg-slate-100 shadow-none border-0">Unlocked</Badge>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-slate-200 shadow-sm relative overflow-hidden opacity-70 grayscale">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">30-Day Grind</h3>
                <p className="text-sm text-slate-500">Maintain an active streak for an entire month.</p>
                <Badge variant="outline" className="mt-4">18 Days Away</Badge>
              </CardContent>
            </Card>

          </div>
        </motion.div>

      </div>
    </MainLayout>
  );
}
