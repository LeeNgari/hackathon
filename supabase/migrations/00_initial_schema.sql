-- =============================================================================
-- Fieldwork Platform — Initial Database Schema
-- Provider: Supabase (PostgreSQL)
-- Auth: Supabase email/password (auth.users managed by Supabase)
-- =============================================================================

-- =============================================================================
-- SECTION 1: ENUM TYPES
-- =============================================================================

CREATE TYPE public.user_role AS ENUM (
  'student',
  'instructor',
  'admin'
);

CREATE TYPE public.course_category AS ENUM (
  'Tech',
  'Business',
  'Design',
  'Finance'
);

CREATE TYPE public.course_difficulty AS ENUM (
  'Beginner',
  'Intermediate',
  'Advanced'
);

CREATE TYPE public.course_status AS ENUM (
  'draft',
  'under_review',
  'live',
  'archived'
);

CREATE TYPE public.material_file_type AS ENUM (
  'pdf',
  'video',
  'doc',
  'link',
  'other'
);

CREATE TYPE public.ticket_type AS ENUM (
  'Build',
  'Analyze',
  'Present',
  'Research'
);

-- coding: student submits code/technical solution
-- report: student submits a written report / what-would-you-do response
CREATE TYPE public.ticket_challenge_type AS ENUM (
  'coding',
  'report'
);

CREATE TYPE public.enrollment_status AS ENUM (
  'active',
  'completed',
  'dropped'
);

CREATE TYPE public.attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'passed',
  'failed'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'completed',
  'partially_refunded',
  'fully_refunded'
);


-- =============================================================================
-- SECTION 2: UTILITY FUNCTION — updated_at auto-stamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- SECTION 3: TABLE DEFINITIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 profiles
-- Extends auth.users. Created automatically via trigger on signup.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                public.user_role NOT NULL DEFAULT 'student',
  full_name           TEXT        NOT NULL DEFAULT '',
  avatar_url          TEXT,

  -- Student-specific fields
  degree              TEXT,
  institution         TEXT,
  current_streak      INTEGER     NOT NULL DEFAULT 0,
  best_streak         INTEGER     NOT NULL DEFAULT 0,

  -- Instructor-specific fields
  professional_title  TEXT,
  bio                 TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.2 courses
