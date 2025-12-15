const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Obtener todos los fondos
router.get('/', (req, res) => {
  db.all('SELECT * FROM funds ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear nuevo fondo
router.post('/', (req, res) => {
  const { date, amount, notes } = req.body;
  
  const query = 'INSERT INTO funds (date, amount, notes) VALUES (?, ?, ?)';
  
  db.run(query, [date, amount, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Fondo creado exitosamente' });
  });
});

// Actualizar fondo
router.put('/:id', (req, res) => {
  const { date, amount, notes } = req.body;
  
  const query = 'UPDATE funds SET date = ?, amount = ?, notes = ? WHERE id = ?';
  
  db.run(query, [date, amount, notes, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Fondo no encontrado' });
    }
    res.json({ message: 'Fondo actualizado exitosamente' });
  });
});

// Eliminar fondo
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM funds WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Fondo no encontrado' });
    }
    res.json({ message: 'Fondo eliminado exitosamente' });
  });
});

module.exports = router;

