const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Obtener todas las categorías
router.get('/', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear nueva categoría
router.post('/', (req, res) => {
  const { name } = req.body;
  
  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, message: 'Categoría creada exitosamente' });
  });
});

// Actualizar categoría
router.put('/:id', (req, res) => {
  const { name } = req.body;
  
  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría actualizada exitosamente' });
  });
});

// Eliminar categoría
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría eliminada exitosamente' });
  });
});

module.exports = router;

