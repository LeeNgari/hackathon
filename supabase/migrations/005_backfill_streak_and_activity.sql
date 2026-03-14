-- =============================================================================
-- Backfill streak_records and activity from existing passed ticket_attempts,
-- then recompute profiles.current_streak and profiles.best_streak.
-- Safe to run multiple times (idempotent for streak_records; activity skips
-- rows that already exist for the same attempt).
-- =============================================================================

-- 1. Backfill streak_records: one row per student per calendar day with
--    tickets_completed = count of passed attempts that day (by reviewed_at or updated_at).
INSERT INTO public.streak_records (student_id, date, tickets_completed)
SELECT
  ta.student_id,
  (COALESCE(ta.reviewed_at, ta.updated_at))::DATE AS completion_date,
  COUNT(*)::INTEGER AS tickets_completed
FROM public.ticket_attempts ta
WHERE ta.status = 'passed'
  AND (ta.reviewed_at IS NOT NULL OR ta.updated_at IS NOT NULL)
GROUP BY ta.student_id, (COALESCE(ta.reviewed_at, ta.updated_at))::DATE
ON CONFLICT (student_id, date)
DO UPDATE SET
  tickets_completed = public.streak_records.tickets_completed + EXCLUDED.tickets_completed;

-- 2. Backfill activity: one row per passed attempt with created_at = completion time.
--    Skip attempts that already have an activity row (e.g. from the trigger).
INSERT INTO public.activity (student_id, activity_type, reference_type, reference_id, metadata, created_at)
SELECT
  ta.student_id,
  'ticket_completed'::TEXT,
  'ticket_attempt'::TEXT,
  ta.id,
  jsonb_build_object('ticket_id', ta.ticket_id),
  COALESCE(ta.reviewed_at, ta.updated_at)
FROM public.ticket_attempts ta
WHERE ta.status = 'passed'
  AND (ta.reviewed_at IS NOT NULL OR ta.updated_at IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.activity a
    WHERE a.reference_type = 'ticket_attempt' AND a.reference_id = ta.id
  );

-- 3. Recompute current_streak and best_streak for all profiles that have streak_records.
--    Consecutive calendar days are grouped by (date - ROW_NUMBER() ORDER BY date ASC).
WITH ordered AS (
  SELECT
    student_id,
    date,
    date - (ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY date ASC))::INTEGER AS grp
  FROM public.streak_records
),
today_grp AS (
  SELECT student_id, grp
  FROM ordered
  WHERE date = CURRENT_DATE
),
current_run AS (
  SELECT o.student_id, COUNT(*)::INTEGER AS run_length
  FROM ordered o
  JOIN today_grp tg ON tg.student_id = o.student_id AND tg.grp = o.grp
  WHERE o.date <= CURRENT_DATE
  GROUP BY o.student_id
),
run_counts AS (
  SELECT student_id, grp, COUNT(*)::INTEGER AS run_length
  FROM ordered
  GROUP BY student_id, grp
),
best_run AS (
  SELECT student_id, MAX(run_length)::INTEGER AS best
  FROM run_counts
  GROUP BY student_id
)
UPDATE public.profiles p
SET
  current_streak = COALESCE(cr.run_length, 0),
  best_streak    = GREATEST(COALESCE(p.best_streak, 0), COALESCE(br.best, 0))
FROM (SELECT student_id FROM public.streak_records GROUP BY student_id) sr
LEFT JOIN current_run cr ON cr.student_id = sr.student_id
LEFT JOIN best_run br ON br.student_id = sr.student_id
WHERE p.id = sr.student_id;
