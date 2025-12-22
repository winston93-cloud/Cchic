'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '@/types';
import { supabase } from '@/lib/supabase';
import { getMonthLimitsFromString } from '@/lib/periods';

interface DeleteExpensesFormProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function DeleteExpensesForm({ onClose, onUpdate }: DeleteExpensesFormProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // Obtener límites del mes (personalizados o naturales)
      const limits = await getMonthLimitsFromString(selectedMonth);
      const startDate = limits.startDate;
      const endDate = limits.endDate;

      console.log('🔍 Filtrando egresos:', { 
        selectedMonth, 
        startDate, 
        endDate, 
        isCustom: limits.isCustom 
      });

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

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log(`✅ Registros encontrados: ${data?.length || 0}`);

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
        created_at: exp.created_at,
        updated_at: exp.updated_at,
        category_name: exp.categories?.name,
        category_icon: exp.categories?.icon,
        category_color: exp.categories?.color,
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error al cargar egresos:', error);
      showNotification('❌ Error al cargar egresos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(expenses.map(exp => exp.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: number, checked: boolean) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    }
  };

  const handleDelete = async () => {
    if (selectedExpenses.length === 0) {
      showNotification('❌ Selecciona al menos un registro');
      return;
    }

    const confirmMsg = selectedExpenses.length === 1
      ? '¿Estás seguro de eliminar este registro?'
      : `¿Estás seguro de eliminar ${selectedExpenses.length} registros?`;

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'cancelled' })
        .in('id', selectedExpenses);

      if (error) throw error;

      showNotification(`✅ ${selectedExpenses.length} registro(s) eliminado(s)`);
      setSelectedExpenses([]);
      fetchExpenses();
      onUpdate();
    } catch (error) {
      console.error('Error al eliminar egresos:', error);
      showNotification('❌ Error al eliminar registros');
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
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalSelected = expenses
    .filter(exp => selectedExpenses.includes(exp.id))
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      {/* Notificación flotante */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed',
              top: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: notification.includes('❌') ? '#EF4444' : '#10B981',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              zIndex: 9999,
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

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
          style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>🗑️ Eliminación de Registros</h2>
            <motion.button 
              className="modal-close" 
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          {/* Filtro por mes */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
              📅 Filtrar por mes
            </label>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem', width: '250px' }}
            />
          </div>

          {/* Información de selección */}
          {selectedExpenses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{selectedExpenses.length}</strong> registro(s) seleccionado(s)
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                Total: {formatCurrency(totalSelected)}
              </div>
            </motion.div>
          )}

          {/* Tabla de egresos */}
          <div style={{ 
            border: '1px solid var(--gray-300)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <div style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Cargando registros...</div>
              </div>
            ) : expenses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                No hay registros en este mes
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem'
                }}>
                  <thead style={{ 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    color: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'center', width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Recibo</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Persona</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Categoría</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, index) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        style={{
                          borderBottom: '1px solid var(--gray-200)',
                          background: selectedExpenses.includes(expense.id) 
                            ? 'rgba(102, 126, 234, 0.1)' 
                            : index % 2 === 0 ? 'white' : 'var(--gray-50)',
                          cursor: 'pointer'
                        }}
                        whileHover={{ background: 'rgba(102, 126, 234, 0.05)' }}
                        onClick={() => handleSelectExpense(expense.id, !selectedExpenses.includes(expense.id))}
                      >
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(expense.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectExpense(expense.id, e.target.checked);
                            }}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>{formatDate(expense.date)}</td>
                        <td style={{ padding: '0.75rem' }}>{expense.voucher_number || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{expense.executor}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {expense.category_icon && (
                            <span style={{ marginRight: '0.5rem' }}>{expense.category_icon}</span>
                          )}
                          {expense.category_name || '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                          {formatCurrency(expense.amount)}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          maxWidth: '200px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {expense.notes || '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="modal-footer" style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            justifyContent: 'space-between', 
            marginTop: '0.75rem', 
            paddingTop: '0.75rem', 
            borderTop: '2px solid var(--gray-200)' 
          }}>
            <div>
              {expenses.length > 0 && (
                <div style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                  Total registros: <strong>{expenses.length}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <motion.button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem' }}
              >
                Cancelar
              </motion.button>
              <motion.button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={selectedExpenses.length === 0}
                whileHover={{ scale: selectedExpenses.length > 0 ? 1.05 : 1 }}
                whileTap={{ scale: selectedExpenses.length > 0 ? 0.95 : 1 }}
                style={{ 
                  padding: '0.7rem 1.5rem', 
                  fontSize: '0.9rem',
                  opacity: selectedExpenses.length === 0 ? 0.5 : 1,
                  cursor: selectedExpenses.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ Eliminar Seleccionados ({selectedExpenses.length})
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

