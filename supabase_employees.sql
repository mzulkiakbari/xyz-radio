-- Create the employees table linked to auth.users
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  discord_id text,
  division text NOT NULL DEFAULT 'Staff', -- 'Direksi', 'HR', 'Marketing', 'Media', dll
  position text NOT NULL DEFAULT 'Staff', -- 'CEO', 'Head of HR', 'Staff', dll
  status text NOT NULL DEFAULT 'Active', -- 'Active', 'Resigned', 'Terminated'
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own employee record
CREATE POLICY "Users can view own employee record." 
  ON public.employees FOR SELECT 
  USING ( auth.uid() = id );

-- Allow Direksi or HR to view all employee records
CREATE POLICY "HR and Direksi can view all employee records." 
  ON public.employees FOR SELECT 
  USING ( 
    EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.id = auth.uid() AND (e.division = 'Direksi' OR e.division = 'HR')
    )
  );

-- Function to handle updating the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the handle_updated_at function
CREATE TRIGGER set_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
