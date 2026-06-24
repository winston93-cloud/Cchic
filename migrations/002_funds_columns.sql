-- Columnas adicionales en funds (producción Supabase)
ALTER TABLE public.funds ADD COLUMN IF NOT EXISTS person_id BIGINT REFERENCES public.persons(id) ON DELETE SET NULL;
ALTER TABLE public.funds ADD COLUMN IF NOT EXISTS voucher_number TEXT;
CREATE INDEX IF NOT EXISTS idx_funds_person ON public.funds(person_id);
