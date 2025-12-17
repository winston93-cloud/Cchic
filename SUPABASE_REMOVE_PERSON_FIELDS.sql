-- ============================================
-- ELIMINAR CAMPOS DE LA TABLA PERSONS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Eliminar columnas de la tabla persons
ALTER TABLE persons DROP COLUMN IF EXISTS last_name;
ALTER TABLE persons DROP COLUMN IF EXISTS address;
ALTER TABLE persons DROP COLUMN IF EXISTS phone;
ALTER TABLE persons DROP COLUMN IF EXISTS email;
ALTER TABLE persons DROP COLUMN IF EXISTS department;

-- Verificar que las columnas se eliminaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'persons' 
ORDER BY ordinal_position;

-- ============================================
-- ✅ Columnas eliminadas exitosamente
-- Solo quedan: id, name, identification, active, created_at, updated_at
-- ============================================

