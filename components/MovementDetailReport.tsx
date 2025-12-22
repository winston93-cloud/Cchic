'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

interface MovementDetailReportProps {
  onClose: () => void;
}

export default function MovementDetailReport({ onClose }: MovementDetailReportProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [movements, setMovements] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    average: 0,
    max: 0,
    min: 0
  });

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories (name, icon, color)
        `)
        .eq('status', 'active')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = (data || []).map((exp: any) => ({
        id: exp.id,
        date: exp.date,
        correspondent_to: exp.correspondent_to,
        executor: exp.executor,
        category_id: exp.category_id,
        amount: exp.amount,
        voucher_number: exp.voucher_number,
        notes: exp.notes,
        status: exp.status,
        category_name: exp.categories?.name,
        category_icon: exp.categories?.icon,
        category_color: exp.categories?.color,
      }));

      setMovements(formattedExpenses);

      // Calcular estadísticas
      const amounts = formattedExpenses.map(m => m.amount);
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      const count = amounts.length;
      const average = count > 0 ? total / count : 0;
      const max = count > 0 ? Math.max(...amounts) : 0;
      const min = count > 0 ? Math.min(...amounts) : 0;

      setStats({ total, count, average, max, min });
      setShowReport(true);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      alert('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <motion.div 
        className="modal-overlay" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="modal" 
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ 
            maxWidth: showReport ? '95vw' : '600px', 
            maxHeight: '95vh', 
            overflowY: 'auto',
            transition: 'max-width 0.3s ease'
          }}
        >
          <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Detalle de Movimientos
            </h2>
            <motion.button 
              className="modal-close" 
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          {!showReport ? (
            // FORMULARIO DE FECHAS
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem'
                }}
              >
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '1.5rem', 
                  color: 'var(--primary-blue)',
                  fontWeight: '600'
                }}>
                  📅 Selecciona el rango de fechas
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      🟢 Desde
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input"
                      style={{ 
                        padding: '0.8rem', 
                        fontSize: '0.95rem',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      🔴 Hasta
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input"
                      style={{ 
                        padding: '0.8rem', 
                        fontSize: '0.95rem',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchMovements}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading 
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? '⏳ Generando...' : '📊 Generar Reporte'}
                </motion.button>
              </motion.div>

              <div style={{
                padding: '1.5rem',
                background: 'rgba(0, 229, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 229, 255, 0.2)'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
                  💡 <strong>Tip:</strong> Selecciona el rango de fechas para ver un reporte detallado de todos los movimientos registrados en ese período.
                </div>
              </div>
            </div>
          ) : (
            // REPORTE GENERADO
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ padding: '0 1.5rem 1.5rem' }}
              >
                {/* Header del reporte */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        📊 Reporte de Movimientos
                      </h3>
                      <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                        Del {formatDate(startDate)} al {formatDate(endDate)}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ Imprimir
                    </motion.button>
                  </div>
                </div>

                {/* Estadísticas */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
                      padding: '1.2rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 229, 255, 0.2)'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      💰 Total
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                      {formatCurrency(stats.total)}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
                      padding: '1.2rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(124, 77, 255, 0.2)'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      📋 Movimientos
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#7C4DFF' }}>
                      {stats.count}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 200, 83, 0.1) 100%)',
                      padding: '1.2rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 230, 118, 0.2)'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      📊 Promedio
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#00E676' }}>
                      {formatCurrency(stats.average)}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 23, 68, 0.1) 0%, rgba(211, 47, 47, 0.1) 100%)',
                      padding: '1.2rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 23, 68, 0.2)'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      ⬆️ Mayor
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#FF1744' }}>
                      {formatCurrency(stats.max)}
                    </div>
                  </motion.div>
                </div>

                {/* Tabla de movimientos */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Fecha</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Recibo</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Concepto</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Categoría</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Corresponde a</th>
                          <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600' }}>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((mov, index) => (
                          <motion.tr
                            key={mov.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            style={{
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                              background: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'white'
                            }}
                            whileHover={{ background: 'rgba(102, 126, 234, 0.05)' }}
                          >
                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                              {formatDate(mov.date)}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: '600' }}>
                              {mov.voucher_number}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                              {mov.notes || '-'}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: mov.category_color || '#4da6ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.9rem'
                                }}>
                                  {mov.category_icon || '📦'}
                                </span>
                                {mov.category_name || 'Sin categoría'}
                              </div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                              {mov.correspondent_to || '-'}
                            </td>
                            <td style={{ 
                              padding: '1rem', 
                              fontSize: '1rem', 
                              fontWeight: '700',
                              textAlign: 'right',
                              color: 'var(--primary-blue)'
                            }}>
                              {formatCurrency(mov.amount)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botones de acción */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '1.5rem',
                  justifyContent: 'space-between'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReport(false)}
                    style={{
                      flex: 1,
                      padding: '0.9rem',
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'var(--gray-700)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ← Nueva Consulta
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '0.9rem',
                      background: 'linear-gradient(135deg, #00E5FF 0%, #1976D2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

