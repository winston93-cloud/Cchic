const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Detalle de movimientos
router.get('/movements', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
  `;
  
  const params = [];
  if (startDate && endDate) {
    query += ' WHERE e.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY e.date DESC, e.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Detalle por persona
router.get('/by-person', (req, res) => {
  const { startDate, endDate, executor } = req.query;
  
  let query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  if (executor) {
    query += ' AND e.executor = ?';
    params.push(executor);
  }
  if (startDate && endDate) {
    query += ' AND e.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY e.date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Detalle por persona y categoría
router.get('/by-person-category', (req, res) => {
  const query = `
    SELECT 
      e.executor,
      c.name as category_name,
      COUNT(*) as count,
      SUM(e.amount) as total,
      AVG(e.amount) as average
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    GROUP BY e.executor, c.name
    ORDER BY e.executor, c.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Resumen por categoría
router.get('/by-category', (req, res) => {
  const query = `
    SELECT 
      c.name as category_name,
      COUNT(*) as count,
      SUM(e.amount) as total,
      AVG(e.amount) as average
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    GROUP BY c.name
    ORDER BY total DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;

