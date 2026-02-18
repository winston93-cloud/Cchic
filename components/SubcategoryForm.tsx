'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Subcategory } from '@/types';
import { supabase } from '@/lib/supabase';

interface SubcategoryFormProps {
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  'Transporte': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '✈️', '🛩️', '🚁', '🚂', '🚆', '🚇', '🚊', '🚝', '🚄', '🚅', '🚈', '🚞', '⛴️', '🚢', '⛵', '🛶', '🚤'],
  'Comida': ['🍔', '🍕', '🌮', '🌯', '🥙', '🥪', '🌭', '🍿', '🧈', '🥓', '🥚', '🍳', '🥞', '🧇', '🥐', '🍞', '🥖', '🥨', '🧀', '🥗', '🥘', '🍲', '🍝', '🥫', '🍜', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪', '🌰', '🥜'],
  'Oficina': ['📝', '📄', '📃', '📋', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '📇', '🗃️', '🗄️', '📁', '📂', '🗂️', '📌', '📍', '✂️', '🖇️', '📎', '🖊️', '✏️', '📏', '📐', '🖍️', '🖌️', '📦'],
  'Tecnología': ['💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '🎮', '📱', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏰', '⌚', '📡', '🔋', '🔌', '💡', '🔦', '🕯️'],
  'Otros': ['📦', '🎁', '🎀', '🎊', '🎉', '🎈', '🏆', '🥇', '🥈', '🥉', '🔑', '🗝️', '🔐', '🔒', '🔓', '🧳', '🎒', '💼', '📫', '📪', '📬', '📭', '📮', '🔖', '🏷️', '💎']
};

const COLOR_PRESETS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
  '#00B894', '#00CEC9', '#0984E3', '#B2BEC3', '#636E72'
];

type SubcategoryWithCategory = Subcategory & { categories?: { name: string; icon?: string; color?: string } };

