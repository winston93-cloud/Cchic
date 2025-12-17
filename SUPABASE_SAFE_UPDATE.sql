-- ============================================
-- CCHIC - ACTUALIZACIÓN SEGURA (Sin DROP)
-- Para bases de datos que ya tienen tablas creadas
-- ============================================

-- Agregar columnas faltantes a persons (si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'persons' AND column_name = 'last_name') THEN
    ALTER TABLE persons ADD COLUMN last_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'persons' AND column_name = 'address') THEN
    ALTER TABLE persons ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'persons' AND column_name = 'phone') THEN
    ALTER TABLE persons ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'persons' AND column_name = 'identification') THEN
    ALTER TABLE persons ADD COLUMN identification TEXT;
  END IF;
END $$;

-- Crear función de trigger (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers solo si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_persons_updated_at') THEN
    CREATE TRIGGER update_persons_updated_at 
      BEFORE UPDATE ON persons
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_funds_updated_at') THEN
    CREATE TRIGGER update_funds_updated_at 
      BEFORE UPDATE ON funds
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_expenses_updated_at') THEN
    CREATE TRIGGER update_expenses_updated_at 
      BEFORE UPDATE ON expenses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Crear o reemplazar vistas (seguro, no afecta datos)
CREATE OR REPLACE VIEW v_balance AS
SELECT 
  COALESCE(SUM(f.amount), 0) as total_funds,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(f.amount), 0) - COALESCE(SUM(e.amount), 0) as balance
FROM 
  funds f
  FULL OUTER JOIN expenses e ON true
WHERE 
  e.status = 'active' OR e.status IS NULL;

CREATE OR REPLACE VIEW v_expenses_by_category AS
SELECT 
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  COUNT(e.id) as count,
  COALESCE(SUM(e.amount), 0) as total,
  COALESCE(AVG(e.amount), 0) as average
FROM 
  categories c
  LEFT JOIN expenses e ON c.id = e.category_id AND e.status = 'active'
GROUP BY c.id, c.name, c.icon, c.color
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_expenses_by_person AS
SELECT 
  e.executor,
  COUNT(e.id) as count,
  COALESCE(SUM(e.amount), 0) as total,
  COALESCE(AVG(e.amount), 0) as average
FROM 
  expenses e
WHERE 
  e.status = 'active'
GROUP BY e.executor
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_expenses_by_person_category AS
SELECT 
  e.executor,
  c.name as category_name,
  c.icon as category_icon,
  COUNT(e.id) as count,
  COALESCE(SUM(e.amount), 0) as total,
  COALESCE(AVG(e.amount), 0) as average
FROM 
  expenses e
  LEFT JOIN categories c ON e.category_id = c.id
WHERE 
  e.status = 'active'
GROUP BY e.executor, c.name, c.icon
ORDER BY e.executor, total DESC;

-- Crear políticas solo si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                 WHERE schemaname = 'public' 
                 AND tablename = 'categories' 
                 AND policyname = 'Enable all for categories') THEN
    CREATE POLICY "Enable all for categories" ON categories FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                 WHERE schemaname = 'public' 
                 AND tablename = 'persons' 
                 AND policyname = 'Enable all for persons') THEN
    CREATE POLICY "Enable all for persons" ON persons FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                 WHERE schemaname = 'public' 
                 AND tablename = 'funds' 
                 AND policyname = 'Enable all for funds') THEN
    CREATE POLICY "Enable all for funds" ON funds FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
                 WHERE schemaname = 'public' 
                 AND tablename = 'expenses' 
                 AND policyname = 'Enable all for expenses') THEN
    CREATE POLICY "Enable all for expenses" ON expenses FOR ALL USING (true);
  END IF;
END $$;

-- Insertar datos iniciales solo si no existen
INSERT INTO categories (name, icon, color) 
SELECT * FROM (VALUES
  ('Transporte', '🚗', '#FF6B6B'),
  ('Alimentación', '🍽️', '#4ECDC4'),
  ('Papelería', '📝', '#45B7D1'),
  ('Servicios', '🔧', '#96CEB4'),
  ('Mantenimiento', '🛠️', '#FFEAA7'),
  ('Capacitación', '📚', '#DFE6E9'),
  ('Otros', '📦', '#A29BFE')
) AS v(name, icon, color)
ON CONFLICT (name) DO NOTHING;

-- Fondo inicial solo si no existe
INSERT INTO funds (date, amount, notes, created_by) 
SELECT CURRENT_DATE, 10000.00, 'Fondo inicial del sistema', 'Sistema'
WHERE NOT EXISTS (
  SELECT 1 FROM funds 
  WHERE notes = 'Fondo inicial del sistema' 
  OR (date = CURRENT_DATE AND amount = 10000.00)
);

-- ============================================
-- ✅ ACTUALIZACIÓN SEGURA COMPLETADA
-- No se eliminó nada, solo se agregó lo necesario
-- ============================================

