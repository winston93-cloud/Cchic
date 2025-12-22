-- =====================================================
-- TABLA: custom_periods (Períodos Personalizados)
-- =====================================================
-- Permite redefinir los límites de inicio/fin de cualquier mes

CREATE TABLE IF NOT EXISTS custom_periods (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  -- Constraint: Una sola definición activa por año-mes
  CONSTRAINT unique_active_period UNIQUE (year, month, active)
);

-- Validar que end_date sea mayor que start_date
ALTER TABLE custom_periods 
  ADD CONSTRAINT check_date_range 
  CHECK (end_date > start_date);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_custom_periods_year_month ON custom_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_custom_periods_active ON custom_periods(active);
CREATE INDEX IF NOT EXISTS idx_custom_periods_dates ON custom_periods(start_date, end_date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_periods_updated_at ON custom_periods;
CREATE TRIGGER custom_periods_updated_at
  BEFORE UPDATE ON custom_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_periods_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE custom_periods ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todas las operaciones
DROP POLICY IF EXISTS "Enable all for custom_periods" ON custom_periods;
CREATE POLICY "Enable all for custom_periods" 
  ON custom_periods 
  FOR ALL 
  USING (true);

-- =====================================================
-- FUNCIÓN: Obtener límites de un mes (personalizados o naturales)
-- =====================================================

CREATE OR REPLACE FUNCTION get_month_limits(p_year INTEGER, p_month INTEGER)
RETURNS TABLE(start_date DATE, end_date DATE, is_custom BOOLEAN) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_custom_exists BOOLEAN;
BEGIN
  -- Buscar período personalizado activo
  SELECT cp.start_date, cp.end_date, true
  INTO v_start_date, v_end_date, v_custom_exists
  FROM custom_periods cp
  WHERE cp.year = p_year 
    AND cp.month = p_month 
    AND cp.active = true
  LIMIT 1;

  -- Si no existe personalizado, usar límites naturales
  IF v_start_date IS NULL THEN
    v_start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
    v_custom_exists := false;
  END IF;

  RETURN QUERY SELECT v_start_date, v_end_date, v_custom_exists;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE EJEMPLO (Opcional)
-- =====================================================

-- Ejemplo: Enero 2026 va del 1 de enero al 2 de febrero
INSERT INTO custom_periods (year, month, start_date, end_date, notes, active) 
VALUES 
  (2026, 1, '2026-01-01', '2026-02-02', 'Período extendido para cierre contable', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CONSULTAS DE PRUEBA
-- =====================================================

-- Ver todos los períodos personalizados
-- SELECT * FROM custom_periods ORDER BY year DESC, month;

-- Obtener límites de enero 2026 (debería devolver el personalizado)
-- SELECT * FROM get_month_limits(2026, 1);

-- Obtener límites de febrero 2026 (debería devolver el natural)
-- SELECT * FROM get_month_limits(2026, 2);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