-- ---------------------------------------------------------------------------
CREATE TABLE public.courses (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title                 TEXT        NOT NULL,
  description           TEXT,
  category              public.course_category  NOT NULL,
  difficulty            public.course_difficulty NOT NULL DEFAULT 'Beginner',
  fee_amount            NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
  status                public.course_status    NOT NULL DEFAULT 'draft',
  company_partner       TEXT,        -- optional sponsoring company name
  thumbnail_url         TEXT,
  ai_generated_tickets  BOOLEAN     NOT NULL DEFAULT FALSE,
  total_sprints         INTEGER     NOT NULL DEFAULT 0,
  total_tickets         INTEGER     NOT NULL DEFAULT 0,
  avg_rating            NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.3 course_materials
-- Files/links uploaded by the instructor; ingested by AI to generate tickets.
-- ---------------------------------------------------------------------------
CREATE TABLE public.course_materials (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  file_url     TEXT,       -- Supabase Storage URL
  file_type    public.material_file_type NOT NULL DEFAULT 'other',
  order_index  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.4 sprints
-- Logical groupings of tickets within a course (e.g. "Sprint 1: AWS Core").
-- ---------------------------------------------------------------------------
CREATE TABLE public.sprints (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  order_index  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, order_index)
);

CREATE TRIGGER trg_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.5 tickets
-- Simulated real-world job case scenarios. Belong to a sprint.
-- challenge_type distinguishes coding submissions from written reports.
-- ---------------------------------------------------------------------------
CREATE TABLE public.tickets (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id                 UUID        NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  course_id                 UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title                     TEXT        NOT NULL,
  description               TEXT,
  type                      public.ticket_type          NOT NULL DEFAULT 'Build',
  challenge_type            public.ticket_challenge_type NOT NULL DEFAULT 'report',
  duration_estimate_minutes INTEGER     NOT NULL DEFAULT 30,
  is_urgent                 BOOLEAN     NOT NULL DEFAULT FALSE,
  order_index               INTEGER     NOT NULL DEFAULT 0,
  ai_generated              BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sprint_id, order_index)
);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.6 ticket_scenarios
-- One scenario per ticket. Contains the full problem description the student
-- reads before starting. The AI generates this from course materials.
-- ---------------------------------------------------------------------------
CREATE TABLE public.ticket_scenarios (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        UUID  NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
  scenario_text    TEXT  NOT NULL,  -- the narrative/context shown to student
  context          TEXT,            -- additional background info
  expected_outcome TEXT,            -- what a correct solution looks like (not shown to student)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ticket_scenarios_updated_at
  BEFORE UPDATE ON public.ticket_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.7 ticket_deliverables
-- Ordered list of items the student must address to complete a ticket.
-- e.g. "Identify the misconfigured listener port"
-- ---------------------------------------------------------------------------
CREATE TABLE public.ticket_deliverables (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID  NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  description  TEXT  NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 3.8 enrollments
-- Created when a student pays and joins a course.
-- progress_percent is updated as ticket attempts are passed.
-- ---------------------------------------------------------------------------
CREATE TABLE public.enrollments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id         UUID        NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  status            public.enrollment_status NOT NULL DEFAULT 'active',
  progress_percent  NUMERIC(5, 2) NOT NULL DEFAULT 0.00
                    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_sprint_id UUID        REFERENCES public.sprints(id) ON DELETE SET NULL,
  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.9 payments
-- Simulated payment record. One per enrollment.
-- Platform keeps 10%; instructor receives 90%.
-- Upon course completion (100% progress), student is refunded their 90%.
-- ---------------------------------------------------------------------------
CREATE TABLE public.payments (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id               UUID        NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  enrollment_id           UUID        NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  amount_paid             NUMERIC(10, 2) NOT NULL,
  platform_fee_amount     NUMERIC(10, 2) NOT NULL, -- 10% of amount_paid
  instructor_share_amount NUMERIC(10, 2) NOT NULL, -- 90% of amount_paid (held, paid out on completion)
  refund_amount           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_status          public.payment_status NOT NULL DEFAULT 'pending',
  simulated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure fee split adds up correctly
  CONSTRAINT chk_fee_split CHECK (
    ROUND(platform_fee_amount + instructor_share_amount, 2) = ROUND(amount_paid, 2)
  ),
  CONSTRAINT chk_refund_lte_instructor_share CHECK (
    refund_amount <= instructor_share_amount
  )
);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.10 ticket_attempts
-- A student's attempt at a ticket. Multiple attempts allowed; only the latest
-- passing attempt is used for progress calculation.
-- ---------------------------------------------------------------------------
CREATE TABLE public.ticket_attempts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ticket_id         UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
  enrollment_id     UUID        NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status            public.attempt_status NOT NULL DEFAULT 'in_progress',
  -- For report-type challenges
  submission_text   TEXT,
  -- For coding-type challenges
  submission_code   TEXT,
  -- Additional file attachments stored in Supabase Storage (array of {url, name, size})
  submission_files  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  -- AI evaluation results
  ai_score          SMALLINT    CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_review_text    TEXT,       -- narrative review returned to student
  time_spent_minutes INTEGER,
  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ticket_attempts_updated_at
  BEFORE UPDATE ON public.ticket_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.11 deliverable_submissions
-- Per-deliverable response within a ticket attempt. The AI scores each one.
-- ---------------------------------------------------------------------------
CREATE TABLE public.deliverable_submissions (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id     UUID     NOT NULL REFERENCES public.ticket_attempts(id) ON DELETE CASCADE,
  deliverable_id UUID     NOT NULL REFERENCES public.ticket_deliverables(id) ON DELETE CASCADE,
  content        TEXT     NOT NULL DEFAULT '',
  ai_score       SMALLINT CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_feedback    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, deliverable_id)
);

CREATE TRIGGER trg_deliverable_submissions_updated_at
  BEFORE UPDATE ON public.deliverable_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3.12 certificates
-- Issued automatically when a student completes a course (progress = 100%).
-- ---------------------------------------------------------------------------
CREATE TABLE public.certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id         UUID        NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  enrollment_id     UUID        NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  sprints_completed INTEGER     NOT NULL DEFAULT 0,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_url   TEXT,       -- generated PDF/image URL (optional, can be generated later)
  UNIQUE (student_id, course_id)
);


