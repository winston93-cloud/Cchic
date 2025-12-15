const { db } = require('./database');

// Script para inicializar datos de ejemplo
const initializeData = () => {
  // Categorías de ejemplo
  const categories = [
    'Transporte',
    'Alimentación',
    'Papelería',
    'Servicios',
    'Mantenimiento',
    'Capacitación',
    'Otros'
  ];

  // Personas de ejemplo
  const persons = [
    'Juan Pérez',
    'María García',
    'Carlos López',
    'Ana Martínez'
  ];

  console.log('🔧 Inicializando datos de ejemplo...');

  // Insertar categorías
  categories.forEach(category => {
    db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category], (err) => {
      if (err) console.error('Error al insertar categoría:', err);
    });
  });

  // Insertar personas
  persons.forEach(person => {
    db.run('INSERT OR IGNORE INTO persons (name) VALUES (?)', [person], (err) => {
      if (err) console.error('Error al insertar persona:', err);
    });
  });

  // Insertar un fondo inicial
  db.run('INSERT INTO funds (date, amount, notes) VALUES (?, ?, ?)', 
    [new Date().toISOString().split('T')[0], 10000, 'Fondo inicial'],
    (err) => {
      if (err) console.error('Error al insertar fondo:', err);
      else console.log('✅ Datos de ejemplo inicializados correctamente');
    }
  );
};

// Ejecutar si se llama directamente
if (require.main === module) {
  const database = require('./database');
  database.initialize().then(() => {
    initializeData();
    setTimeout(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    }, 1000);
  });
}

module.exports = { initializeData };

