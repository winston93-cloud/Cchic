'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Person, Category } from '@/types';
import { supabase } from '@/lib/supabase';

interface PersonFormProps {
  onClose: () => void;
}

export default function PersonForm({ onClose }: PersonFormProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
  });

  // Generar identificación automáticamente
  useEffect(() => {
    if (formData.name && selectedCategories.length > 0) {
      const nameInitials = formData.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      
      const categoryId = selectedCategories[0];
      const timestamp = Date.now().toString().slice(-4);
      
      const autoId = `${nameInitials}-${categoryId}-${timestamp}`;
      setFormData(prev => ({ ...prev, identification: autoId }));
    } else if (formData.name) {
      const nameInitials = formData.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      const timestamp = Date.now().toString().slice(-4);
      const autoId = `${nameInitials}-${timestamp}`;
      setFormData(prev => ({ ...prev, identification: autoId }));
    }
  }, [formData.name, selectedCategories]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPersons();
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Personas cargadas:', data);
      setPersons(data || []);
    } catch (error) {
      console.error('Error al cargar personas:', error);
      alert('Error al cargar personas. Verifica la consola para más detalles.');
    }
  };

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

  const filteredPersons = persons.filter(person => {
    if (!searchQuery.trim()) return false;
    const search = searchQuery.toLowerCase().trim();
    return person.name?.toLowerCase().includes(search) ||
           person.identification?.toLowerCase().includes(search);
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    // Si se limpia la búsqueda, limpiar también la selección
    if (value.trim().length === 0) {
      setSelectedPerson(null);
      handleNewRecord();
    }
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name || '',
      identification: person.identification || '',
    });
    setSearchQuery(person.name);
    setShowSuggestions(false);
    
    // TODO: Cargar categorías de la persona si hay relación
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewRecord = () => {
    setSelectedPerson(null);
    setFormData({
      name: '',
      identification: '',
    });
    setSearchQuery('');
    setSelectedCategories([]);
  };

  const handleSave = async () => {
    try {
      if (selectedPerson) {
        // Actualizar
        const { error } = await supabase
          .from('persons')
          .update(formData as any)
          .eq('id', selectedPerson.id);

        if (error) throw error;
        showNotification('✅ Persona actualizada exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('persons')
          .insert([{ ...formData, active: true } as any]);

        if (error) throw error;
        showNotification('✅ Persona creada exitosamente');
      }

      fetchPersons();
      handleNewRecord();
    } catch (error) {
      console.error('Error al guardar persona:', error);
      showNotification('❌ Error al guardar la persona');
    }
  };

  const handleDelete = async () => {
    if (!selectedPerson) {
      alert('Selecciona una persona para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar a ${selectedPerson.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('persons')
        .update({ active: false })
        .eq('id', selectedPerson.id);

      if (error) throw error;

      showNotification('✅ Persona eliminada exitosamente');
      fetchPersons();
      handleNewRecord();
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      showNotification('❌ Error al eliminar la persona');
    }
  };


  const handleRemoveCategory = (categoryId: number) => {
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
  };

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
        style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
          <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>👤 Persona</h2>
          <motion.button 
            className="modal-close" 
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        </div>

        {/* Búsqueda Autocompletada */}
        <div className="form-group" ref={searchRef} style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>🔍 Buscar Persona</label>
              <input
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Escribe nombre, email o identificación..."
                style={{ width: '100%', padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
                autoComplete="off"
              />
          <AnimatePresence>
            {showSuggestions && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '0.5rem'
                }}
              >
                {filteredPersons.length > 0 ? (
                  filteredPersons.map((person) => (
                    <motion.div
                      key={person.id}
                      onClick={() => handleSelectPerson(person)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-200)',
                        transition: 'background 0.2s'
                      }}
                      whileHover={{ background: 'var(--gray-50)' }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                        {person.name}
                      </div>
                      {person.identification && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                          🆔 {person.identification}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                    No se encontraron resultados
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Nombre *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
              style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Identificación (Automático)</label>
            <input
              type="text"
              name="identification"
              className="form-input"
              value={formData.identification}
              readOnly
              placeholder="Se generará automáticamente"
              style={{ 
                padding: '0.7rem 0.9rem', 
                fontSize: '0.9rem',
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Categoría</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <select
                className="form-select"
                style={{ flex: 1, padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
                onChange={(e) => {
                  const categoryId = parseInt(e.target.value);
                  if (categoryId && !selectedCategories.includes(categoryId)) {
                    setSelectedCategories(prev => [...prev, categoryId]);
                  }
                  e.target.value = '';
                }}
              >
                <option value="">Seleccionar categoría existente</option>
                {categories
                  .filter(cat => !selectedCategories.includes(cat.id))
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', minHeight: '45px', padding: '0.4rem', border: '1px solid var(--gray-300)', borderRadius: '8px', background: 'var(--gray-50)' }}>
              {selectedCategories.length === 0 ? (
                <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem', alignSelf: 'center' }}>Sin categorías seleccionadas</span>
              ) : (
                selectedCategories.map(catId => {
                  const category = categories.find(c => c.id === catId);
                  return category ? (
                    <span
                      key={catId}
                      className="badge badge-primary"
                      style={{ 
                        background: category.color || 'var(--gradient-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      {category.icon} {category.name}
                      <motion.button
                        type="button"
                        onClick={() => handleRemoveCategory(catId)}
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '0.2rem',
                          fontSize: '0.9rem'
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </motion.button>
                    </span>
                  ) : null;
                })
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <motion.button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleNewRecord}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
              >
                ➕ Nuevo
              </motion.button>
              {selectedPerson && (
                <motion.button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
                >
                  🗑️ Eliminar
                </motion.button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <motion.button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}
              >
                Cancelar
              </motion.button>
              <motion.button 
                type="submit" 
                className="btn btn-success"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem' }}
              >
                ✅ {selectedPerson ? 'Actualizar' : 'Guardar'}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
    </>
  );
}
