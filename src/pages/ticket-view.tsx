import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, Trophy, ArrowRight, Loader2, Play, ChevronRight, ChevronLeft } from "lucide-react";
import confetti from "canvas-confetti";
import Editor from "@monaco-editor/react";

import { useTicket, useCourse, useSubmitTicket } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TicketView() {
  const [, params] = useRoute("/courses/:courseId/lesson/:ticketId");
  const [, setLocation] = useLocation();

  const courseId = params?.courseId || "";
  const ticketId = params?.ticketId || "";

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: ticket, isLoading: ticketLoading } = useTicket(courseId, ticketId);
  const submitMutation = useSubmitTicket();

  const [content, setContent] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (ticket?.starterCode) {
      setContent(ticket.starterCode);
    }
  }, [ticket]);

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleOutput("");
    // Simulate compilation or runtime
    await new Promise(r => setTimeout(r, 800));
    setConsoleOutput(ticket?.expectedOutput || "Run successful.\n> No output found.");
    setIsRunning(false);
  };

  const handleSubmit = async () => {
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
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
        <Skeleton className="h-16 w-full mb-2 bg-secondary" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1">
          <Skeleton className="h-full rounded-sm bg-secondary" />
          <Skeleton className="h-full rounded-sm bg-secondary" />
          <Skeleton className="h-full rounded-sm bg-secondary" />
        </div>
      </div>
    );
  }

  // Derive title to display in left pane (Codecademy style)
  const isPython = course.title.toLowerCase().includes("python");
  const fileName = isPython ? "main.py" : "index.js";
  const language = isPython ? "python" : "javascript";

  return (
    <div className="h-screen w-full bg-[#1e1e2e] flex flex-col font-sans overflow-hidden text-slate-300">
      {/* Top Header */}
      <header className="h-14 bg-[#181825] border-b border-[#313244] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white rounded-md hover:bg-[#313244] transition-colors h-8 w-8">
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="font-bold text-white tracking-wide text-sm">{course.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-[#181825] border-[#313244] text-slate-300 font-semibold rounded-md px-3 py-1">
            <Clock className="w-3 h-3 mr-2 text-blue-400" />
            {ticket.durationEstimate}
          </Badge>
          <Button variant="ghost" size="sm" className="hidden lg:flex text-slate-400 hover:text-white h-8 text-xs font-semibold hover:bg-[#313244] tracking-wide rounded-md">
            Get Unstuck
          </Button>
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs ml-2 cursor-pointer border border-[#313244]">
            D
          </div>
        </div>
      </header>

      {/* Main 3-pane Layout */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Pane 1: Instructions (Left) - White Background */}
        <div className="lg:col-span-4 bg-white text-slate-900 flex flex-col h-full border-r-2 border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{course.title.toUpperCase()}</span>
            <div className="w-4 flex flex-col gap-[2px] cursor-pointer opacity-50 hover:opacity-100">
              <div className="w-full h-[2px] bg-slate-900" />
              <div className="w-full h-[2px] bg-slate-900" />
              <div className="w-full h-[2px] bg-slate-900" />
            </div>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
            {ticket.lessonContent ? (
              <>
                <div className="prose prose-slate prose-h1:text-2xl prose-h1:font-display prose-h1:font-bold prose-h1:mb-3 prose-p:text-[15px] prose-p:leading-relaxed prose-a:text-blue-600 prose-code:bg-slate-100 prose-code:text-rose-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-mono max-w-none" dangerouslySetInnerHTML={{ __html: ticket.lessonContent }} />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">Required Deliverables</h2>
                <ul className="space-y-3">
                  {(ticket.deliverables || ["Implement the requested feature", "Verify code compiles without errors"]).map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-[15px] text-slate-700">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div>
                <h1 className="text-2xl font-display font-bold mb-4">{ticket.title}</h1>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {ticket.scenario || "A standard operational request has been assigned to you. Review the required deliverables and submit your structured work."}
                </p>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">Required Deliverables</h2>
                <ul className="space-y-3">
                  {(ticket.deliverables || ["Implement the requested feature", "Verify code compiles without errors"]).map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-[15px] text-slate-700">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Pane 2: Editor (Middle) - Dark */}
        <div className="lg:col-span-5 bg-[#1e1e2e] flex flex-col h-full border-r border-[#313244]">
          <div className="h-10 bg-[#181825] flex items-end shrink-0 px-2 pt-2 border-b border-[#313244]">
            <div className="bg-[#1e1e2e] text-slate-200 px-4 py-1.5 text-xs font-mono rounded-t-lg border-t border-x border-[#313244] border-b-transparent relative z-10 opacity-100 flex items-center gap-2">
              {fileName}
              <button className="opacity-50 hover:opacity-100 text-[10px]">x</button>
            </div>
          </div>
          <div className="flex-1 py-4 pt-4">
            <Editor
              height="100%"
              defaultLanguage={language}
              theme="vs-dark"
              value={content}
              onChange={(val) => setContent(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                lineHeight: 24,
                padding: { top: 8 },
                scrollBeyondLastLine: false,
                renderLineHighlight: "all",
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                scrollbar: {
                  verticalSliderSize: 6,
                  horizontalSliderSize: 6
                }
              }}
            />
          </div>
        </div>

        {/* Pane 3: Console Output (Right) - Darker */}
        <div className="lg:col-span-3 bg-[#11111b] flex flex-col h-full relative">
          <div className="h-10 border-b border-[#313244] flex items-center px-4 shrink-0 justify-between bg-[#11111b]">
            <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Output</span>
            {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
          </div>
          <div className="flex-1 p-4 font-mono text-[13px] text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap">
            {consoleOutput}
          </div>
        </div>
      </main>

      {/* Footer Workspace Action Bar */}
      <footer className="h-14 bg-[#181825] border-t border-[#313244] flex items-center justify-between px-4 shrink-0 z-10">
        {/* Left: Run */}
        <div className="flex-1 flex justify-start">
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-[#facc15] text-amber-950 hover:bg-[#fde047] font-bold h-9 min-w-[80px] rounded-md shadow-none transition-colors border border-[#ca8a04]"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run"}
          </Button>
        </div>

        {/* Center: Pagination indicator */}
        <div className="flex-1 flex justify-center">
          <span className="text-slate-400 text-xs font-bold tracking-wide">
            {ticket.id.split('_').pop()}/13
          </span>
        </div>

        {/* Right: Navigation */}
        <div className="flex-1 flex justify-end items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 bg-[#313244]/50 border border-[#313244] hover:bg-[#313244] text-slate-300 rounded-md font-semibold text-xs px-3">
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="w-3 h-3 mr-1" /> Back
            </Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            variant="secondary"
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 hover:border-blue-400 rounded-md font-semibold text-xs px-3 ml-2"
          >
            {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : undefined}
            Submit Next <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </footer>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center p-8 border-0 bg-[#1e1e2e] shadow-2xl rounded-xl">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center text-white">Lesson Completed!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Great progress. You successfully completed this exercise and learned a new concept.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button size="lg" onClick={handleNext} className="w-full sm:w-auto font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-lg">
              Continue Course <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
