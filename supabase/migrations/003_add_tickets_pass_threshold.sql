-- Add optional per-ticket pass threshold for AI grading (0-100). Null = use default.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS pass_threshold_percent SMALLINT
  CHECK (pass_threshold_percent IS NULL OR (pass_threshold_percent >= 0 AND pass_threshold_percent <= 100));

COMMENT ON COLUMN public.tickets.pass_threshold_percent IS 'Minimum AI score (0-100) to pass. Null uses PASS_THRESHOLD_DEFAULT env or 70.';
