-- Add starter_code for coding-type tickets (pre-filled code in the editor).
ALTER TABLE public.ticket_scenarios
  ADD COLUMN IF NOT EXISTS starter_code TEXT;

COMMENT ON COLUMN public.ticket_scenarios.starter_code IS 'Pre-filled code for coding challenges; shown in the lesson editor.';
