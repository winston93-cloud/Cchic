-- ============================================
-- ACTUALIZAR TABLA FUNDS - AGREGAR PERSONA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Agregar columna person_id a funds
ALTER TABLE funds ADD COLUMN IF NOT EXISTS person_id BIGINT REFERENCES persons(id) ON DELETE SET NULL;

-- Índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_funds_person ON funds(person_id);

-- Verificar las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'funds' 
ORDER BY ordinal_position;

-- ============================================
-- ✅ Tabla funds actualizada
-- Ahora cada reposición tiene una persona asignada
-- ============================================

