-- Progress = (distinct attempted tickets / total tickets in course) * 100
-- A ticket counts as "complete" when attempted at least once (any status), not only when passed.
-- Recalculates on INSERT (new attempt) and UPDATE so enrollment progress_percent stays in sync.

CREATE OR REPLACE FUNCTION public.handle_enrollment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tickets    INTEGER;
  v_attempted_tickets INTEGER;
  v_new_progress     NUMERIC(5,2);
  v_course_id        UUID;
  v_total_sprints    INTEGER;
BEGIN
  -- Get course_id from enrollment
  SELECT course_id INTO v_course_id
  FROM public.enrollments WHERE id = NEW.enrollment_id;

  -- Count total tickets in the course
  SELECT COUNT(*) INTO v_total_tickets
  FROM public.tickets WHERE course_id = v_course_id;

  -- Count distinct tickets the student has attempted (any row in ticket_attempts, regardless of status)
  SELECT COUNT(DISTINCT ticket_id) INTO v_attempted_tickets
  FROM public.ticket_attempts
  WHERE enrollment_id = NEW.enrollment_id;

  -- Compute progress percentage (avoid division by zero)
  v_new_progress := CASE
    WHEN v_total_tickets = 0 THEN 0
    ELSE ROUND((v_attempted_tickets::NUMERIC / v_total_tickets) * 100, 2)
  END;

  -- Update enrollment progress
  UPDATE public.enrollments
  SET
    progress_percent = v_new_progress,
    status           = CASE WHEN v_new_progress >= 100 THEN 'completed' ELSE status END,
    completed_at     = CASE WHEN v_new_progress >= 100 THEN NOW() ELSE completed_at END
  WHERE id = NEW.enrollment_id;

  -- If course completed (all tickets attempted), issue certificate and trigger refund
  IF v_new_progress >= 100 THEN

    SELECT total_sprints INTO v_total_sprints
    FROM public.courses WHERE id = v_course_id;

    INSERT INTO public.certificates (student_id, course_id, enrollment_id, sprints_completed)
    VALUES (NEW.student_id, v_course_id, NEW.enrollment_id, v_total_sprints)
    ON CONFLICT (student_id, course_id) DO NOTHING;

    UPDATE public.payments
    SET
      refund_amount  = instructor_share_amount,
      payment_status = 'fully_refunded',
      refunded_at    = NOW()
    WHERE enrollment_id = NEW.enrollment_id
      AND payment_status = 'completed';

  END IF;

  RETURN NEW;
END;
$$;

-- Recalculate progress when a new attempt is created (ticket counted as attempted)
CREATE TRIGGER on_ticket_attempt_progress_insert
  AFTER INSERT ON public.ticket_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_progress();

-- Keep existing UPDATE trigger so progress stays in sync on any attempt change
-- (no change to trigger name or table)
