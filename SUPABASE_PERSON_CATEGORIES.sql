-- ============================================
-- CREAR RELACIÓN PERSONA-CATEGORÍAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de relación muchos a muchos
CREATE TABLE IF NOT EXISTS person_categories (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT REFERENCES persons(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(person_id, category_id)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_person_categories_person ON person_categories(person_id);
CREATE INDEX IF NOT EXISTS idx_person_categories_category ON person_categories(category_id);

-- Habilitar RLS
ALTER TABLE person_categories ENABLE ROW LEVEL SECURITY;

-- Política RLS
DROP POLICY IF EXISTS "Enable all for person_categories" ON person_categories;
CREATE POLICY "Enable all for person_categories" ON person_categories FOR ALL USING (true);

-- ============================================
-- ✅ Tabla de relación creada
-- Ahora las personas pueden tener múltiples categorías
-- ============================================

