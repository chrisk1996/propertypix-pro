-- Add language column to propertypix_users table
ALTER TABLE public.propertypix_users 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'de' CHECK (language IN ('de', 'en'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_propertypix_users_language ON public.propertypix_users(language);

-- Comment
COMMENT ON COLUMN public.propertypix_users.language IS 'User preferred language: de (German) or en (English)';