-- ---------------------------------------------------------------------------
-- 3.13 streak_records
-- One row per student per calendar day they complete at least one ticket.
-- Used to compute current_streak and best_streak on the profiles table.
-- ---------------------------------------------------------------------------
CREATE TABLE public.streak_records (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date               DATE    NOT NULL,
  tickets_completed  INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, date)
);


-- ---------------------------------------------------------------------------
-- 3.14 platform_settings
-- Key/value store for global platform configuration.
-- ---------------------------------------------------------------------------
CREATE TABLE public.platform_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL,
  description TEXT,
  updated_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 4: INDEXES
-- =============================================================================

-- profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- courses
CREATE INDEX idx_courses_instructor_id  ON public.courses(instructor_id);
CREATE INDEX idx_courses_status         ON public.courses(status);
CREATE INDEX idx_courses_category       ON public.courses(category);
CREATE INDEX idx_courses_difficulty     ON public.courses(difficulty);

-- course_materials
CREATE INDEX idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX idx_course_materials_order     ON public.course_materials(course_id, order_index);

-- sprints
CREATE INDEX idx_sprints_course_id ON public.sprints(course_id);
CREATE INDEX idx_sprints_order     ON public.sprints(course_id, order_index);

-- tickets
CREATE INDEX idx_tickets_sprint_id   ON public.tickets(sprint_id);
CREATE INDEX idx_tickets_course_id   ON public.tickets(course_id);
CREATE INDEX idx_tickets_type        ON public.tickets(type);
CREATE INDEX idx_tickets_challenge   ON public.tickets(challenge_type);
CREATE INDEX idx_tickets_order       ON public.tickets(sprint_id, order_index);

-- ticket_scenarios
CREATE INDEX idx_ticket_scenarios_ticket_id ON public.ticket_scenarios(ticket_id);

-- ticket_deliverables
CREATE INDEX idx_ticket_deliverables_ticket_id ON public.ticket_deliverables(ticket_id);

-- enrollments
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id  ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status     ON public.enrollments(status);

-- payments
CREATE INDEX idx_payments_student_id    ON public.payments(student_id);
CREATE INDEX idx_payments_course_id     ON public.payments(course_id);
CREATE INDEX idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX idx_payments_status        ON public.payments(payment_status);

-- ticket_attempts
CREATE INDEX idx_ticket_attempts_student_id    ON public.ticket_attempts(student_id);
CREATE INDEX idx_ticket_attempts_ticket_id     ON public.ticket_attempts(ticket_id);
CREATE INDEX idx_ticket_attempts_enrollment_id ON public.ticket_attempts(enrollment_id);
CREATE INDEX idx_ticket_attempts_status        ON public.ticket_attempts(status);

-- deliverable_submissions
CREATE INDEX idx_deliverable_submissions_attempt_id     ON public.deliverable_submissions(attempt_id);
CREATE INDEX idx_deliverable_submissions_deliverable_id ON public.deliverable_submissions(deliverable_id);

-- certificates
CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_course_id  ON public.certificates(course_id);

-- streak_records
CREATE INDEX idx_streak_records_student_id ON public.streak_records(student_id);
CREATE INDEX idx_streak_records_date       ON public.streak_records(student_id, date DESC);


-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_scenarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_deliverables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings     ENABLE ROW LEVEL SECURITY;

-- Helper: get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- =============================================================================
-- RLS: profiles
-- =============================================================================

-- Anyone authenticated can read any profile (needed for course pages showing instructor info)
CREATE POLICY "profiles: authenticated users can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile (e.g. changing roles)
CREATE POLICY "profiles: admin full access"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: courses
-- =============================================================================

