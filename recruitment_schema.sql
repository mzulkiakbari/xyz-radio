-- ==========================================
-- RECRUITMENT SYSTEM SUPABASE SCHEMA
-- ==========================================

-- 1. Create Divisions Table
CREATE TABLE IF NOT EXISTS public.divisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_open boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default divisions
INSERT INTO public.divisions (name, is_open) 
VALUES 
  ('Marketing', false), 
  ('Media', false), 
  ('HR', false), 
  ('Staff', false)
ON CONFLICT (name) DO NOTHING;

-- Setup RLS for divisions
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Divisions are viewable by everyone" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Divisions can be updated by HR and Execs" ON public.divisions FOR ALL USING ( public.is_hr_or_exec() );


-- 2. Create Recruitment Applications Table
CREATE TABLE IF NOT EXISTS public.recruitment_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id text NOT NULL,
  discord_username text,
  name text NOT NULL,
  division text NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, received, interview, assesment_stage, pass
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS for applications
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applications viewable by HR and Execs" ON public.recruitment_applications FOR SELECT USING ( public.is_hr_or_exec() );
CREATE POLICY "Applications updatable by HR and Execs" ON public.recruitment_applications FOR UPDATE USING ( public.is_hr_or_exec() );
-- Insert allowed by service role only (so bot can insert, we don't need policy for service_role)

-- Trigger for updated_at
CREATE TRIGGER set_recruitment_apps_updated_at
BEFORE UPDATE ON public.recruitment_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- 3. Create Recruitment Settings Table
CREATE TABLE IF NOT EXISTS public.recruitment_settings (
  id integer PRIMARY KEY DEFAULT 1,
  apply_message jsonb DEFAULT '{"content": "Apply now!"}',
  modal_title text DEFAULT 'Formulir Pendaftaran',
  custom_inputs jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO public.recruitment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Setup RLS for settings
ALTER TABLE public.recruitment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by HR and Execs" ON public.recruitment_settings FOR SELECT USING ( public.is_hr_or_exec() );
CREATE POLICY "Settings updatable by HR and Execs" ON public.recruitment_settings FOR UPDATE USING ( public.is_hr_or_exec() );

-- Trigger for updated_at
CREATE TRIGGER set_recruitment_settings_updated_at
BEFORE UPDATE ON public.recruitment_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
