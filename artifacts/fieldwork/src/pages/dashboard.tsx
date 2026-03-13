import { Link } from "wouter";
import { motion } from "framer-motion";
import { Flame, BookOpen, CheckCircle2, Wallet, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useUser, useEnrolledCourses } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: courses, isLoading: coursesLoading } = useEnrolledCourses();

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (userLoading || coursesLoading) {
    return (
      <MainLayout>
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const activeTicketCourse = courses?.[0];
  const activeTicket = activeTicketCourse?.sprints[1]?.tickets.find(t => t.status === "Active");

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500 mt-1">Ready to tackle some real-world problems today?</p>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm inline-flex items-center">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-0 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Current Streak</p>
                  <h3 className="text-2xl font-bold text-slate-900">{user?.currentStreak} Days</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-0 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Courses</p>
                  <h3 className="text-2xl font-bold text-slate-900">{courses?.length}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-0 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-medium text-slate-500">Fee Refunded</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    KES {user?.feeRefunded.toLocaleString()} <span className="text-slate-400 font-normal">/ {user?.feeTotal.toLocaleString()}</span>
                  </span>
                </div>
                <Progress value={(user!.feeRefunded / user!.feeTotal) * 100} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-0 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Tickets Completed</p>
                  <h3 className="text-2xl font-bold text-slate-900">{user?.ticketsCompleted}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Ticket - Priority */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-xl font-display font-bold text-slate-900">Up Next</h2>
            
            {activeTicket && activeTicketCourse && (
              <Card className="border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-2 bg-gradient-to-r from-primary to-blue-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 font-medium">
                      <AlertCircle className="w-3 h-3 mr-1" /> Urgent Priority
                    </Badge>
                    <div className="flex items-center text-sm text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                      <Clock className="w-4 h-4 mr-1.5" />
                      Est. {activeTicket.durationEstimate}
                    </div>
                  </div>
                  <CardTitle className="text-2xl leading-tight">{activeTicket.title}</CardTitle>
                  <p className="text-slate-500 text-sm">{activeTicketCourse.title} • Sprint 2</p>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                    <p className="text-slate-700 leading-relaxed">
                      {activeTicket.scenario}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild size="lg" className="w-full sm:w-auto shadow-md shadow-primary/20">
                      <Link href={`/courses/${activeTicketCourse.id}/ticket/${activeTicket.id}`}>
                        Start Ticket <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Enrolled Courses */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-display font-bold text-slate-900">Active Courses</h2>
              <Link href="/courses" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              {courses?.map((course) => (
                <Card key={course.id} className="border-0 shadow-sm hover-elevate transition-all">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600">
                        {course.category}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        Sprint {course.currentSprint}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-4">{course.title}</h3>
                    
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-primary">{course.progressPercent}%</span>
                      </div>
                      <Progress value={course.progressPercent} className="h-1.5" />
                    </div>
                    
                    <Button variant="outline" className="w-full text-sm font-medium h-9" asChild>
                      <Link href={`/courses/${course.id}`}>Continue</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
