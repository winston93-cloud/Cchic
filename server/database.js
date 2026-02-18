const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

const initialize = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de personas
      db.run(`
        CREATE TABLE IF NOT EXISTS persons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de categorías
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de egresos
      db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          correspondent_to TEXT,
          executor TEXT NOT NULL,
          category_id INTEGER,
          amount REAL NOT NULL,
          voucher_number TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      // Tabla de fondos (para aumento de caja)
      db.run(`
        CREATE TABLE IF NOT EXISTS funds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          amount REAL NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Base de datos inicializada correctamente');
          resolve();
        }
      });
    });
  });
};

module.exports = {
  db,
  initialize
};

