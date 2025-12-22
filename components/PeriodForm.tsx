'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface CustomPeriod {
  id: number;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  notes?: string;
  active: boolean;
}

interface PeriodFormProps {
  onClose: () => void;
  onSave: () => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PeriodForm({ onClose, onSave }: PeriodFormProps) {
  const [periods, setPeriods] = useState<CustomPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<CustomPeriod | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPeriods();
  }, [filterYear]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_periods')
        .select('*')
        .eq('year', filterYear)
        .eq('active', true)
        .order('month');
      
      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error('Error al cargar períodos:', error);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleNew = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Calcular límites naturales del mes actual
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    setSelectedPeriod(null);
    setFormData({
      year: currentYear,
      month: currentMonth,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleYearMonthChange = (field: 'year' | 'month', value: number) => {
    const newYear = field === 'year' ? value : formData.year;
    const newMonth = field === 'month' ? value : formData.month;
    
    // Calcular límites naturales del nuevo mes
    const startDate = new Date(newYear, newMonth - 1, 1);
    const endDate = new Date(newYear, newMonth, 0);
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      showNotification('❌ La fecha final debe ser mayor que la inicial');
      return;
    }
    
    // Verificar si ya existe un período para ese año-mes (excepto si estamos editando)
    try {
      const { data: existing, error: checkError } = await supabase
        .from('custom_periods')
        .select('id')
        .eq('year', formData.year)
        .eq('month', formData.month)
        .eq('active', true)
        .neq('id', selectedPeriod?.id || 0);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        showNotification(`❌ Ya existe un período para ${MONTHS[formData.month - 1]} ${formData.year}`);
        return;
      }
    } catch (error: any) {
      console.error('Error al verificar duplicados:', error);
      showNotification('❌ Error al verificar duplicados');
      return;
    }
    
    try {
      if (selectedPeriod?.id) {
        // Actualizar
        const { error } = await supabase
          .from('custom_periods')
          .update({
            year: formData.year,
            month: formData.month,
            start_date: formData.start_date,
            end_date: formData.end_date,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPeriod.id);

        if (error) throw error;
        showNotification('✅ Período actualizado exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('custom_periods')
          .insert([{
            year: formData.year,
            month: formData.month,
            start_date: formData.start_date,
            end_date: formData.end_date,
            notes: formData.notes,
            active: true
          }]);

        if (error) throw error;
        showNotification('✅ Período creado exitosamente');
      }
      
      await fetchPeriods();
      handleNew();
      onSave();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      if (error.message.includes('unique_active_period')) {
        showNotification('❌ Ya existe un período activo para ese mes');
      } else {
        showNotification('❌ Error al guardar: ' + error.message);
      }
    }
  };

  const handleDeleteClick = () => {
    if (!selectedPeriod?.id) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    
    if (!selectedPeriod?.id) return;
    
    try {
      const { error } = await supabase
        .from('custom_periods')
        .update({ active: false })
        .eq('id', selectedPeriod.id);

      if (error) throw error;
      
      showNotification('✅ Período eliminado exitosamente');
      await fetchPeriods();
      handleNew();
      onSave();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      showNotification('❌ Error al eliminar: ' + error.message);
    }
  };

  const handleSelectPeriod = (period: CustomPeriod) => {
    setSelectedPeriod(period);
    setFormData({
      year: period.year,
      month: period.month,
      start_date: period.start_date,
      end_date: period.end_date,
      notes: period.notes || ''
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 10000,
              fontSize: '0.95rem',
              fontWeight: '500'
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
          style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.4rem' }}>📅 Períodos Personalizados</h2>
            <motion.button 
              className="modal-close" 
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', padding: '0 1rem 1rem' }}>
            {/* FORMULARIO */}
            <div>
              <form onSubmit={handleSave}>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--primary-blue)' }}>
                    {selectedPeriod ? '✏️ Editar Período' : '✨ Nuevo Período'}
                  </h3>

                  {/* Año y Mes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                        📆 Año
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.year}
                        onChange={(e) => handleYearMonthChange('year', parseInt(e.target.value))}
                        min="2020"
                        max="2100"
                        required
                        style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                        📅 Mes
                      </label>
                      <select
                        className="form-input"
                        value={formData.month}
                        onChange={(e) => handleYearMonthChange('month', parseInt(e.target.value))}
                        required
                        style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                      >
                        {MONTHS.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                      🟢 Fecha Inicio
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                      style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                      🔴 Fecha Final
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                      style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                    />
                  </div>

                  {/* Duración calculada */}
                  {formData.start_date && formData.end_date && (
                    <div style={{
                      background: 'rgba(0, 229, 255, 0.1)',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      marginBottom: '0.8rem',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: 'var(--primary-blue)'
                    }}>
                      ⏱️ Duración: {getDaysDifference(formData.start_date, formData.end_date)} días
                    </div>
                  )}

                  {/* Notas */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
                      📝 Notas (opcional)
                    </label>
                    <textarea
                      className="form-input"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Razón para personalizar este período..."
                      rows={2}
                      style={{ padding: '0.6rem', fontSize: '0.9rem', resize: 'none' }}
                    />
                  </div>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleNew}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✨ Nuevo
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '0.65rem',
                      background: 'linear-gradient(135deg, #00E5FF 0%, #1976D2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    💾 Guardar
                  </motion.button>
                  
                  {selectedPeriod && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleDeleteClick}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        background: 'linear-gradient(135deg, #FF1744 0%, #D32F2F 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </motion.button>
                  )}
                </div>
              </form>
            </div>

            {/* LISTA DE PERÍODOS */}
            <div>
              <div style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Año:</label>
                <input
                  type="number"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  min="2020"
                  max="2100"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-300)',
                    fontSize: '0.9rem',
                    width: '100px'
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--primary-blue)' }}>
                  📋 Períodos Definidos ({periods.length})
                </h3>

