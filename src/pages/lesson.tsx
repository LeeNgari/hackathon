import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Copy,
  CheckCircle2,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCourse, useTicket } from "@/hooks/use-app-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function Lesson() {
  const [, params] = useRoute("/courses/:courseId/lesson/:ticketId");
  const { toast } = useToast();

  const courseId = params?.courseId ?? "";
  const ticketId = params?.ticketId ?? "";

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: ticket, isLoading: ticketLoading } = useTicket(courseId, ticketId);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (ticket?.starterCode) {
      setCode(ticket.starterCode);
    } else if (ticket && !ticket.starterCode) {
      setCode("");
    }
  }, [ticket?.id, ticket?.starterCode]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("");
    setTimeout(() => {
      setOutput(ticket?.expectedOutput ?? "Run complete.");
      setIsRunning(false);
    }, 800);
  };

  const handleCopyCode = () => {
    const toCopy = code || ticket?.starterCode || "";
    if (toCopy) {
      navigator.clipboard.writeText(toCopy);
      setIsCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isLoading = courseLoading || ticketLoading;
  const notFound = !isLoading && (!course || !ticket);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-[#10162F] text-slate-200 overflow-hidden font-sans">
        <header className="h-[60px] bg-[#1a233a] border-b border-[#2d3748] flex items-center px-4 shrink-0" />
        <main className="flex-1 flex items-center justify-center p-8">
          <Skeleton className="h-64 w-full max-w-2xl bg-slate-800 rounded" />
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen flex flex-col bg-[#10162F] text-slate-200 overflow-hidden font-sans items-center justify-center gap-4 p-8">
        <p className="text-slate-400">Lesson not found.</p>
        <Button asChild variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
          <Link href="/courses">Back to courses</Link>
        </Button>
      </div>
    );
  }

  const courseTitle = course?.title ?? "";
  const ticketTitle = ticket?.title ?? "";
  const timeRemaining = ticket?.durationEstimate ?? "—";
  const lessonContent = ticket?.lessonContent ?? ticket?.scenario ?? "";

  return (
    <div className="h-screen flex flex-col bg-[#10162F] text-slate-200 overflow-hidden font-sans">
      <header className="h-[60px] bg-[#1a233a] border-b border-[#2d3748] flex items-center justify-between px-4 shrink-0 shadow-sm z-10 w-full">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm">
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-slate-700 mx-2" />
          <h1 className="font-bold text-lg text-white font-display tracking-wide">{courseTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="bg-transparent border-[#2d3748] text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm font-semibold h-9 px-4">
            Get Unstuck
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-[#2d3748] text-slate-300 hover:text-white hover:bg-slate-800 rounded-sm font-semibold h-9 px-4">
            Tools
          </Button>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-400 font-bold text-white shadow-sm">
            U
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex w-full">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full rounded-none">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="bg-white flex flex-col h-full border-r-2 border-slate-900 border-solid z-20">
            <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{courseTitle.toUpperCase()}</span>
              <button className="text-slate-400 hover:text-slate-600" type="button" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            </div>

            <ScrollArea className="flex-1 w-full bg-white">
              <div className="p-6 pb-24 prose prose-slate max-w-none text-slate-800">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 mt-0 tracking-tight">{ticketTitle}</h2>
                <div className="text-sm font-medium text-slate-500 mb-8 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  {timeRemaining}
                </div>

                {lessonContent && (
                  <div
                    className="space-y-6 text-[15px] leading-relaxed lesson-content"
                    dangerouslySetInnerHTML={{ __html: lessonContent }}
                  />
                )}

                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">Required Deliverables</h2>
                <ul className="space-y-3">
                  {(ticket.deliverables || ["Implement the requested feature", "Verify code compiles without errors"]).map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-[15px] text-slate-700">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle className="w-1.5 bg-[#10162F] hover:bg-indigo-500 active:bg-indigo-600 transition-colors z-30" />

          <ResizablePanel defaultSize={40} minSize={20} className="bg-[#10162F] flex flex-col h-full z-10">
            <div className="h-10 bg-[#1a233a] border-b border-[#2d3748] flex items-center px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 bg-[#2d3748]/50 px-3 py-1 rounded-sm border border-[#2d3748]">
                <span className="text-xs font-mono text-slate-300">main.py</span>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#1e1e1e] relative">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 24,
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  fontLigatures: true,
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  formatOnPaste: true,
                  renderLineHighlight: "all",
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden",
                  },
                }}
                className="absolute inset-0"
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-1.5 bg-[#10162F] hover:bg-indigo-500 active:bg-indigo-600 transition-colors z-30" />

          <ResizablePanel defaultSize={30} minSize={15} className="bg-[#0d1226] flex flex-col h-full border-l border-[#2d3748] z-10">
            <div className="h-10 border-b border-[#2d3748] flex items-center px-4 shrink-0 bg-[#0d1226]">
              <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Output</span>
            </div>
            <div className="flex-1 p-4 font-mono text-[13px] text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed">
              {isRunning ? (
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  Running...
                </div>
              ) : output ? (
                output
              ) : (
                <span className="text-slate-600 italic">Click Run to execute your code</span>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <footer className="h-[60px] bg-[#1a233a] border-t border-[#2d3748] px-4 md:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4 w-1/3">
          <Button
            className="bg-[#FFD300] hover:bg-[#e6be00] text-black font-bold border-2 border-[#10162F] shadow-[2px_2px_0px_0px_#10162F] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all rounded-sm px-6 h-10"
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                Running
              </span>
            ) : (
              <span className="flex items-center gap-1.5 tracking-wide">Run</span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 h-10 w-10" onClick={handleCopyCode}>
            {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-center w-1/3 text-sm font-bold text-slate-400 tracking-wider">
          {timeRemaining}
        </div>

        <div className="flex items-center justify-end gap-3 w-1/3">
          <Button variant="outline" asChild className="bg-transparent border-[#2d3748] text-white hover:bg-slate-800 rounded-sm font-bold h-10 px-5">
            <Link href={`/courses/${courseId}`}>Back</Link>
          </Button>
          <Button className="bg-[#1a233a] opacity-50 cursor-not-allowed border border-[#2d3748] text-slate-500 rounded-sm font-bold h-10 px-5">
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}
