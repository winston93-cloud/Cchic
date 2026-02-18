'use client';

import { motion } from 'framer-motion';
import { Expense } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number) => string;
}

export default function ExpenseList({ expenses, onEdit, onDelete, formatCurrency }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <motion.div 
        className="empty-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="empty-icon">📋</div>
        <p className="empty-message">No hay egresos registrados</p>
        <p style={{ color: 'var(--gray-700)' }}>
          Comienza agregando un nuevo egreso para ver la magia ✨
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="table-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>📅 Fecha</th>
            <th>📧 Corresponde a</th>
            <th>👤 Ejecutor</th>
            <th>🏷️ Categoría</th>
            <th>💵 Monto</th>
            <th>🧾 Comprobante</th>
            <th>⚙️ Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, index) => (
            <motion.tr
              key={expense.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <td>
                <strong>
                {new Date(expense.date).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
                </strong>
              </td>
              <td>{expense.correspondent_to || '-'}</td>
              <td>
                <strong style={{ color: 'var(--primary-blue)' }}>
                  {expense.executor}
                </strong>
              </td>
              <td>
                {expense.category_name ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span 
                      className="badge badge-primary" 
                      style={{ background: expense.category_color || 'var(--gradient-primary)', alignSelf: 'flex-start' }}
                    >
                      {expense.category_icon} {expense.category_name}
                    </span>
                    {expense.subcategory_name && (
                      <span 
                        className="badge badge-primary" 
                        style={{ 
                          background: expense.subcategory_color || 'var(--gray-400)', 
                          fontSize: '0.8rem',
                          alignSelf: 'flex-start',
                          opacity: 0.95
                        }}
                      >
                        {expense.subcategory_icon} {expense.subcategory_name}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="badge badge-secondary">Sin categoría</span>
                )}
              </td>
              <td style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FF1744' }}>
                {formatCurrency(expense.amount)}
              </td>
              <td>{expense.voucher_number || '-'}</td>
              <td>
                <div className="table-actions">
                  <motion.button
                    className="btn btn-icon btn-primary"
                    onClick={() => onEdit(expense)}
                    title="Editar"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✏️
                  </motion.button>
                  <motion.button
                    className="btn btn-icon btn-danger"
                    onClick={() => onDelete(expense.id)}
                    title="Eliminar"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    🗑️
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
