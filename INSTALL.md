# 🚀 Instalación de cChic

## Guía Paso a Paso con Capturas Visuales

### 📋 Prerequisitos

Antes de empezar, asegúrate de tener instalado:

- ✅ **Node.js** v18 o superior ([Descargar](https://nodejs.org))
- ✅ **npm** (viene con Node.js)
- ✅ **Git** ([Descargar](https://git-scm.com))
- ✅ Editor de código (VS Code recomendado)

---

## 🎯 Método 1: Instalación Rápida (Recomendado)

### Linux/Mac:

```bash
# 1. Navega al directorio del proyecto
cd /home/mario/Proyectos/Cchic

# 2. Ejecuta el script de setup
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Windows:

```cmd
# 1. Navega al directorio del proyecto
cd C:\Proyectos\Cchic

# 2. Ejecuta el script de setup
scripts\setup.bat
```

### Resultado esperado:
```
🚀 Configurando cChic...

📦 Instalando dependencias...
✓ Dependencias instaladas

🗄️ Inicializando base de datos...
✅ Base de datos inicializada correctamente

✅ ¡Configuración completada!
```

---

## 🔧 Método 2: Instalación Manual

### Paso 1: Instalar Dependencias

```bash
npm install
```

**Tiempo estimado**: 2-3 minutos

**Resultado esperado**:
```
added 250 packages, and audited 251 packages in 45s
```

### Paso 2: Inicializar Base de Datos

```bash
node server/init-data.js
```

**Resultado esperado**:
```
✅ Base de datos inicializada correctamente
✅ Datos de ejemplo inicializados correctamente
✅ Proceso completado
```

---

## ▶️ Iniciar la Aplicación

### Opción A: Iniciar Todo Junto (Recomendado)

```bash
npm run dev:all
```

**Verás dos procesos corriendo**:
```
[API] 🚀 Servidor cChic corriendo en puerto 3001
[WEB] ▲ Next.js 14.0.4
[WEB] - Local: http://localhost:3000
```

### Opción B: Iniciar Manualmente

**Terminal 1 - Backend**:
```bash
npm run server:dev
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

---

## 🌐 Abrir la Aplicación

1. Abre tu navegador
2. Ve a: **http://localhost:3000**
3. Deberías ver la pantalla principal de cChic

---

## ✅ Verificar la Instalación

### Checklist de Verificación:

- [ ] El frontend carga en http://localhost:3000
- [ ] El backend responde en http://localhost:3001/api/health
- [ ] Se muestra el saldo inicial: Bs. 10,000.00
- [ ] Hay categorías predefinidas al crear un egreso
- [ ] Puedes crear un nuevo egreso
- [ ] La tabla se actualiza correctamente
- [ ] El saldo se recalcula

### Prueba Rápida:

1. **Crear un egreso**:
   - Clic en "Nuevo Egreso"
   - Llenar el formulario
   - Clic en "Guardar Egreso"
   
2. **Verificar que aparece** en la tabla

3. **Ver reportes**:
   - Clic en "Reportes"
   - Verificar que muestra datos

---

## 🗄️ Estructura de la Base de Datos

Después de la instalación, se habrá creado:

```
server/database.db
```

Con:
- 7 categorías predefinidas
- 4 personas de ejemplo
- 1 fondo inicial de Bs. 10,000

---

## 🔄 Reiniciar desde Cero

Si necesitas empezar de nuevo:

```bash
# Detener los servidores (Ctrl+C)

# Eliminar la base de datos
rm server/database.db

# Reinicializar
node server/init-data.js

# Iniciar de nuevo
npm run dev:all
```

---

## 🐛 Solución de Problemas

### ❌ Error: "Puerto 3000 ya está en uso"

**Solución Linux/Mac**:
```bash
lsof -ti:3000 | xargs kill -9
```

**Solución Windows**:
```cmd
netstat -ano | findstr :3000
taskkill /PID <número_pid> /F
```

### ❌ Error: "Puerto 3001 ya está en uso"

Mismo procedimiento pero con puerto 3001.

### ❌ Error: "Cannot find module 'express'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Error: "EACCES: permission denied"

**Linux/Mac**:
```bash
sudo chown -R $USER:$USER .
chmod +x scripts/setup.sh
```

### ❌ Base de datos corrupta

```bash
rm server/database.db
node server/init-data.js
```

### ❌ Pantalla en blanco

1. Abre la consola del navegador (F12)
2. Revisa errores
3. Verifica que el backend esté corriendo
4. Verifica la variable `NEXT_PUBLIC_API_URL`

---

## 🔍 Verificar Endpoints

### Verificar Backend:

```bash
# Health check
curl http://localhost:3001/api/health

# Debería retornar:
# {"status":"ok","message":"cChic API is running"}
```

### Verificar Frontend:

Abre: http://localhost:3000

---

## 📱 Acceder desde otros dispositivos

Si quieres acceder desde tu celular o tablet:

1. Encuentra tu IP local:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Configura el backend para aceptar conexiones externas:
   - Edita `server/index.js`
   - Cambia `app.listen(PORT)` a `app.listen(PORT, '0.0.0.0')`

3. En tu dispositivo móvil, abre:
   - `http://TU_IP:3000`

---

## 📊 Datos de Prueba Incluidos

### Categorías:
- Transporte
- Alimentación
- Papelería
- Servicios
- Mantenimiento
- Capacitación
- Otros

### Personas:
- Juan Pérez
- María García
- Carlos López
- Ana Martínez

### Fondo inicial:
- Bs. 10,000.00

---

## 🎓 Siguiente Paso

Después de la instalación:

1. 📖 Lee el [README.md](README.md) para más información
2. 🚀 Lee el [DEPLOY.md](DEPLOY.md) para desplegar en producción
3. 🤝 Lee el [CONTRIBUTING.md](CONTRIBUTING.md) para contribuir

---

## 💡 Tips

### Desarrollo

- Usa **http://localhost:3000** para el frontend
- La API está en **http://localhost:3001/api**
- Los cambios se recargan automáticamente (hot reload)

### Base de Datos

- SQLite guarda todo en un archivo: `server/database.db`
- Puedes usar **DB Browser for SQLite** para ver los datos
- Haz backups regularmente copiando el archivo

### Depuración

- Frontend: Abre DevTools (F12)
- Backend: Los logs aparecen en la terminal
- Usa `console.log()` libremente durante desarrollo

---

## 📞 ¿Necesitas Ayuda?

Si sigues teniendo problemas:

1. 🔍 Revisa los logs en ambas terminales
2. 📖 Consulta la documentación completa
3. 🐛 [Reporta un issue](https://github.com/tu-usuario/cchic-web/issues)
4. 💬 Contacta: contacto@sistemaspaez.com

---

## ✅ ¡Listo!

Si llegaste hasta aquí, **¡felicidades!** 🎉

Tu sistema cChic está instalado y funcionando.

**Próximos pasos**:
- Explora la interfaz
- Crea tus primeros egresos
- Personaliza categorías
- Genera reportes

---

**Sistemas de Información Paez**  
_Control de Caja Chica Moderno y Eficiente_

