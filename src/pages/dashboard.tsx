import { Link } from "wouter";
import { motion } from "framer-motion";
import { Flame, BookOpen, CheckCircle2, Wallet, AlertCircle, Clock, ArrowRight, Play } from "lucide-react";
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
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 bg-secondary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-sm bg-secondary" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const activeTicketCourse = courses?.[0];
  const activeTicket = activeTicketCourse?.sprints[1]?.tickets.find(t => t.status === "Active") || activeTicketCourse?.sprints[0]?.tickets[0];

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-border pb-6"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Hello, {user?.name.split(' ')[0]}.
            </h1>
          </div>
          <div className="text-sm font-bold text-foreground bg-secondary px-4 py-2 rounded-sm border-2 border-border inline-flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden rounded-sm bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary text-primary rounded-sm border-2 border-border">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Streak</p>
                  <h3 className="text-2xl font-bold text-foreground">{user?.currentStreak} Days</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] rounded-sm bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary text-blue-400 rounded-sm border-2 border-border">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Courses</p>
                  <h3 className="text-2xl font-bold text-foreground">{courses?.length} Active</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden rounded-sm bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary text-success rounded-sm border-2 border-border">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Refunded</p>
                  <h3 className="text-2xl font-bold text-foreground">
                    KES {user?.feeRefunded.toLocaleString()}
                  </h3>
                  <Progress value={(user!.feeRefunded / user!.feeTotal) * 100} className="h-2 mt-2 bg-secondary border-2 border-border [&>div]:bg-success rounded-none" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover-elevate border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] rounded-sm bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-secondary text-purple-400 rounded-sm border-2 border-border">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                  <h3 className="text-2xl font-bold text-foreground">{user?.ticketsCompleted} Tickets</h3>
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
            <h2 className="text-2xl font-display font-bold text-foreground border-b-2 border-border pb-2 inline-block">Up Next</h2>
            
            {activeTicket && activeTicketCourse && (
              <Card className="border-2 border-border shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all rounded-sm bg-background">
                <CardHeader className="pb-3 bg-secondary border-b-2 border-border">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-destructive text-destructive-foreground border-2 border-border font-bold rounded-sm py-1 px-3">
                      <AlertCircle className="w-4 h-4 mr-2" /> Urgent
                    </Badge>
                    <div className="flex items-center text-sm text-foreground font-bold bg-background border-2 border-border px-3 py-1 rounded-sm">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {activeTicket.durationEstimate}
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-display font-bold mt-2">{activeTicket.title}</CardTitle>
                  <p className="text-primary font-bold">{activeTicketCourse.title} • Sprint 2</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-secondary p-5 rounded-sm border-2 border-border mb-6">
                    <p className="text-foreground leading-relaxed text-lg font-medium">
                      {activeTicket.scenario}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild size="lg" className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90 border-b-4 border-primary/50 translate-y-[-2px] hover:translate-y-[0px] hover:border-b-0 transition-all rounded-sm px-8 text-lg h-14">
                      <Link href={`/courses/${activeTicketCourse.id}/ticket/${activeTicket.id}`}>
                        <Play className="mr-2 w-5 h-5 fill-current" /> Start Course
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
            <div className="flex justify-between items-end border-b-2 border-border pb-2">
              <h2 className="text-2xl font-display font-bold text-foreground">My Courses</h2>
              <Link href="/courses" className="text-sm font-bold text-primary hover:underline uppercase tracking-wider">View All</Link>
            </div>
            
            <div className="space-y-4">
              {courses?.map((course) => (
                <Card key={course.id} className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] transition-all rounded-sm bg-background">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-secondary text-foreground font-bold border-2 border-border rounded-sm">
                        {course.category}
                      </Badge>
                      <span className="text-xs font-bold text-foreground bg-primary/20 border-2 border-primary/50 px-2 py-1 rounded-sm">
                        Sprint {course.currentSprint}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl text-foreground leading-tight mb-4">{course.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{course.progressPercent}%</span>
                      </div>
                      <Progress value={course.progressPercent} className="h-2 bg-secondary border-2 border-border [&>div]:bg-primary rounded-none" />
                    </div>
                    
                    <Button variant="outline" className="w-full text-sm font-bold h-10 border-2 border-border bg-secondary hover:bg-background rounded-sm" asChild>
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
