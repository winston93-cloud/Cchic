'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fund, Person } from '@/types';
import { supabase } from '@/lib/supabase';

interface FundFormProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function FundForm({ onClose, onUpdate }: FundFormProps) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    person_id: '',
    voucher_number: '',
    notes: '',
  });
  const [notification, setNotification] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const personSearchRef = useRef<HTMLDivElement>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  useEffect(() => {
    fetchFunds();
    fetchPersons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (personSearchRef.current && !personSearchRef.current.contains(event.target as Node)) {
        setShowPersonSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generar # Comprobante automáticamente
  useEffect(() => {
    // Solo generar para nuevos registros (no ediciones)
    if (!selectedFund && selectedPerson && formData.date) {
      const personInitials = selectedPerson.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      
      const dateFormatted = formData.date.replace(/-/g, ''); // YYYYMMDD
      const timestamp = Date.now().toString().slice(-4);
      
      const voucherNumber = `RF-${personInitials}-${dateFormatted}-${timestamp}`;
      setFormData(prev => ({ ...prev, voucher_number: voucherNumber }));
    }
  }, [selectedPerson, formData.date, selectedFund]);

  const fetchFunds = async () => {
    try {
      const { data, error } = await supabase
        .from('funds')
        .select(`
          *,
          persons (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Fondos cargados:', data);
      setFunds(data || []);
    } catch (error) {
      console.error('Error al cargar fondos:', error);
      showNotification('❌ Error al cargar fondos');
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

  const filteredFunds = funds.filter(fund => {
    if (!searchQuery.trim()) return false;
    const search = searchQuery.toLowerCase().trim();
    const personName = (fund as any).persons?.name?.toLowerCase() || '';
    const amount = fund.amount.toString();
    const date = fund.date;
    return personName.includes(search) || 
           amount.includes(search) ||
           date.includes(search) ||
           fund.voucher_number?.toLowerCase().includes(search);
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    if (value.trim().length === 0) {
      setSelectedFund(null);
      handleNewRecord();
    }
  };

  const handleSelectFund = (fund: Fund) => {
    setSelectedFund(fund);
    setFormData({
      date: fund.date,
      amount: fund.amount.toString(),
      person_id: fund.person_id?.toString() || '',
      voucher_number: fund.voucher_number || '',
      notes: fund.notes || '',
    });
    const personName = (fund as any).persons?.name || '';
    const personData = (fund as any).persons;
    if (personData) {
      setSelectedPerson(personData);
      setPersonSearchQuery(personData.name);
    }
    setSearchQuery(`${personName} - $${fund.amount} - ${fund.date}`);
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewRecord = () => {
    setSelectedFund(null);
    setSelectedPerson(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      person_id: '',
      voucher_number: '',
      notes: '',
    });
    setSearchQuery('');
    setPersonSearchQuery('');
  };

  const filteredPersons = persons.filter(person => {
    if (!personSearchQuery.trim()) return true;
    const search = personSearchQuery.toLowerCase().trim();
    return person.name?.toLowerCase().includes(search) ||
           person.identification?.toLowerCase().includes(search);
  });

  const handlePersonSearchChange = (value: string) => {
    setPersonSearchQuery(value);
    setShowPersonSuggestions(value.trim().length > 0);
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setPersonSearchQuery(person.name);
    setFormData(prev => ({ ...prev, person_id: person.id.toString() }));
    setShowPersonSuggestions(false);
  };

  const handleSave = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification('❌ El monto debe ser mayor a 0');
      return;
    }

    try {
      const fundData = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        person_id: formData.person_id ? parseInt(formData.person_id) : null,
        voucher_number: formData.voucher_number || null,
        notes: formData.notes || null,
        created_by: 'Sistema',
      };

      if (selectedFund) {
        // Actualizar
        const { error } = await supabase
          .from('funds')
          .update(fundData as any)
          .eq('id', selectedFund.id);

        if (error) throw error;
        showNotification('✅ Reposición actualizada exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('funds')
          .insert([fundData as any]);

        if (error) throw error;
        showNotification('✅ Reposición creada exitosamente');
      }

      fetchFunds();
      onUpdate();
      handleNewRecord();
    } catch (error) {
      console.error('Error al guardar reposición:', error);
      showNotification('❌ Error al guardar la reposición');
    }
  };

  const handleDelete = async () => {
    if (!selectedFund) {
      showNotification('❌ Selecciona una reposición para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar esta reposición de $${selectedFund.amount}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('funds')
        .delete()
        .eq('id', selectedFund.id);

      if (error) throw error;

      showNotification('✅ Reposición eliminada exitosamente');
      fetchFunds();
      onUpdate();
      handleNewRecord();
    } catch (error) {
      console.error('Error al eliminar reposición:', error);
      showNotification('❌ Error al eliminar la reposición');
    }
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
          style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>💰 Reposición de Fondos</h2>
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
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>🔍 Buscar Reposición</label>
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
              placeholder="Buscar por persona, monto, fecha..."
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
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '0.5rem'
                  }}
                >
                  {filteredFunds.length > 0 ? (
                    filteredFunds.map((fund) => (
                      <motion.div
                        key={fund.id}
                        onClick={() => handleSelectFund(fund)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--gray-200)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        whileHover={{ background: 'var(--gray-50)' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                            {(fund as any).persons?.name || 'Sin asignar'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                            📅 {fund.date}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#10B981', fontSize: '1.1rem' }}>
                          ${fund.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
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
            <div className="form-row" style={{ gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem', flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Fecha *</label>
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem', flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Monto *</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="form-group" ref={personSearchRef} style={{ marginBottom: '0.5rem', position: 'relative' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Persona Asignada *</label>
              <input
                type="text"
                className="form-input"
                value={personSearchQuery}
                onChange={(e) => handlePersonSearchChange(e.target.value)}
                onFocus={() => setShowPersonSuggestions(true)}
                placeholder="Buscar persona..."
                required
                style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem' }}
                autoComplete="off"
              />
              <AnimatePresence>
                {showPersonSuggestions && (
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
              
              {/* Indicador de persona asignada */}
              {selectedPerson && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                        {selectedPerson.name}
                      </div>
                      {selectedPerson.identification && (
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          🆔 {selectedPerson.identification}
                        </div>
                      )}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSelectedPerson(null);
                      setPersonSearchQuery('');
                      setFormData(prev => ({ ...prev, person_id: '' }));
                    }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      color: 'white',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                # Comprobante {!selectedFund && <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>(generado automáticamente)</span>}
              </label>
              <input
                type="text"
                name="voucher_number"
                className="form-input"
                value={formData.voucher_number}
                onChange={handleChange}
                placeholder="Se generará automáticamente"
                readOnly={!selectedFund}
                style={{ 
                  padding: '0.7rem 0.9rem', 
                  fontSize: '0.9rem',
                  background: !selectedFund ? 'var(--gray-50)' : 'white',
                  cursor: !selectedFund ? 'not-allowed' : 'text',
                  opacity: !selectedFund ? 0.7 : 1
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Notas</label>
              <textarea
                name="notes"
                className="form-input"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales..."
                rows={3}
                style={{ padding: '0.7rem 0.9rem', fontSize: '0.9rem', resize: 'vertical' }}
              />
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
                {selectedFund && (
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
                  ✅ {selectedFund ? 'Actualizar' : 'Guardar'}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}

