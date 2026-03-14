-- =============================================================================
-- Activity table: one row per student activity event (e.g. ticket completed).
-- Populated by handle_ticket_passed() when a ticket attempt is marked passed.
-- =============================================================================

CREATE TABLE public.activity (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type  TEXT        NOT NULL,
  reference_type TEXT        NOT NULL,
  reference_id   UUID        NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_student_created ON public.activity(student_id, created_at DESC);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- Students can read their own activity only
CREATE POLICY "activity: students read own"
  ON public.activity FOR SELECT
  USING (student_id = auth.uid());

-- Inserts come from handle_ticket_passed (SECURITY DEFINER); no user INSERT policy

-- Grant table access for anon/authenticated (RLS still applies)
GRANT SELECT ON public.activity TO anon;
GRANT SELECT ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;

-- =============================================================================
-- Update handle_ticket_passed to insert into activity when a ticket is passed.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_ticket_passed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          DATE := CURRENT_DATE;
  v_current_streak INTEGER;
  v_best_streak    INTEGER;
BEGIN
  IF NEW.status = 'passed' AND (OLD.status IS DISTINCT FROM 'passed') THEN

    -- Upsert today's streak record
    INSERT INTO public.streak_records (student_id, date, tickets_completed)
    VALUES (NEW.student_id, v_today, 1)
    ON CONFLICT (student_id, date)
    DO UPDATE SET tickets_completed = streak_records.tickets_completed + 1;

    -- Recalculate current streak
    SELECT COUNT(*)::INTEGER
    INTO v_current_streak
    FROM (
      SELECT date,
             date - (ROW_NUMBER() OVER (ORDER BY date DESC))::INTEGER AS grp
      FROM public.streak_records
      WHERE student_id = NEW.student_id
        AND date <= v_today
    ) t
    WHERE grp = (
      SELECT date - (ROW_NUMBER() OVER (ORDER BY date DESC))::INTEGER
      FROM public.streak_records
      WHERE student_id = NEW.student_id
        AND date = v_today
    );

    SELECT best_streak INTO v_best_streak
    FROM public.profiles WHERE id = NEW.student_id;

    UPDATE public.profiles
    SET
      current_streak = v_current_streak,
      best_streak    = GREATEST(v_best_streak, v_current_streak)
    WHERE id = NEW.student_id;

    -- Record activity for feed / analytics
    INSERT INTO public.activity (student_id, activity_type, reference_type, reference_id, metadata)
    VALUES (
      NEW.student_id,
      'ticket_completed',
      'ticket_attempt',
      NEW.id,
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'new_streak', v_current_streak
      )
    );

  END IF;

  RETURN NEW;
END;
$$;
