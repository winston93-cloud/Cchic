const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Obtener todos los egresos
router.get('/', (req, res) => {
  const query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY e.date DESC, e.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener un egreso por ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Egreso no encontrado' });
    }
    res.json(row);
  });
});

// Crear nuevo egreso
router.post('/', (req, res) => {
  const { date, correspondent_to, executor, category_id, amount, voucher_number, notes } = req.body;
  
  const query = `
    INSERT INTO expenses (date, correspondent_to, executor, category_id, amount, voucher_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [date, correspondent_to, executor, category_id, amount, voucher_number, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Egreso creado exitosamente' });
  });
});

// Actualizar egreso
router.put('/:id', (req, res) => {
  const { date, correspondent_to, executor, category_id, amount, voucher_number, notes } = req.body;
  
  const query = `
    UPDATE expenses 
    SET date = ?, correspondent_to = ?, executor = ?, category_id = ?, amount = ?, voucher_number = ?, notes = ?
    WHERE id = ?
  `;
  
  db.run(query, [date, correspondent_to, executor, category_id, amount, voucher_number, notes, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Egreso no encontrado' });
    }
    res.json({ message: 'Egreso actualizado exitosamente' });
  });
});

// Eliminar egreso
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Egreso no encontrado' });
    }
    res.json({ message: 'Egreso eliminado exitosamente' });
  });
});

// Obtener saldo actual
router.get('/balance/current', (req, res) => {
  const queries = {
    totalFunds: 'SELECT COALESCE(SUM(amount), 0) as total FROM funds',
    totalExpenses: 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
  };
  
  db.get(queries.totalFunds, [], (err, funds) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get(queries.totalExpenses, [], (err, expenses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const balance = funds.total - expenses.total;
      res.json({ 
        totalFunds: funds.total, 
        totalExpenses: expenses.total, 
        balance 
      });
    });
  });
});

module.exports = router;

