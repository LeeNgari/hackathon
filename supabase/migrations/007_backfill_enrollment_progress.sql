-- Backfill enrollment progress_percent from current ticket_attempts (attempted = any row, any status).
-- Run after 006 so new attempts are already handled by the trigger; this fixes existing enrollments.

UPDATE public.enrollments e
SET
  progress_percent = sub.progress_pct,
  status          = CASE WHEN sub.progress_pct >= 100 THEN 'completed'::public.enrollment_status ELSE e.status END,
  completed_at    = CASE WHEN sub.progress_pct >= 100 THEN COALESCE(e.completed_at, NOW()) ELSE e.completed_at END
FROM (
  SELECT
    e2.id AS enrollment_id,
    CASE
      WHEN t.total = 0 THEN 0
      ELSE ROUND((a.attempted::NUMERIC / t.total) * 100, 2)
    END AS progress_pct
  FROM public.enrollments e2
  JOIN LATERAL (
    SELECT COUNT(*) AS total
    FROM public.tickets tk
    WHERE tk.course_id = e2.course_id
  ) t ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT ta.ticket_id) AS attempted
    FROM public.ticket_attempts ta
    WHERE ta.enrollment_id = e2.id
  ) a ON true
) sub
WHERE e.id = sub.enrollment_id;