-- Public (unauthenticated) can read live courses
CREATE POLICY "courses: public can read live"
  ON public.courses FOR SELECT
  USING (status = 'live');

-- Authenticated users can read all non-draft courses (for browsing/enrolled courses)
CREATE POLICY "courses: authenticated can read non-draft"
  ON public.courses FOR SELECT
  TO authenticated
  USING (status != 'draft' OR instructor_id = auth.uid());

-- Instructors can manage their own courses
CREATE POLICY "courses: instructor manages own"
  ON public.courses FOR ALL
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Admins have full access
CREATE POLICY "courses: admin full access"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: course_materials
-- =============================================================================

-- Enrolled students and the course instructor can read materials
CREATE POLICY "course_materials: enrolled students and instructor can read"
  ON public.course_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_id AND e.student_id = auth.uid()
    )
  );

-- Instructors can manage materials for their courses
CREATE POLICY "course_materials: instructor manages own"
  ON public.course_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "course_materials: admin full access"
  ON public.course_materials FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: sprints
-- =============================================================================

-- Anyone can read sprints of live courses (for course preview)
CREATE POLICY "sprints: public can read live course sprints"
  ON public.sprints FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'live')
  );

-- Instructors can manage sprints of their own courses
CREATE POLICY "sprints: instructor manages own"
  ON public.sprints FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- Admins have full access
CREATE POLICY "sprints: admin full access"
  ON public.sprints FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: tickets
-- =============================================================================

-- Enrolled students can read tickets for courses they're enrolled in
CREATE POLICY "tickets: enrolled students can read"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_id AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  );

-- Instructors can manage tickets in their courses
CREATE POLICY "tickets: instructor manages own"
  ON public.tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- Admins have full access
CREATE POLICY "tickets: admin full access"
  ON public.tickets FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: ticket_scenarios
-- =============================================================================

-- Enrolled students and instructors can read scenarios
CREATE POLICY "ticket_scenarios: enrolled students and instructor can read"
  ON public.ticket_scenarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.enrollments e ON e.course_id = t.course_id
      WHERE t.id = ticket_id AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  );

-- Instructors can manage scenarios for tickets in their courses
CREATE POLICY "ticket_scenarios: instructor manages own"
  ON public.ticket_scenarios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "ticket_scenarios: admin full access"
  ON public.ticket_scenarios FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: ticket_deliverables
-- =============================================================================

-- Enrolled students and instructors can read deliverables
CREATE POLICY "ticket_deliverables: enrolled students and instructor can read"
  ON public.ticket_deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.enrollments e ON e.course_id = t.course_id
      WHERE t.id = ticket_id AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  );

-- Instructors can manage deliverables for tickets in their courses
CREATE POLICY "ticket_deliverables: instructor manages own"
  ON public.ticket_deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "ticket_deliverables: admin full access"
  ON public.ticket_deliverables FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: enrollments
-- =============================================================================

-- Students can only see their own enrollments
CREATE POLICY "enrollments: students read own"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own enrollment (done via server-side function typically)
CREATE POLICY "enrollments: students insert own"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own enrollment (e.g. progress updates)
CREATE POLICY "enrollments: students update own"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Instructors can read enrollments for their courses
CREATE POLICY "enrollments: instructor reads for own courses"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- Admins have full access
CREATE POLICY "enrollments: admin full access"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: payments
-- =============================================================================

-- Students can only see their own payment records
CREATE POLICY "payments: students read own"
  ON public.payments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own payment (simulated; validated server-side)
CREATE POLICY "payments: students insert own"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Instructors can read payment records for their courses
CREATE POLICY "payments: instructor reads for own courses"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- Admins have full access
CREATE POLICY "payments: admin full access"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: ticket_attempts
-- =============================================================================

-- Students can only see and manage their own attempts
CREATE POLICY "ticket_attempts: students manage own"
  ON public.ticket_attempts FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Instructors can read attempts for tickets in their courses
CREATE POLICY "ticket_attempts: instructor reads for own courses"
  ON public.ticket_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.courses c ON c.id = t.course_id
      WHERE t.id = ticket_id AND c.instructor_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "ticket_attempts: admin full access"
  ON public.ticket_attempts FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: deliverable_submissions
