-- Add optional sprint assignment to course_materials so instructors can assign
-- materials to a specific sprint (for AI ticket generation context).
ALTER TABLE public.course_materials
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_materials_sprint_id ON public.course_materials(sprint_id);

COMMENT ON COLUMN public.course_materials.sprint_id IS 'When set, this material is associated with the given sprint (e.g. for AI ticket generation).';
