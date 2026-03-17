import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, PlayCircle, Clock, Check, FileText, ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useCourse } from "@/hooks/use-app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const { data: course, isLoading } = useCourse(params?.id || "");
  const [openSprints, setOpenSprints] = useState<string[]>([]);
  const hasInitializedOpenSprints = useRef(false);

  useEffect(() => {
    if (!course) return;
    if (hasInitializedOpenSprints.current) return;
    setOpenSprints(course.sprints.map((s) => s.id));
    hasInitializedOpenSprints.current = true;
  }, [course]);

  if (isLoading || !course) {
    return (
      <MainLayout>
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32 mb-8 bg-secondary border-2 border-border rounded-none" />
          <Skeleton className="h-40 w-full rounded-none bg-secondary border-2 border-border" />
          <Skeleton className="h-24 w-full rounded-none bg-secondary border-2 border-border" />
          <div className="space-y-4 pt-8">
            <Skeleton className="h-16 w-full rounded-none bg-secondary border-2 border-border" />
            <Skeleton className="h-16 w-full rounded-none bg-secondary border-2 border-border" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate ticket counts for progress display
  let completedTickets = 0;
  let totalTickets = 0;
  
  course.sprints.forEach(s => {
    s.tickets.forEach(t => {
      totalTickets++;
      if (t.status === "Completed") completedTickets++;
    });
  });

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link href="/courses" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
        </Link>

        {/* Course Banner */}
        <div className="bg-background rounded-none p-8 border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Decorative Grid */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge className="bg-primary text-primary-foreground font-bold rounded-none px-3 py-1 border-2 border-foreground">{course.category}</Badge>
              <Badge variant="outline" className="border-2 border-border text-foreground font-bold rounded-none px-3 py-1 bg-background">{course.difficulty}</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight max-w-2xl underline decoration-primary decoration-4 underline-offset-8">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-6 font-bold uppercase tracking-wider">Instructor: <span className="text-foreground">{course.instructor}</span></p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-6 rounded-none border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Course Progress</span>
              <span className="text-3xl font-display font-bold text-primary">{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-4 bg-secondary border-2 border-border rounded-none" />
            <p className="text-sm text-foreground mt-4 font-bold">
              {completedTickets} of {totalTickets} Tickets Completed
            </p>
          </div>
          
          <div className="bg-background p-6 rounded-none border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fee Refunded</span>
              <span className="text-3xl font-display font-bold text-success">KES {(course.fee * ((course.progressPercent || 0)/100)).toFixed(0)}</span>
            </div>
            <Progress value={course.progressPercent} className="h-4 bg-secondary border-2 border-border rounded-none [&>div]:bg-success" />
            <p className="text-sm text-muted-foreground mt-4 font-bold">
              Total Fee: <span className="text-foreground border-b-2 border-border">KES {course.fee}</span>
            </p>
          </div>
        </div>

        {/* Sprints List */}
        <div className="mt-12">
          <h2 className="text-3xl font-display font-bold text-foreground mb-8">Work Sprints</h2>
          
          <Accordion
            type="multiple"
            className="space-y-6"
            value={openSprints}
            onValueChange={(value) => setOpenSprints(value as string[])}
          >
            {course.sprints.map((sprint) => {
              const sprintCompleted = sprint.tickets.every(t => t.status === "Completed");
              const isLocked = sprint.tickets.every(t => t.status === "Locked");
              
              return (
                <AccordionItem 
                  key={sprint.id} 
                  value={sprint.id} 
                  className={`bg-background border-2 rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-all ${isLocked ? 'opacity-70 border-border/50 shadow-none bg-secondary/30' : 'border-border'}`}
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-secondary rounded-none transition-colors group">
                    <div className="flex items-center text-left gap-5 w-full pr-4">
                      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center border-2 ${sprintCompleted ? 'bg-success text-success-foreground border-foreground' : isLocked ? 'bg-secondary text-muted-foreground border-border' : 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'}`}>
                        {sprintCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : isLocked ? <Lock className="w-6 h-6" /> : <span className="font-display font-bold text-xl">{sprint.order}</span>}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-foreground">{sprint.title}</h3>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">{sprint.tickets.length} Work Tickets</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6 pt-2 bg-background border-t-2 border-border">
                    <div className="pl-0 md:pl-16 space-y-4">
                      {sprint.tickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 border-2 rounded-none ${
                            ticket.status === 'Active' ? 'bg-secondary border-primary shadow-[4px_4px_0px_0px_rgba(255,211,0,0.5)]' : 
                            ticket.status === 'Completed' ? 'bg-background border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 
                            'bg-secondary/50 border-border/50 opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-4 mb-4 sm:mb-0">
                            <div className="mt-1">
                              {ticket.status === 'Completed' ? (
                                <CheckCircle2 className="w-6 h-6 text-success" />
                              ) : ticket.status === 'Active' ? (
                                <PlayCircle className="w-6 h-6 text-primary fill-primary/20" />
                              ) : (
                                <Lock className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`font-bold text-lg ${ticket.status === 'Locked' ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {ticket.title}
                                </span>
                                {ticket.isUrgent && (
                                  <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive rounded-none border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-foreground uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 bg-background px-2 py-1 border-2 border-border">
                                  <FileText className="w-4 h-4" /> {ticket.type}
                                </span>
                                <span className="flex items-center gap-1.5 bg-background px-2 py-1 border-2 border-border">
                                  <Clock className="w-4 h-4" /> {ticket.durationEstimate}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sm:ml-6 flex-shrink-0">
                            {ticket.status === 'Completed' ? (
                              <Badge variant="outline" className="bg-background text-success border-2 border-success w-full justify-center py-2 px-4 rounded-none font-bold text-sm">Completed</Badge>
                            ) : ticket.status === 'Active' ? (
                              <Button asChild size="default" className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-transparent hover:border-foreground rounded-none px-6 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                                <Link href={`/courses/${course.id}/lesson/${ticket.id}`}>Start Lesson</Link>
                              </Button>
                            ) : (
                              <Button disabled variant="outline" size="default" className="w-full sm:w-auto rounded-none border-2 border-border font-bold">Locked</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

      </div>
    </MainLayout>
  );
}