-- =============================================================================

-- Students can manage their own deliverable submissions
CREATE POLICY "deliverable_submissions: students manage own"
  ON public.deliverable_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ticket_attempts ta
      WHERE ta.id = attempt_id AND ta.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ticket_attempts ta
      WHERE ta.id = attempt_id AND ta.student_id = auth.uid()
    )
  );

-- Instructors can read submissions for their courses
CREATE POLICY "deliverable_submissions: instructor reads for own courses"
  ON public.deliverable_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ticket_attempts ta
      JOIN public.tickets t ON t.id = ta.ticket_id
      JOIN public.courses c ON c.id = t.course_id
      WHERE ta.id = attempt_id AND c.instructor_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "deliverable_submissions: admin full access"
  ON public.deliverable_submissions FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: certificates
-- =============================================================================

-- Anyone authenticated can read any certificate (public proof of work)
CREATE POLICY "certificates: authenticated can read"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only the system (via admin/service role) inserts certificates
CREATE POLICY "certificates: admin full access"
  ON public.certificates FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: streak_records
-- =============================================================================

-- Students can read their own streak records
CREATE POLICY "streak_records: students read own"
  ON public.streak_records FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own streak records
CREATE POLICY "streak_records: students insert own"
  ON public.streak_records FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own streak records
CREATE POLICY "streak_records: students update own"
  ON public.streak_records FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Admins have full access
CREATE POLICY "streak_records: admin full access"
  ON public.streak_records FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- =============================================================================
-- RLS: platform_settings
-- =============================================================================

-- All authenticated users can read platform settings (e.g. to display default fee)
CREATE POLICY "platform_settings: authenticated can read"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can modify platform settings
CREATE POLICY "platform_settings: admin manages"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');


-- =============================================================================
-- SECTION 6: TRIGGERS & FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 6.1 Auto-create profile on new Supabase Auth user signup
-- The email from auth.users is stored for convenience; role defaults to student.
-- Instructors/admins can be promoted via admin dashboard (UPDATE profiles SET role).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 6.2 Update streak records and profile streak counters when a ticket attempt
-- is marked as passed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_ticket_passed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          DATE := CURRENT_DATE;
  v_yesterday      DATE := CURRENT_DATE - INTERVAL '1 day';
  v_current_streak INTEGER;
  v_best_streak    INTEGER;
  v_had_yesterday  BOOLEAN;
BEGIN
  -- Only act when status transitions to 'passed'
  IF NEW.status = 'passed' AND (OLD.status IS DISTINCT FROM 'passed') THEN

    -- Upsert today's streak record (increment if already exists for today)
    INSERT INTO public.streak_records (student_id, date, tickets_completed)
    VALUES (NEW.student_id, v_today, 1)
    ON CONFLICT (student_id, date)
    DO UPDATE SET tickets_completed = streak_records.tickets_completed + 1;

    -- Recalculate current streak: count consecutive days going back from today
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

    -- Fetch best streak from profiles to compare
    SELECT best_streak INTO v_best_streak
    FROM public.profiles WHERE id = NEW.student_id;

    -- Update the profile streak counters
    UPDATE public.profiles
    SET
      current_streak = v_current_streak,
      best_streak    = GREATEST(v_best_streak, v_current_streak)
    WHERE id = NEW.student_id;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_attempt_passed
  AFTER UPDATE ON public.ticket_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_passed();


-- ---------------------------------------------------------------------------
-- 6.3 Recalculate enrollment progress_percent when a ticket attempt is passed.
-- Progress = (distinct passed tickets / total tickets in course) * 100
-- Also marks the enrollment as completed and issues a certificate if at 100%.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_enrollment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tickets    INTEGER;
  v_passed_tickets   INTEGER;
  v_new_progress     NUMERIC(5,2);
  v_course_id        UUID;
  v_total_sprints    INTEGER;
