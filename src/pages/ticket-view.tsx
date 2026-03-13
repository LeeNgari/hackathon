import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, Trophy, ArrowRight, Loader2, Flame } from "lucide-react";
import confetti from "canvas-confetti";

import { useTicket, useCourse, useSubmitTicket } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TicketView() {
  const [, params] = useRoute("/courses/:courseId/ticket/:ticketId");
  const [, setLocation] = useLocation();

  const courseId = params?.courseId || "";
  const ticketId = params?.ticketId || "";

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: ticket, isLoading: ticketLoading } = useTicket(courseId, ticketId);
  const submitMutation = useSubmitTicket();

  const [content, setContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const isFormValid = content.trim().length > 10;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    await submitMutation.mutateAsync({ courseId, ticketId, content });

    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    setShowSuccess(true);
  };

  const handleNext = () => {
    setShowSuccess(false);
    setLocation(`/courses/${courseId}`);
  };

  if (courseLoading || ticketLoading || !ticket || !course) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[600px] rounded-none bg-secondary border-2 border-border" />
          <Skeleton className="h-[600px] rounded-none bg-secondary border-2 border-border" />
        </div>
      </div>
    );
  }

  const deliverablesList = ticket.deliverables || [
    "Review context and requirements",
    "Formulate structured solution",
    "Document findings and reasoning"
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-background border-b-2 border-border px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground font-bold rounded-none hover:bg-secondary transition-colors">
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to {course.title}
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-background border-2 border-border text-foreground font-bold rounded-none px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            Est. {ticket.durationEstimate}
          </Badge>
          {ticket.isUrgent && (
            <Badge className="bg-destructive text-destructive-foreground border-2 border-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] px-3 py-1 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 mr-2" /> Urgent
            </Badge>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Context & Task */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-6 overflow-y-auto pr-2 pb-8 lg:pb-0 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-background">
            <div>
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-3 underline decoration-primary decoration-2 underline-offset-4">{ticket.type} Ticket</div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
                {ticket.title}
              </h1>
            </div>

            <div className="bg-background rounded-none p-6 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary"></div> The Scenario
              </h2>
              <p className="text-foreground font-medium leading-relaxed text-base">
                {ticket.scenario || "A standard operational request has been assigned to you. Review the required deliverables and submit your structured work."}
              </p>
            </div>

            <div className="bg-secondary/30 rounded-none p-6 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex-1">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-success"></div> Required Deliverables
              </h2>
              <div className="space-y-4">
                {deliverablesList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <Checkbox
                      id={`chk-${idx}`}
                      className="mt-1 rounded-none border-2 border-foreground data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=checked]:border-foreground w-5 h-5"
                      checked={checkedItems[idx] || false}
                      onCheckedChange={(checked) => setCheckedItems(prev => ({ ...prev, [idx]: !!checked }))}
                    />
                    <label
                      htmlFor={`chk-${idx}`}
                      className={`text-base leading-snug cursor-pointer transition-colors font-bold ${checkedItems[idx] ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Workspace */}
          <div className="lg:col-span-7 flex flex-col h-full bg-background rounded-none border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative">
            <div className="p-4 border-b-2 border-border bg-secondary flex justify-between items-center shrink-0">
              <span className="font-bold text-foreground uppercase tracking-wider text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-foreground rounded-none"></div> Your Workspace
              </span>
            </div>

            <div className="flex-1 p-0 relative bg-background">
              <Textarea
                placeholder="Structure your solution, code, or analysis here..."
                className="w-full h-full min-h-[400px] border-0 focus-visible:ring-0 rounded-none resize-none p-6 text-base text-foreground bg-background placeholder:text-muted-foreground leading-relaxed font-mono focus:bg-secondary/10 transition-colors"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="p-4 border-t-2 border-border bg-secondary shrink-0 flex items-center justify-between">
              <p className="text-sm text-foreground font-bold">
                {content.length > 0 ? <span className="text-primary">{content.length} characters</span> : <span className="text-muted-foreground">Waiting for input...</span>}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || submitMutation.isPending}
                className="rounded-none border-2 border-foreground bg-primary text-primary-foreground font-bold shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all min-w-[160px] h-12"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5 mr-3" /> Submit Work</>
                )}
              </Button>
            </div>
          </div>

        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center p-8 rounded-none border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-background">
          <div className="mx-auto w-20 h-20 bg-success text-success-foreground border-4 border-foreground rounded-none flex items-center justify-center mb-8 transform -rotate-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Trophy className="w-10 h-10" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-center text-foreground uppercase tracking-wide">Ticket Completed!</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-muted-foreground mb-8 text-lg font-medium">
              Excellent work. Your solution has been recorded and verified. You're building a solid proof-of-work portfolio.
            </p>
            <div className="inline-flex items-center gap-3 bg-secondary/50 px-6 py-3 rounded-none border-2 border-border text-foreground font-bold mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
              <Flame className="w-6 h-6 text-primary fill-primary" /> <span className="uppercase tracking-wider">Streak extended to 13 days!</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button size="lg" onClick={handleNext} className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-foreground rounded-none px-8 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all h-14 text-lg">
              Continue Course <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
