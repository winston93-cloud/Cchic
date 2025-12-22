-- =====================================================
-- TABLA: executors (Ejecutores del Gasto)
-- =====================================================

-- Crear tabla de ejecutores
CREATE TABLE IF NOT EXISTS executors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  identification TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_executors_name ON executors(name);
CREATE INDEX IF NOT EXISTS idx_executors_active ON executors(active);
CREATE INDEX IF NOT EXISTS idx_executors_identification ON executors(identification);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_executors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS executors_updated_at ON executors;
CREATE TRIGGER executors_updated_at
  BEFORE UPDATE ON executors
  FOR EACH ROW
  EXECUTE FUNCTION update_executors_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE executors ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones (ajustar según necesidades de seguridad)
DROP POLICY IF EXISTS "Enable all for executors" ON executors;
CREATE POLICY "Enable all for executors" 
  ON executors 
  FOR ALL 
  USING (true);

-- =====================================================
-- ACTUALIZAR TABLA expenses
-- =====================================================

-- Agregar columna executor_id a expenses (si no existe)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS executor_id BIGINT REFERENCES executors(id) ON DELETE SET NULL;

-- Índice para executor_id
CREATE INDEX IF NOT EXISTS idx_expenses_executor ON expenses(executor_id);

-- =====================================================
-- VISTA ACTUALIZADA: expense_details
-- =====================================================

CREATE OR REPLACE VIEW expense_details AS
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
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  p.name as person_name,
  p.identification as person_identification,
  ex.name as executor_name,
  ex.identification as executor_identification
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN persons p ON e.correspondent_to = p.id
LEFT JOIN executors ex ON e.executor_id = ex.id;

-- =====================================================
-- DATOS INICIALES (Opcional)
-- =====================================================

-- Insertar algunos ejecutores de ejemplo
INSERT INTO executors (name, identification) 
VALUES 
  ('Juan Pérez', 'EJE-001'),
  ('María García', 'EJE-002'),
  ('Carlos López', 'EJE-003')
ON CONFLICT (identification) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

