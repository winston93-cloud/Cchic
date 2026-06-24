'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, Category, Person, Subcategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface Executor {
  id: number;
  name: string;
  identification: string;
  active: boolean;
}

interface ExpenseFormProps {
  expense: Expense | null;
  onSave: (expense: Partial<Expense>) => void;
  onClose: () => void;
}

export default function ExpenseForm({ expense, onSave, onClose }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [executorSearchQuery, setExecutorSearchQuery] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showSubcategorySuggestions, setShowSubcategorySuggestions] = useState(false);
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);
  const [showExecutorSuggestions, setShowExecutorSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    correspondent_to: expense?.correspondent_to || '',
    executor: expense?.executor || '',
    category_id: expense?.category_id || '',
    subcategory_id: expense?.subcategory_id || '',
    amount: expense?.amount || '',
    voucher_number: expense?.voucher_number || '',
    notes: expense?.notes || '',
  });

  const categorySearchRef = useRef<HTMLDivElement>(null);
  const subcategorySearchRef = useRef<HTMLDivElement>(null);
  const personSearchRef = useRef<HTMLDivElement>(null);
  const executorSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchPersons();
    fetchExecutors();
  }, []);

  // Al tener expense y subcategories cargados, restaurar categoría y subcategoría
  useEffect(() => {
    if (!expense) return;
    if (expense.category_id && categories.length) {
      const cat = categories.find(c => c.id === expense.category_id);
      if (cat) {
        setSelectedCategory(cat);
        setCategorySearchQuery(cat.name);
      }
    }
    if (expense.subcategory_id && subcategories.length) {
      const sub = subcategories.find(s => s.id === expense.subcategory_id);
      if (sub) {
        setSelectedSubcategory(sub);
        setSubcategorySearchQuery(sub.name);
      }
    }
    if (expense.correspondent_to) setPersonSearchQuery(expense.correspondent_to);
    if (expense.executor) setExecutorSearchQuery(expense.executor);
  }, [expense, categories.length, subcategories.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categorySearchRef.current && !categorySearchRef.current.contains(event.target as Node)) setShowCategorySuggestions(false);
      if (subcategorySearchRef.current && !subcategorySearchRef.current.contains(event.target as Node)) setShowSubcategorySuggestions(false);
      if (personSearchRef.current && !personSearchRef.current.contains(event.target as Node)) setShowPersonSuggestions(false);
      if (executorSearchRef.current && !executorSearchRef.current.contains(event.target as Node)) setShowExecutorSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generar # Comprobante automáticamente (5 dígitos numéricos)
  useEffect(() => {
    if (!expense && !formData.voucher_number) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000); // 10000-99999
      setFormData(prev => ({ ...prev, voucher_number: randomNumber.toString() }));
    }
  }, [expense]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    }
  };

  const fetchPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setPersons(data || []);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    }
  };

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

  const filteredCategories = categories.filter(cat => {
    if (!categorySearchQuery.trim()) return true;
    const search = categorySearchQuery.toLowerCase().trim();
    return cat.name?.toLowerCase().includes(search);
  });

  // Subcategorías solo de la categoría seleccionada
  const filteredSubcategories = subcategories.filter(sub => {
    if (selectedCategory && sub.category_id !== selectedCategory.id) return false;
    if (!subcategorySearchQuery.trim()) return true;
    const search = subcategorySearchQuery.toLowerCase().trim();
    return sub.name?.toLowerCase().includes(search);
  });

  const filteredPersons = persons.filter(person => {
    if (!personSearchQuery.trim()) return true;
    const search = personSearchQuery.toLowerCase().trim();
    return person.name?.toLowerCase().includes(search) ||
           person.identification?.toLowerCase().includes(search);
  });

  const handleCategorySearchChange = (value: string) => {
    setCategorySearchQuery(value);
    setShowCategorySuggestions(value.trim().length > 0);
    if (value.trim().length === 0) {
      setSelectedCategory(null);
      setFormData(prev => ({ ...prev, category_id: '' }));
    }
  };

  const handlePersonSearchChange = (value: string) => {
    setPersonSearchQuery(value);
    setShowPersonSuggestions(value.trim().length > 0);
    setFormData(prev => ({ ...prev, correspondent_to: value }));
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategorySearchQuery(category.name);
    setFormData(prev => ({ ...prev, category_id: category.id.toString(), subcategory_id: '' }));
    setSelectedSubcategory(null);
    setSubcategorySearchQuery('');
    setShowCategorySuggestions(false);
  };

  const handleSubcategorySearchChange = (value: string) => {
    setSubcategorySearchQuery(value);
    setShowSubcategorySuggestions(value.trim().length > 0);
    if (value.trim().length === 0) {
      setSelectedSubcategory(null);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  };

  const handleSelectSubcategory = (sub: Subcategory) => {
    setSelectedSubcategory(sub);
    setSubcategorySearchQuery(sub.name);
    setFormData(prev => ({ ...prev, subcategory_id: sub.id.toString() }));
    setShowSubcategorySuggestions(false);
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setPersonSearchQuery(person.name);
    setFormData(prev => ({ ...prev, correspondent_to: person.name }));
    setShowPersonSuggestions(false);
  };

  const handleSelectExecutor = (executor: Executor) => {
    setSelectedExecutor(executor);
    setExecutorSearchQuery(executor.name);
    setFormData(prev => ({ ...prev, executor: executor.name }));
    setShowExecutorSuggestions(false);
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
      subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id as string) : undefined,
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
                autoFocus
              />
            </div>
          </div>

          {/* Corresponde a - Búsqueda autocompletada de personas */}
          <div className="form-group" ref={personSearchRef} style={{ position: 'relative' }}>
            <label className="form-label">📧 Corresponde a</label>
            <input
              type="text"
              className="form-input"
              value={personSearchQuery}
              onChange={(e) => handlePersonSearchChange(e.target.value)}
              onFocus={() => setShowPersonSuggestions(true)}
              placeholder="Buscar persona..."
              autoComplete="off"
            />
            <AnimatePresence>
              {showPersonSuggestions && personSearchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '200px',
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
                      No se encontraron personas
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="form-row">
            {/* Ejecutor del Gasto - Búsqueda autocompletada */}
            <div className="form-group" ref={executorSearchRef} style={{ position: 'relative' }}>
              <label className="form-label">👤 Ejecutor del Gasto *</label>
              <input
                type="text"
                className="form-input"
                value={executorSearchQuery}
                onChange={(e) => {
                  setExecutorSearchQuery(e.target.value);
                  setShowExecutorSuggestions(true);
                }}
                onFocus={() => setShowExecutorSuggestions(true)}
                placeholder="Buscar ejecutor..."
                autoComplete="off"
                required
              />
              <AnimatePresence>
                {showExecutorSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.5rem'
                    }}
                  >
                    {executors.filter(exec => 
                      exec.name.toLowerCase().includes(executorSearchQuery.toLowerCase()) ||
                      exec.identification?.toLowerCase().includes(executorSearchQuery.toLowerCase())
                    ).length > 0 ? (
                      executors.filter(exec => 
                        exec.name.toLowerCase().includes(executorSearchQuery.toLowerCase()) ||
                        exec.identification?.toLowerCase().includes(executorSearchQuery.toLowerCase())
                      ).map((executor) => (
                        <motion.div
                          key={executor.id}
                          onClick={() => handleSelectExecutor(executor)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-200)',
                          }}
                          whileHover={{ background: 'var(--gray-50)' }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                            {executor.name}
                          </div>
                          {executor.identification && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                              🆔 {executor.identification}
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                        No se encontraron ejecutores
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Categoría - Búsqueda autocompletada con iconos y colores */}
            <div className="form-group" ref={categorySearchRef} style={{ position: 'relative' }}>
              <label className="form-label">🏷️ Categoría</label>
              <input
                type="text"
                className="form-input"
                value={categorySearchQuery}
                onChange={(e) => handleCategorySearchChange(e.target.value)}
                onFocus={() => setShowCategorySuggestions(true)}
                placeholder="Buscar categoría..."
                autoComplete="off"
              />
              <AnimatePresence>
                {showCategorySuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.5rem'
                    }}
                  >
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <motion.div
                          key={category.id}
                          onClick={() => handleSelectCategory(category)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                          whileHover={{ background: 'var(--gray-50)' }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: category.color || '#4da6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {category.icon || '📦'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                              {category.name}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                        No se encontraron categorías
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Indicador de categoría seleccionada */}
              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'linear-gradient(135deg, #fff6df 0%, #ffd700 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#3a3000',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: selectedCategory.color || '#4da6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    {selectedCategory.icon}
                  </div>
                  <span style={{ fontWeight: 600 }}>{selectedCategory.name}</span>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(null);
                      setCategorySearchQuery('');
                      setFormData(prev => ({ ...prev, category_id: '', subcategory_id: '' }));
                      setSelectedSubcategory(null);
                      setSubcategorySearchQuery('');
                    }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      color: '#3a3000',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 'auto'
                    }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Subcategoría - siempre visible; habilitado solo con categoría seleccionada */}
          <div className="form-group" ref={subcategorySearchRef} style={{ position: 'relative' }}>
            <label className="form-label">📂 Subcategoría</label>
            <input
              type="text"
              className="form-input"
              value={subcategorySearchQuery}
              onChange={(e) => selectedCategory && handleSubcategorySearchChange(e.target.value)}
              onFocus={() => selectedCategory && setShowSubcategorySuggestions(true)}
              placeholder={selectedCategory ? 'Buscar subcategoría...' : 'Primero selecciona una categoría'}
              autoComplete="off"
              disabled={!selectedCategory}
              style={{
                opacity: selectedCategory ? 1 : 0.75,
                cursor: selectedCategory ? 'text' : 'not-allowed',
                background: selectedCategory ? undefined : 'var(--gray-50)'
              }}
            />
              <AnimatePresence>
                {selectedCategory && showSubcategorySuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      marginTop: '0.5rem'
                    }}
                  >
                    {filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map((sub) => (
                        <motion.div
                          key={sub.id}
                          onClick={() => handleSelectSubcategory(sub)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                          whileHover={{ background: 'var(--gray-50)' }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: sub.color || '#4da6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {sub.icon || '📦'}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{sub.name}</div>
                        </motion.div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                        No hay subcategorías para esta categoría
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {selectedSubcategory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'linear-gradient(135deg, #fff6df 0%, #ffd700 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#3a3000',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: selectedSubcategory.color || '#4da6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    {selectedSubcategory.icon || '📦'}
                  </div>
                  <span style={{ fontWeight: 600 }}>{selectedSubcategory.name}</span>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSelectedSubcategory(null);
                      setSubcategorySearchQuery('');
                      setFormData(prev => ({ ...prev, subcategory_id: '' }));
                    }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      color: '#3a3000',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </div>

          <div className="form-group">
            <label className="form-label">
              🧾 # Comprobante {!expense && <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>(5 dígitos automáticos)</span>}
            </label>
            <input
              type="text"
              name="voucher_number"
              className="form-input"
              value={formData.voucher_number}
              onChange={handleChange}
              placeholder="Generado automáticamente"
              readOnly={!expense}
              style={{
                background: !expense ? 'var(--gray-50)' : 'white',
                cursor: !expense ? 'not-allowed' : 'text',
                opacity: !expense ? 0.7 : 1
              }}
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

          <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--gray-200)' }}>
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
