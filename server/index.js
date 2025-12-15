const express = require('express');
const cors = require('cors');
const db = require('./database');
const expensesRoutes = require('./routes/expenses');
const personsRoutes = require('./routes/persons');
const categoriesRoutes = require('./routes/categories');
const reportsRoutes = require('./routes/reports');
const fundsRoutes = require('./routes/funds');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expensesRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/funds', fundsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'cChic API is running' });
});

// Initialize database
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor cChic corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});

