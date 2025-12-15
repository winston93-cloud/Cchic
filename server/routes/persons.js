const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Obtener todas las personas
router.get('/', (req, res) => {
  db.all('SELECT * FROM persons ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear nueva persona
router.post('/', (req, res) => {
  const { name } = req.body;
  
  db.run('INSERT INTO persons (name) VALUES (?)', [name], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, message: 'Persona creada exitosamente' });
  });
});

// Actualizar persona
router.put('/:id', (req, res) => {
  const { name } = req.body;
  
  db.run('UPDATE persons SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.json({ message: 'Persona actualizada exitosamente' });
  });
});

// Eliminar persona
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM persons WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.json({ message: 'Persona eliminada exitosamente' });
  });
});

module.exports = router;

