'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Report } from '@/types';
import { supabase } from '@/lib/supabase';

interface ReportsPanelProps {
  onClose: () => void;
}

export default function ReportsPanel({ onClose }: ReportsPanelProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'person-category'>('category');
  const [reportData, setReportData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const view = activeTab === 'category' 
        ? 'v_expenses_by_category' 
        : 'v_expenses_by_person_category';

      const { data, error } = await supabase
        .from(view)
        .select('*');

      if (error) throw error;
      setReportData(data || []);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
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

  return (
    <motion.div 
      className="fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 800, flex: 1, minWidth: '200px' }}>
          📊 Reportes y Análisis
        </h2>
        <motion.button 
          className="btn btn-outline" 
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver
        </motion.button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <motion.button
          className={`btn ${activeTab === 'category' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('category')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🏷️ Por Categoría
        </motion.button>
        <motion.button
          className={`btn ${activeTab === 'person-category' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('person-category')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          👤 Por Persona y Categoría
        </motion.button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <p className="empty-message">No hay datos para mostrar</p>
        </div>
      ) : (
        <motion.div 
          className="table-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <table className="data-table">
            <thead>
              <tr>
                {activeTab === 'person-category' && <th>👤 Ejecutor</th>}
                <th>🏷️ Categoría</th>
                <th>📊 Cantidad</th>
                <th>💰 Total</th>
                <th>📈 Promedio</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {activeTab === 'person-category' && (
                    <td>
                      <strong style={{ color: 'var(--primary-blue)' }}>
                        {row.executor}
                      </strong>
                    </td>
                  )}
                  <td>
                    <span 
                      className="badge badge-primary"
                      style={{ 
                        background: row.category_color || 'var(--gradient-primary)' 
                      }}
                    >
                      {row.category_icon || '📦'} {row.category_name || 'Sin categoría'}
                    </span>
                  </td>
                  <td>
                    <strong>{row.count}</strong>
                  </td>
                  <td style={{ fontWeight: 700, color: '#FF1744', fontSize: '1.1rem' }}>
                    {formatCurrency(row.total)}
                  </td>
                  <td style={{ color: 'var(--accent-cyan)' }}>
                    {formatCurrency(row.average)}
                  </td>
                </motion.tr>
              ))}
              <tr style={{ background: 'var(--gradient-primary)', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                <td colSpan={activeTab === 'person-category' ? 2 : 1}>
                  <strong>TOTAL GENERAL</strong>
                </td>
                <td>
                  <strong>{reportData.reduce((sum, row) => sum + row.count, 0)}</strong>
                </td>
                <td>
                  <strong>{formatCurrency(reportData.reduce((sum, row) => sum + row.total, 0))}</strong>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
