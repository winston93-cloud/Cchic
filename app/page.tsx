'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import ReportsPanel from '@/components/ReportsPanel';
import PersonForm from '@/components/PersonForm';
import CategoryForm from '@/components/CategoryForm';
import ExecutorForm from '@/components/ExecutorForm';
import PeriodForm from '@/components/PeriodForm';
import FundForm from '@/components/FundForm';
import DeleteExpensesForm from '@/components/DeleteExpensesForm';
import MovementDetailReport from '@/components/MovementDetailReport';
import { Expense, Balance, Person } from '@/types';
import { supabase } from '@/lib/supabase';
import { getMonthLimitsFromString } from '@/lib/periods';

// Forzar rendering dinámico para evitar errores de build
export const dynamic = 'force-dynamic';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<Balance>({ totalFunds: 0, totalExpenses: 0, balance: 0 });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showExecutorForm, setShowExecutorForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [showFundForm, setShowFundForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showMovementReport, setShowMovementReport] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM (mes actual por defecto)
  );
  
  // Estados para menús desplegables
  const [showRegistrosMenu, setShowRegistrosMenu] = useState(false);
  const [showReportesMenu, setShowReportesMenu] = useState(false);
  
  // Referencias para detectar clics fuera
  const registrosMenuRef = useRef<HTMLDivElement>(null);
  const reportesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExpenses();
    fetchBalance();
  }, [selectedMonth]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (registrosMenuRef.current && !registrosMenuRef.current.contains(event.target as Node)) {
        setShowRegistrosMenu(false);
      }
      if (reportesMenuRef.current && !reportesMenuRef.current.contains(event.target as Node)) {
        setShowReportesMenu(false);
      }
    };

    if (showRegistrosMenu || showReportesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRegistrosMenu, showReportesMenu]);

  const fetchExpenses = async () => {
    try {
      // Obtener límites del mes (personalizados o naturales)
      const limits = await getMonthLimitsFromString(selectedMonth);
      const startDate = limits.startDate;
      const endDate = limits.endDate;

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
        created_at: exp.created_at,
        updated_at: exp.updated_at,
        category_name: exp.categories?.name,
        category_icon: exp.categories?.icon,
        category_color: exp.categories?.color,
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error al cargar egresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('v_balance')
        .select('*')
        .single();

      if (error) throw error;

      const balanceData = data as any;

      setBalance({
        totalFunds: Number(balanceData?.total_funds) || 0,
        totalExpenses: Number(balanceData?.total_expenses) || 0,
        balance: Number(balanceData?.balance) || 0,
      });
    } catch (error) {
      console.error('Error al cargar saldo:', error);
    }
  };

  const handleSaveExpense = async (expense: Partial<Expense>) => {
    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expense as any)
          .eq('id', editingExpense.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([{ ...expense, status: 'active' } as any]);

        if (error) throw error;
      }

      fetchExpenses();
      fetchBalance();
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error al guardar egreso:', error);
      alert('Error al guardar el egreso');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
    setShowRegistrosMenu(false);
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este egreso?')) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      fetchExpenses();
      fetchBalance();
    } catch (error) {
      console.error('Error al eliminar egreso:', error);
      alert('Error al eliminar el egreso');
    }
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
    setShowRegistrosMenu(false);
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="app-container">
      <motion.header 
        className="app-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-title">
          <div className="logo-icon">💰</div>
          <div>
            <h1>Servicios Generales</h1>
          </div>
        </div>
        <motion.div 
          className="balance-display"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="balance-label">SALDO ACTUAL</div>
          <div className={`balance-amount ${balance.balance < 0 ? 'negative' : ''}`}>
            {formatCurrency(balance.balance)}
          </div>
        </motion.div>
      </motion.header>

      <main className="main-content">
        <motion.div 
          className="control-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="toolbar">
            {/* Menú Archivo/Registros */}
            <div 
              className="dropdown" 
              ref={registrosMenuRef}
              onMouseEnter={() => {
                setShowRegistrosMenu(true);
                setShowReportesMenu(false);
              }}
              onMouseLeave={() => setShowRegistrosMenu(false)}
            >
              <motion.button
                className="btn btn-secondary dropdown-toggle"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>📁</span> Registros
                <span>{showRegistrosMenu ? '▲' : '▼'}</span>
              </motion.button>
              <AnimatePresence>
                {showRegistrosMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="dropdown-item" onClick={handleNewExpense}>
                      <span className="dropdown-item-icon">➕</span>
                      Registro de egreso
                    </div>
                    <div className="dropdown-item" onClick={() => {
                      setShowFundForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">💵</span>
                      Aumento de caja
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowDeleteForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">🗑️</span>
                      Eliminación de registros
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowFundForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">💵</span>
                      Aumento de caja
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowPersonForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">👤</span>
                      Persona
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowCategoryForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">🏷️</span>
                      Categorías
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowExecutorForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">👔</span>
                      Ejecutor
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => {
                      setShowPeriodForm(true);
                      setShowRegistrosMenu(false);
                    }}>
                      <span className="dropdown-item-icon">📅</span>
                      Períodos Personalizados
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menú Reportes */}
            <div 
              className="dropdown" 
              ref={reportesMenuRef}
              onMouseEnter={() => {
                setShowReportesMenu(true);
                setShowRegistrosMenu(false);
              }}
              onMouseLeave={() => setShowReportesMenu(false)}
            >
              <motion.button
                className="btn btn-primary dropdown-toggle"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>📊</span> Reportes
                <span>{showReportesMenu ? '▲' : '▼'}</span>
              </motion.button>
              <AnimatePresence>
                {showReportesMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="dropdown-item" onClick={() => { setShowMovementReport(true); setShowReportesMenu(false); }}>
                      <span className="dropdown-item-icon">📋</span>
                      Detalle de movimientos
                    </div>
                    <div className="dropdown-item" onClick={() => { setShowReports(true); setShowReportesMenu(false); }}>
                      <span className="dropdown-item-icon">👤</span>
                      Detalle por persona
                    </div>
                    <div className="dropdown-item" onClick={() => { setShowReports(true); setShowReportesMenu(false); }}>
                      <span className="dropdown-item-icon">📊</span>
                      Detalle por persona y categoría
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => alert('Función en desarrollo')}>
                      <span className="dropdown-item-icon">📋</span>
                      Lista de personas
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item" onClick={() => alert('Exportar a Excel en desarrollo')}>
                      <span className="dropdown-item-icon">📗</span>
                      Exportación a MS Excel
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón directo Nuevo Egreso - ROJO */}
            <motion.button
              className="btn btn-danger"
              onClick={handleNewExpense}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>➕</span> Nuevo Egreso
            </motion.button>

            {/* Botón Aumento de Caja - VERDE */}
            <motion.button
              className="btn btn-success"
              onClick={() => {
                setShowFundForm(true);
                setShowRegistrosMenu(false);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>💵</span> Aumento de Caja
            </motion.button>
          </div>

          {showReports ? (
            <ReportsPanel onClose={() => setShowReports(false)} />
          ) : (
            <>
              <motion.div 
                className="stats-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div 
                  className="stat-card"
                  whileHover={{ y: -8 }}
                  style={{ borderLeftColor: '#00E676' }}
                >
                  <div className="stat-label">💰 Total Fondos</div>
                  <div className="stat-value" style={{ color: '#00E676' }}>
                    {formatCurrency(balance.totalFunds)}
                  </div>
                </motion.div>
                <motion.div 
                  className="stat-card"
                  whileHover={{ y: -8 }}
                  style={{ borderLeftColor: '#FF1744' }}
                >
                  <div className="stat-label">💸 Total Egresos</div>
                  <div className="stat-value" style={{ color: '#FF1744' }}>
                    {formatCurrency(balance.totalExpenses)}
                  </div>
                </motion.div>
                <motion.div 
                  className="stat-card"
                  whileHover={{ y: -8 }}
                  style={{ borderLeftColor: '#00E5FF' }}
                >
                  <div className="stat-label">📊 Total Registros</div>
                  <div className="stat-value" style={{ color: '#00E5FF' }}>
                    {expenses.length}
                  </div>
                </motion.div>
              </motion.div>

              {/* Filtro por mes - Diseño bonito */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ 
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}>
                  📅
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Período
                  </label>
                  <div style={{ position: 'relative' }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const input = document.getElementById('month-picker') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      style={{
                        padding: '0.5rem 1.25rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'white',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>
                        {(() => {
                          const date = new Date(selectedMonth + '-15'); // Usar día 15 para evitar problemas de timezone
                          const monthName = date.toLocaleDateString('es-MX', { month: 'long' });
                          const year = date.toLocaleDateString('es-MX', { year: 'numeric' });
                          return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
                        })()}
                      </span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>▼</span>
                    </motion.div>
                    <input
                      id="month-picker"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        pointerEvents: 'none',
                        width: '1px',
                        height: '1px'
                      }}
                    />
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#00E5FF',
                    textShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
                  }}>
                    {expenses.length}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}>
                    Registros
                  </div>
                </motion.div>
              </motion.div>

              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                <ExpenseList
                  expenses={expenses}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                  formatCurrency={formatCurrency}
                />
              )}
            </>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {showExpenseForm && (
          <ExpenseForm
            expense={editingExpense}
            onSave={handleSaveExpense}
            onClose={() => {
              setShowExpenseForm(false);
              setEditingExpense(null);
            }}
          />
        )}
        {showPersonForm && (
          <PersonForm
            onClose={() => {
              setShowPersonForm(false);
            }}
          />
        )}
        {showCategoryForm && (
          <CategoryForm
            onClose={() => {
              setShowCategoryForm(false);
            }}
          />
        )}
        {showExecutorForm && (
          <ExecutorForm
            onClose={() => {
              setShowExecutorForm(false);
            }}
            onSave={() => {
              fetchExpenses();
            }}
          />
        )}
        {showPeriodForm && (
          <PeriodForm
            onClose={() => {
              setShowPeriodForm(false);
            }}
            onSave={() => {
              // Los períodos no afectan directamente a expenses, pero podríamos recargar
            }}
          />
        )}
        {showFundForm && (
          <FundForm
            onClose={() => {
              setShowFundForm(false);
            }}
            onUpdate={() => {
              fetchBalance();
            }}
          />
        )}
        {showDeleteForm && (
          <DeleteExpensesForm
            onClose={() => {
              setShowDeleteForm(false);
            }}
            onUpdate={() => {
              fetchExpenses();
              fetchBalance();
            }}
          />
        )}
        {showMovementReport && (
          <MovementDetailReport
            onClose={() => {
              setShowMovementReport(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
