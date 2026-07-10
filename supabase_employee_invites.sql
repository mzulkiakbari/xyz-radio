-- 1. Create employee_invites table
CREATE TABLE IF NOT EXISTS public.employee_invites (
  discord_id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect table with RLS (only service role can access)
ALTER TABLE public.employee_invites ENABLE ROW LEVEL SECURITY;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_discord_user() 
RETURNS TRIGGER AS $$
DECLARE
  did text;
  inv_name text;
BEGIN
  -- Ekstrak Discord ID dari raw_user_meta_data
  -- Biasanya discord oauth akan menyimpan id di 'provider_id' atau 'sub'
  did := NEW.raw_user_meta_data->>'sub';
  
  -- Cek apakah discord_id ini ada di tabel employee_invites
  SELECT name INTO inv_name FROM public.employee_invites WHERE discord_id = did;
  
  IF inv_name IS NOT NULL THEN
    -- Jika ada, otomatis masukkan mereka ke tabel employees sebagai Staff
    -- Gunakan ON CONFLICT DO NOTHING agar tidak error jika id sudah ada
    INSERT INTO public.employees (id, name, discord_id, division, position, status, is_admin)
    VALUES (NEW.id, inv_name, did, 'Staff', 'Staff', 'Active', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Hapus antrean invite agar bersih
    DELETE FROM public.employee_invites WHERE discord_id = did;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to auth.users (Menangani pendaftar baru maupun yang login ulang)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_discord_user();
