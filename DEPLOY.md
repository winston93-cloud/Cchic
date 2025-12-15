# 🚀 Guía de Despliegue - cChic

Esta guía te ayudará a desplegar tu aplicación cChic en producción.

## 📋 Prerequisitos

- Cuenta en GitHub
- Cuenta en Vercel
- Cuenta en Railway/Render (para el backend)

## 🎯 Paso 1: Preparar el Repositorio

1. Inicializa Git (si no lo has hecho):
```bash
git init
git add .
git commit -m "Initial commit: cChic Web App"
```

2. Crea un repositorio en GitHub:
   - Ve a [github.com/new](https://github.com/new)
   - Nombra tu repositorio (ej: `cchic-web`)
   - No inicialices con README (ya lo tienes)

3. Conecta y sube tu código:
```bash
git remote add origin https://github.com/TU-USUARIO/cchic-web.git
git branch -M main
git push -u origin main
```

## 🔧 Paso 2: Desplegar el Backend

### Opción A: Railway

1. Ve a [railway.app](https://railway.app)
2. Crea un nuevo proyecto
3. Selecciona "Deploy from GitHub repo"
4. Elige tu repositorio `cchic-web`
5. Configura las variables:
   - `PORT`: 3001
6. Railway detectará automáticamente Node.js
7. Copia la URL generada (ej: `https://tu-app.railway.app`)

### Opción B: Render

1. Ve a [render.com](https://render.com)
2. Crea un "New Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name**: cchic-backend
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
5. Variables de entorno:
   - `PORT`: 3001
6. Crea el servicio y copia la URL

## 🌐 Paso 3: Desplegar el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Import Project"
3. Selecciona tu repositorio de GitHub
4. Configuración:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
   ```
   (Usa la URL de tu backend del Paso 2)
6. Haz clic en "Deploy"
7. Espera a que termine el despliegue

## ✅ Paso 4: Verificar el Despliegue

1. Abre la URL de Vercel (ej: `https://cchic-web.vercel.app`)
2. Verifica que:
   - La página carga correctamente
   - Puedes crear un nuevo egreso
   - El saldo se actualiza
   - Los reportes funcionan

## 🔄 Actualizaciones Automáticas

Cada vez que hagas push a la rama `main`:
- Vercel desplegará automáticamente el frontend
- Railway/Render desplegará automáticamente el backend

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

## 🗄️ Base de Datos en Producción

### Para SQLite (Desarrollo/Demo)
SQLite funciona bien para demos, pero los datos se perderán en cada redeploy.

### Para Producción Seria
Considera migrar a PostgreSQL:

1. **Supabase** (Gratis para empezar):
   - [supabase.com](https://supabase.com)
   - Crea un proyecto
   - Usa la URL de conexión en tu backend

2. **Railway PostgreSQL**:
   - En Railway, agrega "New > PostgreSQL"
   - Conecta automáticamente

## 🐛 Solución de Problemas

### El frontend no conecta con el backend
- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurada en Vercel
- Asegúrate de que el backend esté corriendo y accesible

### Errores de CORS
- El backend ya incluye configuración CORS
- Si hay problemas, verifica que la URL del frontend esté en la whitelist

### Base de datos no persiste
- SQLite no persiste en despliegues sin volúmenes
- Migra a PostgreSQL para producción

## 📊 Monitoreo

### Vercel Dashboard
- Analytics del frontend
- Logs de errores
- Métricas de performance

### Railway/Render Dashboard
- Logs del backend
- Uso de recursos
- Métricas de la base de datos

## 🔐 Seguridad

Para producción, considera:

1. **Variables de entorno seguras**
   - No subas archivos `.env` al repositorio
   - Usa los dashboards de Vercel/Railway para variables sensibles

2. **HTTPS**
   - Vercel y Railway proporcionan HTTPS automáticamente

3. **Rate Limiting**
   - Implementa límites de peticiones en el backend

4. **Autenticación**
   - Considera agregar login para usuarios

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel/Railway
2. Verifica las variables de entorno
3. Asegúrate de que todas las dependencias estén instaladas

---

¡Listo! Tu aplicación cChic debería estar funcionando en producción 🎉