                {periods.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--gray-500)',
                    fontSize: '0.9rem'
                  }}>
                    No hay períodos personalizados para {filterYear}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {periods.map((period) => (
                      <motion.div
                        key={period.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => handleSelectPeriod(period)}
                        style={{
                          background: selectedPeriod?.id === period.id 
                            ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(25, 118, 210, 0.2) 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          padding: '0.8rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: selectedPeriod?.id === period.id 
                            ? '2px solid var(--accent-cyan)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-blue)', marginBottom: '0.3rem' }}>
                              📅 {MONTHS[period.month - 1]} {period.year}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.2rem' }}>
                              🟢 {formatDate(period.start_date)} → 🔴 {formatDate(period.end_date)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                              ⏱️ {getDaysDifference(period.start_date, period.end_date)} días
                            </div>
                            {period.notes && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                color: 'var(--gray-500)', 
                                marginTop: '0.3rem',
                                fontStyle: 'italic'
                              }}>
                                💬 {period.notes}
                              </div>
                            )}
                          </div>
                          {selectedPeriod?.id === period.id && (
                            <div style={{ fontSize: '1.2rem' }}>✓</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 1rem 1rem' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: 'rgba(0, 0, 0, 0.05)',
                color: 'var(--gray-700)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem'
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '450px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  marginBottom: '0.5rem',
                  color: '#FF1744',
                  fontWeight: '700'
                }}>
                  ¿Eliminar período?
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--gray-600)',
                  lineHeight: '1.5'
                }}>
                  Se eliminarán los límites personalizados de<br />
                  <strong>{selectedPeriod && MONTHS[selectedPeriod.month - 1]} {selectedPeriod?.year}</strong>
                  <br /><br />
                  Se usarán los límites naturales del mes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: 'var(--gray-700)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: 'linear-gradient(135deg, #FF1744 0%, #D32F2F 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Aceptar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

