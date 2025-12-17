-- ============================================
-- ACTUALIZACIÓN: Agregar campos a tabla persons
-- Ejecutar este SQL en Supabase si ya tienes la tabla creada
-- ============================================

-- Agregar nuevas columnas a la tabla persons
ALTER TABLE persons 
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS identification TEXT;

-- Actualizar datos existentes si es necesario
UPDATE persons 
SET last_name = SPLIT_PART(name, ' ', 2)
WHERE last_name IS NULL AND name LIKE '% %';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'persons' 
ORDER BY ordinal_position;