BEGIN
  IF NEW.status = 'passed' AND (OLD.status IS DISTINCT FROM 'passed') THEN

    -- Get course_id from enrollment
    SELECT course_id INTO v_course_id
    FROM public.enrollments WHERE id = NEW.enrollment_id;

    -- Count total tickets in the course
    SELECT COUNT(*) INTO v_total_tickets
    FROM public.tickets WHERE course_id = v_course_id;

    -- Count distinct tickets the student has passed in this enrollment
    SELECT COUNT(DISTINCT ticket_id) INTO v_passed_tickets
    FROM public.ticket_attempts
    WHERE enrollment_id = NEW.enrollment_id AND status = 'passed';

    -- Compute progress percentage (avoid division by zero)
    v_new_progress := CASE
      WHEN v_total_tickets = 0 THEN 0
      ELSE ROUND((v_passed_tickets::NUMERIC / v_total_tickets) * 100, 2)
    END;

    -- Update enrollment progress
    UPDATE public.enrollments
    SET
      progress_percent = v_new_progress,
      status           = CASE WHEN v_new_progress >= 100 THEN 'completed' ELSE status END,
      completed_at     = CASE WHEN v_new_progress >= 100 THEN NOW() ELSE completed_at END
    WHERE id = NEW.enrollment_id;

    -- If course completed, issue certificate and trigger refund
    IF v_new_progress >= 100 THEN

      SELECT total_sprints INTO v_total_sprints
      FROM public.courses WHERE id = v_course_id;

      -- Issue certificate (ignore if already exists)
      INSERT INTO public.certificates (student_id, course_id, enrollment_id, sprints_completed)
      VALUES (NEW.student_id, v_course_id, NEW.enrollment_id, v_total_sprints)
      ON CONFLICT (student_id, course_id) DO NOTHING;

      -- Issue simulated refund (90% of amount_paid back to student)
      UPDATE public.payments
      SET
        refund_amount  = instructor_share_amount,
        payment_status = 'fully_refunded',
        refunded_at    = NOW()
      WHERE enrollment_id = NEW.enrollment_id
        AND payment_status = 'completed';

    END IF;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_attempt_progress
  AFTER UPDATE ON public.ticket_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_progress();


-- ---------------------------------------------------------------------------
-- 6.4 Simulate payment on enrollment insert.
-- Computes and stores the platform fee (10%) and instructor share (90%).
-- In production this would be replaced by a real payment webhook.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_enrollment_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_amount            NUMERIC(10,2);
  v_platform_fee_percent  NUMERIC(5,2);
  v_platform_fee          NUMERIC(10,2);
  v_instructor_share      NUMERIC(10,2);
BEGIN
  -- Fetch course fee
  SELECT fee_amount INTO v_fee_amount
  FROM public.courses WHERE id = NEW.course_id;

  -- Fetch platform fee percent from settings (default 10 if not set)
  SELECT COALESCE(value::NUMERIC, 10) INTO v_platform_fee_percent
  FROM public.platform_settings WHERE key = 'platform_fee_percent';

  v_platform_fee     := ROUND(v_fee_amount * (v_platform_fee_percent / 100), 2);
  v_instructor_share := ROUND(v_fee_amount - v_platform_fee, 2);

  INSERT INTO public.payments (
    student_id,
    course_id,
    enrollment_id,
    amount_paid,
    platform_fee_amount,
    instructor_share_amount,
    refund_amount,
    payment_status,
    simulated_at
  ) VALUES (
    NEW.student_id,
    NEW.course_id,
    NEW.id,
    v_fee_amount,
    v_platform_fee,
    v_instructor_share,
    0.00,
    'completed',
    NOW()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_enrollment_created_payment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_payment();


-- =============================================================================
-- SECTION 7: SEED DATA — platform_settings
-- =============================================================================

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('default_course_fee',       '1000',  'Default course fee in KES'),
  ('platform_fee_percent',     '10',    'Percentage of course fee kept by the platform'),
  ('instructor_share_percent', '90',    'Percentage of course fee paid out to instructor on completion'),
  ('refund_on_completion',     'true',  'Whether students receive a 90% refund upon course completion'),
  ('currency',                 'KES',   'Platform currency code');
