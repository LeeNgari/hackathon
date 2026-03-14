"use client";

import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { useTicket, useInstructorTicketDetail } from "@/hooks/use-app-data";

const DEFAULT_SCENARIO =
  "A standard operational request has been assigned to you. Review the required deliverables and submit your structured work.";
const DEFAULT_DELIVERABLES = [
  "Review context and requirements",
  "Formulate structured solution",
  "Document findings and reasoning",
];

type TicketDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  ticketId: string | null;
  variant: "student" | "instructor";
  courseTitle?: string;
  /** For student: link to start the ticket (e.g. /courses/:id/ticket/:ticketId) */
  startTicketHref?: string | null;
  /** For student: button label, e.g. "Start Ticket" or "Continue" */
  startTicketLabel?: string;
};

export function TicketDetailSheet({
  open,
  onOpenChange,
  courseId,
  ticketId,
  variant,
  courseTitle,
  startTicketHref,
  startTicketLabel = "Start Ticket",
}: TicketDetailSheetProps) {
  const studentTicket = useTicket(courseId, ticketId ?? "", {
    enabled: variant === "student" && !!ticketId,
  });
  const instructorTicket = useInstructorTicketDetail(courseId, ticketId);

  const isInstructor = variant === "instructor";
  const ticketData = isInstructor ? instructorTicket.data : studentTicket.data;
  const isLoading = isInstructor ? instructorTicket.isLoading : studentTicket.isLoading;

  const title = ticketData?.title;
  const type = ticketData?.type ?? null;
  const durationEstimate =
    ticketData && "durationEstimate" in ticketData
      ? (ticketData as { durationEstimate: string }).durationEstimate
      : null;
  const isUrgent = ticketData?.isUrgent ?? false;
  const scenario = ticketData && "scenario" in ticketData ? (ticketData.scenario ?? null) : null;
  const deliverables = ticketData && "deliverables" in ticketData ? (ticketData.deliverables ?? []) : [];

  const scenarioText = scenario ?? DEFAULT_SCENARIO;
  const deliverablesList =
    Array.isArray(deliverables) && deliverables.length > 0
      ? deliverables
      : DEFAULT_DELIVERABLES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-lg overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="text-left space-y-2 pb-4 border-b border-slate-200">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <SheetTitle className="text-xl font-display font-bold text-slate-900 pr-8">
                {title ?? "Ticket"}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                {type && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-200 text-slate-600"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    {type}
                  </Badge>
                )}
                {durationEstimate && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" />
                    {durationEstimate}
                  </span>
                )}
                {isUrgent && (
                  <Badge className="bg-red-50 text-red-600 border-red-100 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
            </>
          )}
        </SheetHeader>

        <div className="space-y-6 py-6">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Scenario
            </h3>
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">
                {scenarioText}
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Required Deliverables
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <ul className="space-y-2">
                {deliverablesList.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between border-t border-slate-200 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {startTicketHref && ticketId && (
            <Button asChild className="w-full sm:w-auto shadow-md">
              <Link href={startTicketHref}>
                {startTicketLabel} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
