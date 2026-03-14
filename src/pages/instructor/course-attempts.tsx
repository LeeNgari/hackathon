import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import {
  useInstructorCourseDetail,
  useInstructorCourseAttempts,
  useInstructorAttemptDetail,
  useInstructorTicketDetail,
} from "@/hooks/use-app-data";
import { useAuth } from "@/contexts/AuthContext";
import { useGradeAttempt, overrideAttemptStatusApi } from "@/lib/api/ai";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

function AttemptDetailSheet({
  open,
  onOpenChange,
  courseId: courseIdProp,
  attemptId,
  ticketId,
  ticketTitle,
  studentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  attemptId: string | null;
  ticketId: string;
  ticketTitle: string;
  studentName: string;
}) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: detail, isLoading, refetch } = useInstructorAttemptDetail(attemptId);
  const { data: ticketDetail } = useInstructorTicketDetail(courseIdProp, ticketId);
  const gradeMutation = useGradeAttempt(ticketId, attemptId ?? "", {
    getAccessToken: () => session?.access_token ?? null,
  });

  const handleGradeWithAI = async () => {
    if (!attemptId || gradeMutation.isPending) return;
    try {
      await gradeMutation.mutateAsync();
      await refetch();
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-attempts", courseIdProp],
      });
    } catch {
      // Error handled by mutation
    }
  };

  const overrideMutation = useMutation({
    mutationFn: async (status: "passed" | "failed") => {
      const token = session?.access_token;
      if (!token || !attemptId) throw new Error("Not authenticated");
      return overrideAttemptStatusApi(attemptId, status, token);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["instructor", "course-attempts", courseIdProp],
      });
    },
  });

  const handleOverride = async (status: "passed" | "failed") => {
    if (!attemptId || overrideMutation.isPending) return;
    try {
      await overrideMutation.mutateAsync(status);
    } catch {
      // Error handled by mutation
    }
  };

  const attempt = detail?.attempt;
  const submissions = detail?.deliverableSubmissions ?? [];
  const scenario = ticketDetail?.scenario ?? null;
  const deliverablesList = ticketDetail?.deliverables ?? [];
  const isGraded = attempt?.status === "passed" || attempt?.status === "failed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-xl overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="text-left space-y-2 pb-4 border-b border-slate-200">
          <SheetTitle className="text-lg font-display font-bold text-slate-900 pr-8">
            {ticketTitle}
          </SheetTitle>
          <p className="text-sm text-slate-500">
            {studentName} · {attempt?.status ?? "—"}
          </p>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : (
            <>
              {scenario && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Scenario
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {scenario}
                  </p>
                </section>
              )}

              {attempt?.submission_text && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Submission
                  </h3>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                      {attempt.submission_text}
                    </p>
                  </div>
                </section>
              )}

              {submissions.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Deliverables
                  </h3>
                  <div className="space-y-4">
                    {submissions.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-slate-200 p-3 bg-white"
                      >
                        {sub.deliverable_description && (
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            {idx + 1}. {sub.deliverable_description}
                          </p>
                        )}
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {sub.content || "—"}
                        </p>
                        {sub.ai_feedback != null && sub.ai_feedback !== "" && (
                          <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                            Feedback: {sub.ai_feedback}
                          </p>
                        )}
                        {sub.ai_score != null && (
                          <p className="text-xs font-medium text-slate-600 mt-1">
                            Score: {sub.ai_score}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {isGraded && attempt && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Overall
                  </h3>
                  {attempt.ai_score != null && (
                    <p className="text-sm font-semibold text-slate-700">
                      Score: {attempt.ai_score}%
                    </p>
                  )}
                  {attempt.ai_review_text && (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-2">
                      {attempt.ai_review_text}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {(attempt?.status === "submitted" || attempt?.status === "passed" || attempt?.status === "failed") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOverride("passed")}
                  disabled={overrideMutation.isPending || attempt?.status === "passed"}
                >
                  Mark passed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOverride("failed")}
                  disabled={overrideMutation.isPending || attempt?.status === "failed"}
                >
                  Mark failed
                </Button>
              </>
            )}
            {attempt?.status === "submitted" && (
              <Button
                onClick={handleGradeWithAI}
                disabled={gradeMutation.isPending}
                className="gap-2"
              >
                {gradeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Grade with AI
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function InstructorCourseAttempts() {
  const [, params] = useRoute("/instructor/courses/:courseId/attempts");
  const courseId = params?.courseId ?? null;

  const { data: courseData } = useInstructorCourseDetail(courseId);
  const { data: attempts = [], isLoading } = useInstructorCourseAttempts(courseId);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId);

  const openDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setSheetOpen(true);
  };
  const closeDetail = () => {
    setSheetOpen(false);
    setSelectedAttemptId(null);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
            In progress
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200">
            Pending review
          </Badge>
        );
      case "passed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Passed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={courseId ? `/instructor/courses/${courseId}` : "/instructor/courses"}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to course
          </Link>
          <Badge variant="outline" className="text-xs text-slate-500">
            Instructor view
          </Badge>
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {courseData?.title ?? "Course"} · Attempts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and grade student ticket submissions.
          </p>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions ({attempts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : attempts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No attempts yet. Students will appear here when they submit tickets.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500 font-medium">
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4">Ticket</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Submitted</th>
                      <th className="pb-3 pr-4 text-right">Score</th>
                      <th className="pb-3 pl-4 w-0" />
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {a.student_name}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{a.ticket_title}</td>
                        <td className="py-3 pr-4">{statusBadge(a.status)}</td>
                        <td className="py-3 pr-4 text-slate-600">
                          {formatDate(a.submitted_at)}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-slate-700">
                          {a.ai_score != null ? `${a.ai_score}%` : "—"}
                        </td>
                        <td className="py-3 pl-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary"
                            onClick={() => openDetail(a.id)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <AttemptDetailSheet
          open={sheetOpen}
          onOpenChange={closeDetail}
          courseId={courseId ?? ""}
          attemptId={selectedAttemptId}
          ticketId={selectedAttempt?.ticket_id ?? ""}
          ticketTitle={selectedAttempt?.ticket_title ?? ""}
          studentName={selectedAttempt?.student_name ?? ""}
        />
      </div>
    </InstructorLayout>
  );
}
