import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  useTicket,
  useCourse,
  useSubmitTicket,
  useTicketAttempt,
  useStartNewTicketAttempt,
  type AttemptStatus,
} from "@/hooks/use-app-data";
import { useAuth } from "@/contexts/AuthContext";
import { useGradeAttempt } from "@/lib/api/ai";
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

  const { data: course, isLoading: courseLoading, isError: courseError } = useCourse(courseId);
  const { data: ticket, isLoading: ticketLoading, isError: ticketError } = useTicket(
    courseId,
    ticketId
  );
  const { session } = useAuth();
  const {
    data: attemptData,
    isLoading: attemptLoading,
    refetch: refetchAttempt,
  } = useTicketAttempt(courseId, ticketId, {
    enabled: !!courseId && !!ticketId,
  });
  const submitMutation = useSubmitTicket();
  const gradeMutation = useGradeAttempt(
    ticketId,
    attemptData?.attempt?.id ?? "",
    { getAccessToken: () => session?.access_token ?? null },
  );

  const isError = courseError || ticketError;
  const attempt = attemptData?.attempt ?? null;
  const deliverableSubmissions = attemptData?.deliverableSubmissions ?? [];
  const noEnrollment = attemptData?.noEnrollment ?? false;
  const hasAttemptedBefore = attemptData?.hasAttemptedBefore ?? false;
  const status: AttemptStatus | undefined = attempt?.status;

  const startNewAttemptMutation = useStartNewTicketAttempt();

  const [content, setContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAutoGrading, setIsAutoGrading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Prefill workspace from first deliverable or submission_text when attempt loads
  useEffect(() => {
    if (!attempt || status !== "in_progress") return;
    const firstContent =
      deliverableSubmissions[0]?.content ?? attempt.submission_text ?? "";
    if (firstContent && !content) setContent(firstContent);
  }, [attempt?.id, status, deliverableSubmissions, attempt?.submission_text]);

  const isFormValid = content.trim().length > 10;
  const canSubmit =
    status === "in_progress" && isFormValid && !submitMutation.isPending;
  const isSubmittedPending = status === "submitted" && !attempt?.reviewed_at;
  const isGraded = status === "passed" || status === "failed";

  const handleSubmit = async () => {
    if (!canSubmit || !attempt?.id) return;

    await submitMutation.mutateAsync({
      courseId,
      ticketId,
      attemptId: attempt.id,
      content,
    });
    setIsAutoGrading(true);
    try {
      await gradeMutation.mutateAsync();
      await refetchAttempt();
    } catch {
      // Grading failed; user can use "Grade with AI" manually
    } finally {
      setIsAutoGrading(false);
    }
    setShowSuccess(true);
  };

  const handleGradeWithAI = async () => {
    if (!attempt?.id || gradeMutation.isPending) return;
    try {
      await gradeMutation.mutateAsync();
      await refetchAttempt();
    } catch {
      // Error already handled by mutation
    }
  };

  const handleNext = () => {
    setShowSuccess(false);
    setLocation(`/courses/${courseId}`);
  };

  const handleReviewFeedback = () => {
    setShowSuccess(false);
    // Stay on page so user can see feedback panel and workspace
  };

  const handleRestartTicket = async () => {
    try {
      await startNewAttemptMutation.mutateAsync({ courseId, ticketId });
      await refetchAttempt();
      setContent("");
      setCheckedItems({});
    } catch {
      // Error handled by mutation
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold text-slate-900">Ticket not found</h1>
        <p className="text-slate-500 text-center">
          This ticket may not exist or you may not have access to it.
        </p>
        <Button variant="outline" asChild>
          <Link href={courseId ? `/courses/${courseId}` : "/courses"}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to course
          </Link>
        </Button>
      </div>
    );
  }

  if (noEnrollment && !attemptLoading && course && !courseLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold text-slate-900">Enroll to start</h1>
        <p className="text-slate-500 text-center">
          You need to enroll in this course before you can work on tickets.
        </p>
        <Button variant="outline" asChild>
          <Link href={courseId ? `/courses/${courseId}` : "/courses"}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to course
          </Link>
        </Button>
      </div>
    );
  }

  if (courseLoading || ticketLoading || !ticket || !course) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[600px] rounded-2xl" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const deliverablesList =
    ticket.deliverables ?? [
      "Review context and requirements",
      "Formulate structured solution",
      "Document findings and reasoning",
    ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-slate-500 hover:text-slate-900"
          >
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to {course.title}
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-slate-50 font-medium">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Est. {ticket.durationEstimate}
          </Badge>
          {ticket.isUrgent && (
            <Badge className="bg-red-50 text-red-600 border-red-100 shadow-none">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Urgent
            </Badge>
          )}
          {status === "submitted" && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Pending review
            </Badge>
          )}
          {status === "passed" && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Passed
            </Badge>
          )}
          {status === "failed" && (
            <Badge className="bg-red-50 text-red-600 border-red-200">
              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Needs improvement
            </Badge>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5 flex flex-col h-full space-y-6 overflow-y-auto pr-2 pb-8 lg:pb-0">
            <div>
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                {ticket.type} Ticket
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight">
                {ticket.title}
              </h1>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                The Scenario
              </h2>
              <p className="text-slate-700 leading-relaxed text-[15px]">
                {ticket.scenario ??
                  "A standard operational request has been assigned to you. Review the required deliverables and submit your structured work."}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Required Deliverables
              </h2>
              <div className="space-y-4">
                {deliverablesList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Checkbox
                      id={`chk-${idx}`}
                      className="mt-0.5 rounded-[4px] data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      checked={checkedItems[idx] || false}
                      onCheckedChange={(checked) =>
                        setCheckedItems((prev) => ({ ...prev, [idx]: !!checked }))
                      }
                    />
                    <label
                      htmlFor={`chk-${idx}`}
                      className={`text-sm leading-snug cursor-pointer transition-colors ${
                        checkedItems[idx]
                          ? "text-slate-400 line-through"
                          : "text-slate-700 font-medium"
                      }`}
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {(isGraded && (attempt?.ai_score != null || attempt?.ai_review_text)) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Feedback
                </h2>
                {attempt?.ai_score != null && (
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Score: {attempt.ai_score}%
                  </p>
                )}
                {attempt?.ai_review_text ? (
                  <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {attempt.ai_review_text}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">No written feedback for this attempt.</p>
                )}
              </div>
            )}
            {isGraded &&
              deliverableSubmissions.some(
                (sub) => sub.ai_score != null || (sub.ai_feedback != null && sub.ai_feedback !== "")
              ) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Feedback by deliverable
                </h2>
                <div className="space-y-4">
                  {deliverableSubmissions.map((sub, idx) => {
                    if (sub.ai_score == null && (!sub.ai_feedback || sub.ai_feedback === ""))
                      return null;
                    const label = deliverablesList[idx] ?? `Deliverable ${idx + 1}`;
                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
                        {sub.ai_score != null && (
                          <p className="text-xs text-slate-500 mb-2">Score: {sub.ai_score}%</p>
                        )}
                        {sub.ai_feedback && (
                          <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">
                            {sub.ai_feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0 flex-wrap gap-2">
              <span className="font-semibold text-slate-700">Your Workspace</span>
              {isGraded && attempt?.ai_score != null && (
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-lg ${
                    status === "passed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Your grade: {attempt.ai_score}%
                </span>
              )}
            </div>

            <div className="flex-1 p-0 relative">
              <Textarea
                placeholder="Structure your solution, code, or analysis here..."
                className="w-full h-full min-h-[400px] border-0 focus-visible:ring-0 rounded-none resize-none p-6 text-base text-slate-800 placeholder:text-slate-300 leading-relaxed font-mono"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={isGraded || isSubmittedPending}
                disabled={attemptLoading}
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-slate-500 font-medium">
                {content.length > 0
                  ? `${content.length} characters`
                  : "Waiting for input..."}
              </p>
              <div className="flex items-center gap-2">
                {isGraded && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRestartTicket}
                    disabled={startNewAttemptMutation.isPending}
                  >
                    {startNewAttemptMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Restarting...
                      </>
                    ) : (
                      "Restart ticket"
                    )}
                  </Button>
                )}
                {isSubmittedPending && (
                  <>
                    {isAutoGrading || gradeMutation.isPending ? (
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isAutoGrading ? "Grading your submission…" : "Grading…"}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGradeWithAI}
                        disabled={gradeMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Grade with AI
                      </Button>
                    )}
                  </>
                )}
                {status === "in_progress" && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="shadow-md shadow-primary/20 hover:shadow-lg transition-all min-w-[140px]"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {hasAttemptedBefore ? "Reattempt" : "Submit Work"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center p-8 rounded-3xl border-0 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">
              Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isGraded && attempt?.ai_score != null && (
              <p className="text-lg font-bold text-slate-800 mb-3">
                Your grade: {attempt.ai_score}%
              </p>
            )}
            <p className="text-slate-500 mb-6 text-[15px]">
              {isGraded
                ? "Your solution has been submitted and graded. Choose \"Review feedback\" to see your feedback on this page, or \"Back to course\" when done."
                : "Your solution has been recorded. Use \"Grade with AI\" on this page to get feedback, or wait for instructor review."}
            </p>
          </div>
          <DialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
            {isGraded && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleNext}
                className="w-full sm:w-auto"
              >
                Back to course <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button
              size="lg"
              onClick={isGraded ? handleReviewFeedback : handleNext}
              className="w-full sm:w-auto shadow-lg shadow-primary/20"
            >
              {isGraded ? "Review feedback" : <>Back to course <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
