-- ============================================
-- CCHIC - SISTEMA DE CAJA CHICA
-- SQL COMPLETO Y SEGURO para Supabase
-- Se puede ejecutar múltiples veces sin problemas
-- ============================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#4da6ff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de personas (con todos los campos)
CREATE TABLE IF NOT EXISTS persons (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  last_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  identification TEXT,
  department TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Agregar columnas a persons si no existen (para tablas ya creadas)
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

-- Tabla de fondos (reposiciones)
CREATE TABLE IF NOT EXISTS funds (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de egresos/gastos
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  correspondent_to TEXT,
  executor TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  voucher_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_executor ON expenses(executor);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_funds_date ON funds(date DESC);

-- Función para actualizar updated_at automáticamente
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

-- Datos iniciales - Categorías
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

-- Datos iniciales - Personas
INSERT INTO persons (name, last_name, email, department) 
SELECT * FROM (VALUES
  ('Juan', 'Pérez', 'juan.perez@example.com', 'Administración'),
  ('María', 'García', 'maria.garcia@example.com', 'Ventas'),
  ('Carlos', 'López', 'carlos.lopez@example.com', 'Operaciones'),
  ('Ana', 'Martínez', 'ana.martinez@example.com', 'Recursos Humanos')
) AS v(name, last_name, email, department)
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE name = v.name AND last_name = v.last_name);

-- Fondo inicial
INSERT INTO funds (date, amount, notes, created_by) 
SELECT CURRENT_DATE, 10000.00, 'Fondo inicial del sistema', 'Sistema'
WHERE NOT EXISTS (
  SELECT 1 FROM funds 
  WHERE notes = 'Fondo inicial del sistema' 
  OR (date = CURRENT_DATE AND amount = 10000.00)
);

-- Vistas para reportes (CREATE OR REPLACE es seguro)
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

-- Habilitar Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS solo si no existen
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

-- ============================================
-- ✅ ¡LISTO! Base de datos configurada
-- Este SQL es seguro y se puede ejecutar múltiples veces
-- ============================================
