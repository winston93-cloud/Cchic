# 🚀 Instrucciones para Configurar Supabase

## Paso 1: Acceder a Supabase

1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Deberías ver tu proyecto: **nmxrccrbnoenkahefrrw**

## Paso 2: Crear las Tablas

1. En el dashboard, ve a **"SQL Editor"** (icono de código en la barra lateral)
2. Clic en **"New Query"**
3. Copia TODO el contenido del archivo `SUPABASE_SETUP.sql`
4. Pega en el editor SQL
5. Clic en **"Run"** (botón verde abajo a la derecha)

**Resultado esperado**: Verás mensajes de "Success" para cada tabla creada

## Paso 3: Verificar las Tablas

1. Ve a **"Table Editor"** (icono de tabla en la barra lateral)
2. Deberías ver 4 tablas:
   - ✅ `categories` (7 registros)
   - ✅ `persons` (4 registros)  
   - ✅ `funds` (1 registro - Bs. 10,000)
   - ✅ `expenses` (vacío)

## Paso 4: Verificar las Vistas

1. Quédate en **"Table Editor"**
2. En la parte superior, cambia de "Tables" a **"Views"**
3. Deberías ver 4 vistas:
   - ✅ `v_balance` - Saldo actual
   - ✅ `v_expenses_by_category` - Reportes por categoría
   - ✅ `v_expenses_by_person` - Reportes por persona
   - ✅ `v_expenses_by_person_category` - Reportes combinados

## Paso 5: Probar una Vista

1. En **"SQL Editor"**, crea una nueva query
2. Ejecuta:
```sql
SELECT * FROM v_balance;
```
3. Deberías ver:
   - `total_funds`: 10000
   - `total_expenses`: 0
   - `balance`: 10000

## Paso 6: Obtener la Anon Key (Ya la tienes pero por si acaso)

1. Ve a **"Settings"** > **"API"**
2. Copia tu **"anon" / "public"** key
3. Debería coincidir con la que ya puse en tu `.env.local`

## ✅ Todo Listo!

Si completaste todos los pasos, tu base de datos en Supabase está lista.

Ahora puedes reiniciar tu aplicación:

```bash
# Detén los servidores actuales (Ctrl+C en las terminales)
# Ya no necesitas el backend local, ahora usa Supabase!

# Solo inicia el frontend:
npm run dev
```

## 🔍 Solución de Problemas

### Error: "relation already exists"
✅ Normal! Significa que la tabla ya existe. Puedes ignorarlo.

### Error: "permission denied"
❌ Verifica que estás usando el proyecto correcto en Supabase.

### No veo datos en las tablas
1. Verifica que el SQL se ejecutó completamente
2. Refresca el "Table Editor"
3. Verifica que no haya errores en el SQL Editor

### La app no conecta
1. Verifica que las variables de entorno en `.env.local` sean correctas
2. Reinicia el servidor de desarrollo
3. Abre la consola del navegador para ver errores

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Verifica los logs en la consola del navegador (F12)
2. Verifica el SQL Editor en Supabase para errores
3. Pregúntame! 😊

