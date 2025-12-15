# 🚀 Inicio Rápido - cChic

## Instalación y Ejecución en 5 minutos

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Inicializar base de datos con datos de ejemplo
```bash
node server/init-data.js
```

### 3️⃣ Iniciar el servidor backend (Terminal 1)
```bash
npm run server:dev
```

Deberías ver:
```
🚀 Servidor cChic corriendo en puerto 3001
```

### 4️⃣ Iniciar el frontend (Terminal 2 - nueva terminal)
```bash
npm run dev
```

Deberías ver:
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
```

### 5️⃣ Abrir en el navegador
Abre: **http://localhost:3000**

## ✅ Funcionalidades Disponibles

1. **Agregar Egreso**: Clic en "Nuevo Egreso"
2. **Ver Lista**: Todos los egresos en la tabla principal
3. **Editar**: Clic en el ícono de lápiz ✏️
4. **Eliminar**: Clic en el ícono de basura 🗑️
5. **Reportes**: Clic en "Reportes" para análisis

## 📊 Datos Iniciales

El sistema viene con:
- **Fondo inicial**: Bs. 10,000
- **7 Categorías**: Transporte, Alimentación, Papelería, etc.
- **4 Personas**: Juan Pérez, María García, Carlos López, Ana Martínez

## 🎨 Interfaz

- **Colores**: Azul marino y azul cielo
- **Diseño**: Moderno y responsive
- **Animaciones**: Suaves y elegantes

## 🔄 Para Reiniciar Datos

Si quieres empezar desde cero:

```bash
# Detén los servidores (Ctrl+C en ambas terminales)
rm server/database.db
node server/init-data.js
npm run server:dev  # Terminal 1
npm run dev         # Terminal 2
```

## 📝 Próximos Pasos

- Lee `README.md` para documentación completa
- Lee `DEPLOY.md` para deployment en producción
- Personaliza categorías y personas según tus necesidades

## ❓ Problemas Comunes

**Puerto 3000 o 3001 ocupado:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Error al instalar dependencias:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🎉 ¡Listo!

Ya puedes empezar a usar cChic para controlar tu caja chica.

---
**Sistemas de Información Paez** | www.SistemasPaez.com

