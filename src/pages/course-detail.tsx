import { useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, PlayCircle, Clock, Check, FileText, ArrowLeft, Eye } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useCourse } from "@/hooks/use-app-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketDetailSheet } from "@/components/ticket-detail-sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id || "";
  const { data: course, isLoading, isError, error } = useCourse(courseId);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openTicketDetail = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSheetOpen(true);
  };
  const closeTicketDetail = () => {
    setSheetOpen(false);
    setSelectedTicketId(null);
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-900">Course not found</h1>
          <p className="text-slate-500">{error instanceof Error ? error.message : "Something went wrong."}</p>
          <Link href="/courses" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Course Catalog
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (isLoading || !course) {
    return (
      <MainLayout>
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-4 pt-8">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
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
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        {/* Course Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground">{course.category}</Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-600">{course.difficulty}</Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 leading-tight max-w-2xl">
              {course.title}
            </h1>
            <p className="text-slate-500 mt-4 font-medium">Instructor: {course.instructor}</p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Course Progress</span>
              <span className="text-2xl font-bold text-primary">{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-3" />
            <p className="text-sm text-slate-500 mt-3 font-medium">
              {completedTickets} of {totalTickets} Tickets Completed
            </p>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Fee Refunded</span>
              <span className="text-2xl font-bold text-emerald-600">KES {(course.fee * ((course.progressPercent || 0)/100)).toFixed(0)}</span>
            </div>
            <Progress value={course.progressPercent} className="h-3 bg-emerald-200/50 [&>div]:bg-emerald-500" />
            <p className="text-sm text-emerald-600/80 mt-3 font-medium">
              Total Fee: KES {course.fee}
            </p>
          </div>
        </div>

        {/* Sprints List */}
        <div className="mt-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Work Sprints</h2>
          
          <Accordion type="multiple" defaultValue={["s_1_2", "s_2_1"]} className="space-y-4">
            {course.sprints.map((sprint) => {
              const sprintCompleted = sprint.tickets.every(t => t.status === "Completed");
              const isLocked = sprint.tickets.every(t => t.status === "Locked");
              
              return (
                <AccordionItem 
                  key={sprint.id} 
                  value={sprint.id} 
                  className={`bg-white border rounded-2xl overflow-hidden px-2 shadow-sm transition-all ${isLocked ? 'opacity-70 bg-slate-50' : 'border-slate-200'}`}
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="flex items-center text-left gap-4 w-full pr-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${sprintCompleted ? 'bg-emerald-100 text-emerald-600' : isLocked ? 'bg-slate-200 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                        {sprintCompleted ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : <span className="font-bold">{sprint.order}</span>}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{sprint.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{sprint.tickets.length} Work Tickets</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="pl-14 pt-2 space-y-3">
                      {sprint.tickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                            ticket.status === 'Active' ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 
                            ticket.status === 'Completed' ? 'bg-slate-50 border-slate-100' : 
                            'bg-slate-50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3 sm:mb-0 flex-1 min-w-0">
                            <div className="mt-0.5 flex-shrink-0">
                              {ticket.status === 'Completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : ticket.status === 'Active' ? (
                                <PlayCircle className="w-5 h-5 text-primary" />
                              ) : (
                                <Lock className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => openTicketDetail(ticket.id)}
                                className="text-left w-full group flex items-center gap-2"
                              >
                                <span className={`font-bold truncate ${ticket.status === 'Locked' ? 'text-slate-500' : 'text-slate-900'} group-hover:text-primary transition-colors`}>
                                  {ticket.title}
                                </span>
                                <Eye className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-primary transition-colors" aria-hidden />
                              </button>
                              <div className="flex items-center gap-2 mb-1">
                                {ticket.isUrgent && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] py-0 px-1.5 uppercase font-bold tracking-wider">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                                <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  <FileText className="w-3 h-3" /> {ticket.type}
                                </span>
                                <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  <Clock className="w-3 h-3" /> {ticket.durationEstimate}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sm:ml-4 flex-shrink-0 flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-slate-900 sm:hidden"
                              onClick={() => openTicketDetail(ticket.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                            {ticket.status === 'Completed' ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 w-full justify-center">Completed</Badge>
                            ) : ticket.status === 'Active' ? (
                              <Button asChild size="sm" className="w-full sm:w-auto shadow-md shadow-primary/20">
                                <Link href={`/courses/${course.id}/ticket/${ticket.id}`}>
                                  {ticket.hasAttemptedBefore ? "Continue" : "Start Ticket"}
                                </Link>
                              </Button>
                            ) : (
                              <Button disabled variant="outline" size="sm" className="w-full sm:w-auto">Locked</Button>
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

      <TicketDetailSheet
        open={sheetOpen}
        onOpenChange={closeTicketDetail}
        courseId={courseId}
        ticketId={selectedTicketId}
        variant="student"
        courseTitle={course.title}
        startTicketHref={selectedTicketId ? `/courses/${course.id}/ticket/${selectedTicketId}` : null}
        startTicketLabel={course.sprints.flatMap(s => s.tickets).find(t => t.id === selectedTicketId)?.hasAttemptedBefore ? "Continue" : "Start Ticket"}
      />
    </MainLayout>
  );
}
