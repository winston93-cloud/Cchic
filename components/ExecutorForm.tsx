'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Executor {
  id: number;
  name: string;
  identification: string;
  active: boolean;
}

interface ExecutorFormProps {
  onClose: () => void;
  onSave: () => void;
}

export default function ExecutorForm({ onClose, onSave }: ExecutorFormProps) {
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    identification: ''
  });

  useEffect(() => {
    fetchExecutors();
  }, []);

  const fetchExecutors = async () => {
    try {
      const { data, error } = await supabase
        .from('executors')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setExecutors(data || []);
    } catch (error) {
      console.error('Error al cargar ejecutores:', error);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const generateIdentification = (name: string) => {
    if (!name) return '';
    
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 3);
    
    const timestamp = Date.now().toString().slice(-6);
    return `EXE-${initials}${timestamp}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      identification: selectedExecutor?.id ? prev.identification : generateIdentification(newName)
    }));
  };

  const handleNew = () => {
    setSelectedExecutor(null);
    setFormData({
      name: '',
      identification: ''
    });
    setSearchTerm('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedExecutor?.id) {
        // Actualizar
        const { error } = await supabase
          .from('executors')
          .update({
            name: formData.name,
            identification: formData.identification,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedExecutor.id);

        if (error) throw error;
        showNotification('✅ Ejecutor actualizado exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('executors')
          .insert([{
            name: formData.name,
            identification: formData.identification
          }]);

        if (error) throw error;
        showNotification('✅ Ejecutor creado exitosamente');
      }
      
      await fetchExecutors();
      handleNew();
      onSave();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      showNotification('❌ Error al guardar: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedExecutor?.id) return;
    
    if (!confirm('¿Estás seguro de eliminar este ejecutor?')) return;
    
    try {
      const { error } = await supabase
        .from('executors')
        .update({ active: false })
        .eq('id', selectedExecutor.id);

      if (error) throw error;
      
      showNotification('✅ Ejecutor eliminado exitosamente');
      await fetchExecutors();
      handleNew();
      onSave();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      showNotification('❌ Error al eliminar: ' + error.message);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(value.length > 0);
  };

  const handleSelectExecutor = (executor: Executor) => {
    setSelectedExecutor(executor);
    setFormData({
      name: executor.name,
      identification: executor.identification
    });
    setSearchTerm(executor.name);
    setShowSearchResults(false);
  };

  const filteredExecutors = executors.filter(exec =>
    exec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exec.identification?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
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
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', maxHeight: '75vh', overflowY: 'auto' }}
      >
        {/* Notificación */}
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

        <div className="modal-header">
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👔 Ejecutor
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '0.8rem 1.2rem 1rem' }}>
          {/* Búsqueda Autocompletada */}
          <div style={{ marginBottom: '0.8rem', position: 'relative' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
              🔍 Buscar Ejecutor
            </label>
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm && setShowSearchResults(true)}
              placeholder="Buscar por nombre o identificación..."
              style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
            />
            
            <AnimatePresence>
              {showSearchResults && filteredExecutors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '0.5rem'
                  }}
                >
                  {filteredExecutors.map((exec) => (
                    <motion.div
                      key={exec.id}
                      whileHover={{ background: 'rgba(0, 229, 255, 0.1)' }}
                      onClick={() => handleSelectExecutor(exec)}
                      style={{
                        padding: '0.8rem 1rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: '500', fontSize: '0.95rem', color: '#1976D2' }}>
                        {exec.name}
                      </div>
                      {exec.identification && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                          🆔 {exec.identification}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '0.8rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
              👤 Nombre *
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Nombre completo del ejecutor"
              required
              style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
            />
          </div>

          {/* Identificación (readonly) */}
          <div style={{ marginBottom: '0.8rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>
              🆔 Identificación
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.identification}
              readOnly
              style={{ 
                padding: '0.7rem 0.9rem', 
                fontSize: '0.9rem',
                background: 'rgba(0, 0, 0, 0.05)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Botones */}
          <div style={{ 
            display: 'flex', 
            gap: '0.6rem', 
            marginTop: '1rem',
            paddingTop: '0.8rem',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleNew}
              style={{
                flex: 1,
                padding: '0.7rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
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
                padding: '0.7rem',
                background: 'linear-gradient(135deg, #00E5FF 0%, #1976D2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              💾 Guardar
            </motion.button>
            
            {selectedExecutor && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  background: 'linear-gradient(135deg, #FF1744 0%, #D32F2F 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🗑️ Eliminar
              </motion.button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.65rem',
              marginTop: '0.6rem',
              background: 'rgba(0, 0, 0, 0.05)',
              color: 'var(--gray-700)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Cancelar
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