export default function SubcategoryForm({ onClose }: SubcategoryFormProps) {
  const [subcategories, setSubcategories] = useState<SubcategoryWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '' as string | number,
    icon: '📦',
    color: '#4da6ff',
  });
  const [notification, setNotification] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*, categories(name, icon, color)')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      setSubcategories((data as SubcategoryWithCategory[]) || []);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      showNotification('❌ Error al cargar subcategorías');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const filteredSubcategories = subcategories.filter(sc => {
    if (!searchQuery.trim()) return false;
    const search = searchQuery.toLowerCase().trim();
    const catName = (sc.categories as { name?: string })?.name || '';
    return sc.name?.toLowerCase().includes(search) || catName?.toLowerCase().includes(search);
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    if (value.trim().length === 0) {
      setSelectedSubcategory(null);
      handleNewRecord();
    }
  };

  const handleSelectSubcategory = (sc: SubcategoryWithCategory) => {
    setSelectedSubcategory(sc);
    setFormData({
      name: sc.name || '',
      category_id: sc.category_id,
      icon: sc.icon || '📦',
      color: sc.color || '#4da6ff',
    });
    setSearchQuery(sc.name);
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewRecord = () => {
    setSelectedSubcategory(null);
    setFormData({ name: '', category_id: '', icon: '📦', color: '#4da6ff' });
    setSearchQuery('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('❌ El nombre es requerido');
      return;
    }
    if (!formData.category_id) {
      showNotification('❌ Selecciona una categoría');
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        category_id: Number(formData.category_id),
        icon: formData.icon,
        color: formData.color,
      };
      if (selectedSubcategory?.id) {
        const { error } = await supabase.from('subcategories').update(payload).eq('id', selectedSubcategory.id);
        if (error) throw error;
        showNotification('✅ Subcategoría actualizada');
      } else {
        const { error } = await supabase.from('subcategories').insert([payload]);
        if (error) throw error;
        showNotification('✅ Subcategoría creada');
      }
      await fetchSubcategories();
      handleNewRecord();
    } catch (error: any) {
      console.error('Error al guardar subcategoría:', error);
      if (error.code === '23505') showNotification('❌ Ya existe esa subcategoría en esa categoría');
      else showNotification('❌ Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!selectedSubcategory?.id) {
      showNotification('❌ Selecciona una subcategoría para eliminar');
      return;
    }
    if (!confirm(`¿Eliminar la subcategoría "${selectedSubcategory.name}"?`)) return;
    try {
      const { error } = await supabase.from('subcategories').update({ active: false }).eq('id', selectedSubcategory.id);
      if (error) throw error;
      showNotification('✅ Subcategoría eliminada');
      await fetchSubcategories();
      handleNewRecord();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      showNotification('❌ Error al eliminar');
    }
  };

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)',
              background: notification.includes('❌') ? '#EF4444' : '#10B981',
              color: 'white', padding: '1rem 2rem', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 9999, fontWeight: 600, fontSize: '1rem'
            }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="modal-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="modal"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>📂 Subcategoría</h2>
            <motion.button className="modal-close" onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>×</motion.button>
          </div>

          <div className="form-group" ref={searchRef} style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>🔍 Buscar Subcategoría</label>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
              placeholder="Nombre o categoría..."
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
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', border: '1px solid var(--gray-300)', borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)', maxHeight: '250px', overflowY: 'auto', zIndex: 1000, marginTop: '0.5rem'
                  }}
                >
                  {filteredSubcategories.length > 0 ? (
                    filteredSubcategories.map(sc => (
                      <motion.div
                        key={sc.id}
                        onClick={() => handleSelectSubcategory(sc)}
                        style={{
                          padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--gray-200)',
                          display: 'flex', alignItems: 'center', gap: '0.75rem'
                        }}
                        whileHover={{ background: 'var(--gray-50)' }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: sc.color || '#4da6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                        }}>
                          {sc.icon || '📦'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{sc.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                            Categoría: {(sc.categories as { name?: string })?.name || '-'}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', color: 'var(--gray-500)', textAlign: 'center' }}>No se encontraron resultados</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Categoría (padre) *</label>
              <select
                name="category_id"
                className="form-input"
                value={formData.category_id}
                onChange={handleChange}
                required
                style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
              >
                <option value="">Selecciona categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon || '📦'} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Nombre *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre de la subcategoría"
                required
                style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
              />
            </div>

            <div className="form-row" style={{ gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div className="form-group" style={{ flex: 1 }} ref={emojiRef}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Icono</label>
                <motion.button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '100%', padding: '0.7rem', fontSize: '1.5rem',
                    background: 'var(--gray-50)', border: '2px solid var(--gray-300)', borderRadius: '12px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{formData.icon}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Cambiar icono ➜</span>
                </motion.button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'white', border: '2px solid var(--gray-300)', borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)', padding: '1.5rem', zIndex: 2000, maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', width: '90vw'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Selecciona un icono</h3>
                        <motion.button type="button" onClick={() => setShowEmojiPicker(false)} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                          style={{ background: 'var(--gray-200)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.5rem' }}>×</motion.button>
                      </div>
                      {Object.entries(EMOJI_CATEGORIES).map(([catName, emojis]) => (
                        <div key={catName} style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-blue)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{catName}</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '0.5rem' }}>
                            {emojis.map(emoji => (
                              <motion.button
                                key={emoji}
                                type="button"
                                onClick={() => { setFormData(prev => ({ ...prev, icon: emoji })); setShowEmojiPicker(false); }}
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  fontSize: '1.8rem', padding: '0.5rem', border: 'none',
                                  background: formData.icon === emoji ? 'var(--primary-blue)' : 'var(--gray-100)',
                                  borderRadius: '12px', cursor: 'pointer'
                                }}
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" name="color" value={formData.color} onChange={handleChange} style={{ padding: '0.4rem', height: '48px', width: '80px', cursor: 'pointer' }} />
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem' }}>
                    {COLOR_PRESETS.slice(0, 10).map(color => (
                      <motion.button key={color} type="button" onClick={() => setFormData(prev => ({ ...prev, color }))} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', background: color, border: formData.color === color ? '3px solid var(--primary-blue)' : '2px solid var(--gray-300)', cursor: 'pointer', padding: 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Vista Previa</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '12px', border: '2px solid var(--gray-200)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: formData.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{formData.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary-blue)' }}>{formData.name || 'Nombre de la subcategoría'}</div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <motion.button type="button" className="btn btn-outline" onClick={handleNewRecord} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}>➕ Nuevo</motion.button>
                {selectedSubcategory && (
                  <motion.button type="button" className="btn btn-danger" onClick={handleDelete} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}>🗑️ Eliminar</motion.button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <motion.button type="button" className="btn btn-outline" onClick={onClose} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '0.7rem 1rem', fontSize: '0.9rem' }}>Cancelar</motion.button>
                <motion.button type="submit" className="btn btn-success" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem' }}>✅ {selectedSubcategory ? 'Actualizar' : 'Guardar'}</motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}
