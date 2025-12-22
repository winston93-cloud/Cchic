import { supabase } from './supabase';

export interface MonthLimits {
  startDate: string;
  endDate: string;
  isCustom: boolean;
}

/**
 * Obtiene los límites (inicio y fin) de un mes específico
 * Si existe un período personalizado activo, usa esos límites
 * Si no, usa los límites naturales del mes
 * 
 * @param year - Año (ejemplo: 2026)
 * @param month - Mes (1-12)
 * @returns Objeto con startDate, endDate e isCustom
 */
export async function getMonthLimits(year: number, month: number): Promise<MonthLimits> {
  try {
    // Buscar período personalizado activo
    const { data, error } = await supabase
      .from('custom_periods')
      .select('start_date, end_date')
      .eq('year', year)
      .eq('month', month)
      .eq('active', true)
      .limit(1)
      .single();

    // Si existe período personalizado, usar esos límites
    if (data && !error) {
      return {
        startDate: data.start_date,
        endDate: data.end_date,
        isCustom: true
      };
    }

    // Si no existe, calcular límites naturales del mes
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último día del mes

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isCustom: false
    };
  } catch (error) {
    console.error('Error al obtener límites del mes:', error);
    
    // En caso de error, devolver límites naturales
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isCustom: false
    };
  }
}

/**
 * Obtiene los límites desde un string YYYY-MM
 * 
 * @param yearMonth - String en formato "YYYY-MM" (ejemplo: "2026-01")
 * @returns Objeto con startDate, endDate e isCustom
 */
export async function getMonthLimitsFromString(yearMonth: string): Promise<MonthLimits> {
  const [year, month] = yearMonth.split('-').map(Number);
  return getMonthLimits(year, month);
}

/**
 * Verifica si un mes tiene período personalizado
 * 
 * @param year - Año
 * @param month - Mes (1-12)
 * @returns true si tiene período personalizado activo
 */
export async function hasCustomPeriod(year: number, month: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('custom_periods')
      .select('id')
      .eq('year', year)
      .eq('month', month)
      .eq('active', true)
      .limit(1);

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('Error al verificar período personalizado:', error);
    return false;
  }
}

/**
 * Obtiene el nombre del mes en español
 * 
 * @param month - Mes (1-12)
 * @returns Nombre del mes en español
 */
export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
}

