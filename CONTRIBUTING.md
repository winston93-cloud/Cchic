# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a cChic! Este documento te guiará en el proceso.

## 📋 Antes de Empezar

1. Fork el repositorio
2. Clona tu fork localmente
3. Crea una rama para tu feature o fix

## 🔀 Proceso de Contribución

### 1. Crear una Rama

```bash
git checkout -b feature/mi-nueva-feature
# o
git checkout -b fix/mi-fix
```

Nomenclatura de ramas:
- `feature/` - Nuevas características
- `fix/` - Corrección de bugs
- `docs/` - Cambios en documentación
- `refactor/` - Refactorización de código
- `test/` - Añadir o mejorar tests

### 2. Hacer tus Cambios

- Sigue las convenciones de código existentes
- Comenta tu código cuando sea necesario
- Mantén los commits atómicos y descriptivos

### 3. Commits

Usa mensajes descriptivos siguiendo este formato:

```bash
git commit -m "feat: agregar búsqueda de egresos por fecha"
git commit -m "fix: corregir cálculo de saldo negativo"
git commit -m "docs: actualizar README con nuevas instrucciones"
```

Tipos de commit:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, punto y coma faltantes, etc.
- `refactor`: Refactorización de código
- `test`: Añadir tests
- `chore`: Mantenimiento

### 4. Push y Pull Request

```bash
git push origin feature/mi-nueva-feature
```

Luego crea un Pull Request en GitHub con:
- Título descriptivo
- Descripción de los cambios
- Screenshots si aplica
- Referencias a issues relacionados

## 🎨 Estándares de Código

### Frontend (TypeScript/React)

- Usa TypeScript para todo el código nuevo
- Componentes funcionales con hooks
- Nombres de componentes en PascalCase
- Props con interfaces definidas

```typescript
interface MiComponenteProps {
  titulo: string;
  onClose: () => void;
}

export default function MiComponente({ titulo, onClose }: MiComponenteProps) {
  // ...
}
```

### Backend (Node.js)

- Usa async/await en lugar de callbacks cuando sea posible
- Manejo de errores apropiado
- Validación de inputs

```javascript
router.post('/', async (req, res) => {
  try {
    const { campo } = req.body;
    // lógica
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### CSS

- Usa las variables CSS definidas en `globals.css`
- Clases descriptivas y reutilizables
- Mobile-first approach

```css
.mi-componente {
  background: var(--navy-blue);
  color: var(--white);
}
```

## 🧪 Testing

Antes de enviar tu PR:

1. Prueba la funcionalidad manualmente
2. Verifica que no haya errores en consola
3. Prueba en diferentes resoluciones (si aplica)
4. Verifica que el build funcione: `npm run build`

## 📝 Documentación

Si añades nueva funcionalidad:

1. Actualiza el README.md si es necesario
2. Añade comentarios en código complejo
3. Actualiza DEPLOY.md si afecta deployment

## ❓ Preguntas

Si tienes preguntas:
1. Revisa los issues existentes
2. Crea un nuevo issue con la etiqueta "question"
3. Únete a nuestras discusiones

## 🎯 Ideas para Contribuir

### Funcionalidades Sugeridas
- [ ] Autenticación de usuarios
- [ ] Exportar reportes a PDF
- [ ] Gráficos de gastos
- [ ] Notificaciones por email
- [ ] API REST documentada con Swagger
- [ ] Tests unitarios
- [ ] Dark mode
- [ ] Multimoneda
- [ ] Backup automático

### Mejoras Generales
- [ ] Mejorar performance
- [ ] Añadir tests
- [ ] Mejorar UX
- [ ] Optimizar queries
- [ ] Documentación API

## ✅ Checklist del Pull Request

Antes de enviar, verifica:

- [ ] El código sigue los estándares del proyecto
- [ ] He probado mis cambios localmente
- [ ] No hay errores en consola
- [ ] El build funciona (`npm run build`)
- [ ] He actualizado la documentación si es necesario
- [ ] Mi PR tiene un título descriptivo
- [ ] He añadido una descripción clara de los cambios

## 🙏 Agradecimientos

¡Gracias por contribuir a cChic! Cada contribución, por pequeña que sea, es valiosa.

---

**Sistemas de Información Paez**

