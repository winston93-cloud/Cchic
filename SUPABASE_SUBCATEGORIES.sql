-- =====================================================
-- SUBCATEGORÍAS (por categoría)
-- Ejecutar en Supabase después de tener categories y expenses
-- =====================================================

-- Tabla de subcategorías (cada una pertenece a una categoría)
CREATE TABLE IF NOT EXISTS subcategories (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#4da6ff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_name ON subcategories(name);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(active);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subcategories_updated_at ON subcategories;
CREATE TRIGGER subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_subcategories_updated_at();

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for subcategories" ON subcategories;
CREATE POLICY "Enable all for subcategories"
  ON subcategories FOR ALL USING (true);

-- Columna subcategory_id en expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subcategory_id BIGINT REFERENCES subcategories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_subcategory ON expenses(subcategory_id);

-- Recrear vista expense_details para incluir subcategoría
-- (DROP necesario porque REPLACE no permite cambiar número/orden de columnas)
DROP VIEW IF EXISTS expense_details;

CREATE VIEW expense_details AS
SELECT
  e.id,
  e.date,
  e.amount,
  e.correspondent_to,
  e.executor,
  e.executor_id,
  e.voucher_number,
  e.notes,
  e.status,
  e.created_at,
  e.updated_at,
  e.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  e.subcategory_id,
  s.name AS subcategory_name,
  s.icon AS subcategory_icon,
  s.color AS subcategory_color,
  e.correspondent_to AS person_name,
  NULL::text AS person_identification,
  ex.name AS executor_name,
  ex.identification AS executor_identification
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN subcategories s ON e.subcategory_id = s.id
LEFT JOIN executors ex ON e.executor_id = ex.id;

-- =====================================================
-- FIN
-- =====================================================
