'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Expense, Category } from '@/types';
import { supabase } from '@/lib/supabase';

interface ExpenseFormProps {
  expense: Expense | null;
  onSave: (expense: Partial<Expense>) => void;
  onClose: () => void;
}

export default function ExpenseForm({ expense, onSave, onClose }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    correspondent_to: expense?.correspondent_to || '',
    executor: expense?.executor || '',
    category_id: expense?.category_id || '',
    amount: expense?.amount || '',
    voucher_number: expense?.voucher_number || '',
    notes: expense?.notes || '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount as string),
      category_id: formData.category_id ? parseInt(formData.category_id as string) : undefined,
    });
  };

  return (
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
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {expense ? '✏️ Modificar Egreso' : '➕ Nuevo Egreso'}
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

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">📅 Fecha *</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">💵 Monto *</label>
              <input
                type="number"
                name="amount"
                className="form-input"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">📧 Corresponde a</label>
            <input
              type="text"
              name="correspondent_to"
              className="form-input"
              value={formData.correspondent_to}
              onChange={handleChange}
              placeholder="Persona o departamento"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">👤 Ejecutor del Gasto *</label>
              <input
                type="text"
                name="executor"
                className="form-input"
                value={formData.executor}
                onChange={handleChange}
                placeholder="Nombre del ejecutor"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏷️ Categoría</label>
              <select
                name="category_id"
                className="form-select"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🧾 # Comprobante</label>
            <input
              type="text"
              name="voucher_number"
              className="form-input"
              value={formData.voucher_number}
              onChange={handleChange}
              placeholder="Número de comprobante"
            />
          </div>

          <div className="form-group">
            <label className="form-label">📝 Notas</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Descripción del gasto..."
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid var(--gray-200)' }}>
            <motion.button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancelar
            </motion.button>
            <motion.button 
              type="submit" 
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {expense ? '💾 Actualizar' : '✨ Guardar'} Egreso
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
