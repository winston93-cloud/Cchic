# cChic - Sistema de Control de Caja Chica 💰

Sistema web moderno para control de caja chica, desarrollado con Next.js, TypeScript y Node.js.

## 🎨 Características

- ✅ Registro y gestión de egresos
- 📊 Reportes y análisis detallados
- 👥 Gestión de personas y categorías
- 💵 Control de saldo en tiempo real
- 🎯 Interfaz moderna y responsiva
- 🔵 Diseño con paleta azul marino y azul cielo

## 🚀 Tecnologías

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **CSS Global** - Estilos personalizados

### Backend
- **Node.js** - Runtime
- **Express** - Framework API REST
- **SQLite3** - Base de datos

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/cchic-web.git
cd cchic-web
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea el archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Inicia el servidor backend:
```bash
npm run server:dev
```

5. En otra terminal, inicia el frontend:
```bash
npm run dev
```

6. Abre tu navegador en [http://localhost:3000](http://localhost:3000)

## 🗂️ Estructura del Proyecto

```
cchic-web/
├── app/                    # Páginas Next.js
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout global
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── ExpenseForm.tsx    # Formulario de egresos
│   ├── ExpenseList.tsx    # Lista de egresos
│   └── ReportsPanel.tsx   # Panel de reportes
├── server/                # Backend API
│   ├── index.js          # Servidor Express
│   ├── database.js       # Configuración DB
│   └── routes/           # Rutas API
│       ├── expenses.js
│       ├── persons.js
│       ├── categories.js
│       └── reports.js
├── types/                 # Definiciones TypeScript
└── package.json          # Dependencias
```

## 📡 API Endpoints

### Egresos
- `GET /api/expenses` - Obtener todos los egresos
- `GET /api/expenses/:id` - Obtener egreso por ID
- `POST /api/expenses` - Crear nuevo egreso
- `PUT /api/expenses/:id` - Actualizar egreso
- `DELETE /api/expenses/:id` - Eliminar egreso
- `GET /api/expenses/balance/current` - Obtener saldo actual

### Personas
- `GET /api/persons` - Listar personas
- `POST /api/persons` - Crear persona
- `PUT /api/persons/:id` - Actualizar persona
- `DELETE /api/persons/:id` - Eliminar persona

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Reportes
- `GET /api/reports/movements` - Detalle de movimientos
- `GET /api/reports/by-person` - Reporte por persona
- `GET /api/reports/by-person-category` - Reporte por persona y categoría
- `GET /api/reports/by-category` - Resumen por categoría

## 🎨 Paleta de Colores

- **Azul Marino**: `#1a2a4e` (Color base)
- **Azul Cielo**: `#4da6ff` (Color principal)
- **Azul Cielo Claro**: `#80bdff`
- **Azul Cielo Oscuro**: `#1a8cff`

## 🚢 Despliegue en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en Vercel:
   - `NEXT_PUBLIC_API_URL` - URL de tu API
3. Despliega automáticamente con cada push a `main`

### Nota sobre el Backend
Para producción, considera desplegar el backend en:
- **Railway**
- **Render**
- **Heroku**
- **Digital Ocean**

Y actualiza la variable `NEXT_PUBLIC_API_URL` con la URL de tu backend en producción.

## 📝 Scripts Disponibles

```bash
npm run dev          # Inicia Next.js en desarrollo
npm run build        # Construye para producción
npm start            # Inicia Next.js en producción
npm run server       # Inicia servidor backend
npm run server:dev   # Inicia servidor backend con nodemon
npm run lint         # Ejecuta el linter
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Desarrollado por

**Sistemas de Información Paez**
- Luis Paez
- Email: contacto@sistemaspaez.com
- Web: www.SistemasPaez.com

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

