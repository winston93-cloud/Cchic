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
    last_name: '',
    address: '',
    phone: '',
    email: '',
    identification: '',
    department: '',
  });
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
        .order('name');

      if (error) throw error;
      setPersons(data || []);
    } catch (error) {
      console.error('Error al cargar personas:', error);
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
    const fullName = `${person.name} ${person.last_name || ''}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || 
           person.email?.toLowerCase().includes(search) ||
           person.identification?.toLowerCase().includes(search);
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name || '',
      last_name: person.last_name || '',
      address: person.address || '',
      phone: person.phone || '',
      email: person.email || '',
      identification: person.identification || '',
      department: person.department || '',
    });
    setSearchQuery(`${person.name} ${person.last_name || ''}`.trim());
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
      last_name: '',
      address: '',
      phone: '',
      email: '',
      identification: '',
      department: '',
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
        alert('Persona actualizada exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('persons')
          .insert([{ ...formData, active: true } as any]);

        if (error) throw error;
        alert('Persona creada exitosamente');
      }

      fetchPersons();
      handleNewRecord();
    } catch (error) {
      console.error('Error al guardar persona:', error);
      alert('Error al guardar la persona');
    }
  };

  const handleDelete = async () => {
    if (!selectedPerson) {
      alert('Selecciona una persona para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar a ${selectedPerson.name} ${selectedPerson.last_name || ''}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('persons')
        .update({ active: false })
        .eq('id', selectedPerson.id);

      if (error) throw error;

      alert('Persona eliminada exitosamente');
      fetchPersons();
      handleNewRecord();
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      alert('Error al eliminar la persona');
    }
  };

  const handleAddCategory = () => {
    const categoryInput = document.getElementById('new-category') as HTMLInputElement;
    if (categoryInput && categoryInput.value.trim()) {
      createCategory(categoryInput.value.trim());
      categoryInput.value = '';
    }
  };

  const createCategory = async (categoryName: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: categoryName }])
        .select()
        .single();

      if (error) throw error;
      
      fetchCategories();
      
      if (data) {
        setSelectedCategories(prev => [...prev, data.id]);
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      alert('Error al crear la categoría');
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
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
        style={{ maxWidth: '700px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">👤 Persona</h2>
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
        <div className="form-group" ref={searchRef} style={{ position: 'relative' }}>
          <label className="form-label">🔍 Buscar Persona</label>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            placeholder="Escribe nombre, email o identificación..."
            style={{ width: '100%' }}
          />
          <AnimatePresence>
            {showSuggestions && filteredPersons.length > 0 && (
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
                {filteredPersons.map((person) => (
                  <motion.div
                    key={person.id}
                    onClick={() => handleSelectPerson(person)}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-200)',
                      transition: 'background 0.2s'
                    }}
                    whileHover={{ background: 'var(--gray-50)' }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                      {person.name} {person.last_name || ''}
                    </div>
                    {person.email && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                        📧 {person.email}
                      </div>
                    )}
                    {person.identification && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        🆔 {person.identification}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Apellido"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              placeholder="Dirección completa"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Número de teléfono"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Identificación</label>
              <input
                type="text"
                name="identification"
                className="form-input"
                value={formData.identification}
                onChange={handleChange}
                placeholder="Número de identificación"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input
                type="text"
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                placeholder="Departamento"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                className="form-select"
                style={{ flex: 1 }}
                onChange={(e) => {
                  const categoryId = parseInt(e.target.value);
                  if (categoryId && !selectedCategories.includes(categoryId)) {
                    setSelectedCategories(prev => [...prev, categoryId]);
                  }
                  e.target.value = '';
                }}
              >
                <option value="">Seleccionar categoría</option>
                {categories
                  .filter(cat => !selectedCategories.includes(cat.id))
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
              </select>
              <motion.button
                type="button"
                className="btn btn-success"
                onClick={handleAddCategory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.75rem 1rem' }}
              >
                ➕
              </motion.button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', minHeight: '60px', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: '8px', background: 'var(--gray-50)' }}>
              {selectedCategories.length === 0 ? (
                <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No hay categorías seleccionadas</span>
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
                        padding: '0.5rem 0.75rem'
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
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '0.25rem'
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
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <input
                id="new-category"
                type="text"
                className="form-input"
                placeholder="Nueva categoría"
                style={{ flex: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <motion.button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleNewRecord}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ➕ Nuevo Registro
              </motion.button>
              {selectedPerson && (
                <motion.button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
              >
                Cancelar
              </motion.button>
              <motion.button 
                type="submit" 
                className="btn btn-success"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✅ {selectedPerson ? 'Actualizar' : 'Guardar'}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
