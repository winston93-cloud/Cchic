-- ============================================
-- CCHIC - SISTEMA DE CAJA CHICA
-- SQL para Supabase (PostgreSQL)
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

-- Tabla de personas
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

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar triggers si existen antes de crearlos
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_persons_updated_at ON persons;
DROP TRIGGER IF EXISTS update_funds_updated_at ON funds;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;

-- Crear triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales - Categorías
INSERT INTO categories (name, icon, color) VALUES
  ('Transporte', '🚗', '#FF6B6B'),
  ('Alimentación', '🍽️', '#4ECDC4'),
  ('Papelería', '📝', '#45B7D1'),
  ('Servicios', '🔧', '#96CEB4'),
  ('Mantenimiento', '🛠️', '#FFEAA7'),
  ('Capacitación', '📚', '#DFE6E9'),
  ('Otros', '📦', '#A29BFE')
ON CONFLICT (name) DO NOTHING;

-- Datos iniciales - Personas
INSERT INTO persons (name, last_name, email, department) VALUES
  ('Juan', 'Pérez', 'juan.perez@example.com', 'Administración'),
  ('María', 'García', 'maria.garcia@example.com', 'Ventas'),
  ('Carlos', 'López', 'carlos.lopez@example.com', 'Operaciones'),
  ('Ana', 'Martínez', 'ana.martinez@example.com', 'Recursos Humanos')
ON CONFLICT DO NOTHING;

-- Fondo inicial (solo si no existe)
INSERT INTO funds (date, amount, notes, created_by) 
SELECT CURRENT_DATE, 10000.00, 'Fondo inicial del sistema', 'Sistema'
WHERE NOT EXISTS (SELECT 1 FROM funds WHERE notes = 'Fondo inicial del sistema');

-- Vista para reporte de saldo
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

-- Vista para reportes por categoría
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

-- Vista para reportes por persona
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

-- Vista para reportes por persona y categoría
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

-- Habilitar Row Level Security (RLS) - Opcional, por seguridad
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permite todo por ahora, puedes restringir después)
-- Eliminar políticas si existen antes de crearlas
DROP POLICY IF EXISTS "Enable all for categories" ON categories;
DROP POLICY IF EXISTS "Enable all for persons" ON persons;
DROP POLICY IF EXISTS "Enable all for funds" ON funds;
DROP POLICY IF EXISTS "Enable all for expenses" ON expenses;

-- Crear políticas
CREATE POLICY "Enable all for categories" ON categories FOR ALL USING (true);
CREATE POLICY "Enable all for persons" ON persons FOR ALL USING (true);
CREATE POLICY "Enable all for funds" ON funds FOR ALL USING (true);
CREATE POLICY "Enable all for expenses" ON expenses FOR ALL USING (true);

-- ============================================
-- ¡LISTO! Base de datos configurada
-- ============================================

