# 📅 Mis Eventos - Aplicación para Google Calendar

**Aplicación web simple para agregar eventos a tu Google Calendar desde Android**

---

## ⚡ INICIO RÁPIDO

### 1️⃣ Obtener Credenciales de Google (5 minutos)

1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto
3. Habilita "Google Calendar API"
4. Crea credenciales:
   - **OAuth 2.0 Client ID** (para aplicación web)
   - **API Key**
5. Copia ambas credenciales

### 2️⃣ Configurar la App

Edita el archivo **`app.js`** (líneas 2-3):

```javascript
const CLIENT_ID = 'pega-tu-client-id-aqui';
const API_KEY = 'pega-tu-api-key-aqui';
```

### 3️⃣ Instalar

**Opción A - Prueba local:**
```bash
python -m http.server 8000
```
Luego abre: `http://localhost:8000` en Chrome

**Opción B - Publicar gratis:**
- Sube a GitHub Pages, Netlify o Vercel
- Abre la URL en Chrome desde tu Android
- Toca "Agregar a pantalla de inicio"

---

## ✨ Características

- ✅ Interfaz simple y rápida
- ✅ Se instala como app nativa
- ✅ Sincroniza con Google Calendar
- ✅ Funciona offline (después de instalada)
- ✅ Muestra próximos eventos
- ✅ Totalmente responsive

---

## 📖 Documentación Completa

Ver **`INSTALACION.md`** para instrucciones detalladas paso a paso.

---

## 🎯 Uso

1. Abre la app
2. Conecta con tu cuenta Google
3. Completa el formulario:
   - Título del evento
   - Fecha y hora
   - Duración
4. ¡Listo! El evento se guarda automáticamente

---

## 🛠️ Archivos Incluidos

```
├── index.html          ← Interfaz de la app
├── styles.css          ← Estilos y diseño
├── app.js              ← Lógica (EDITAR CREDENCIALES AQUÍ)
├── manifest.json       ← Config para PWA
├── sw.js               ← Service Worker
├── icon-192.png        ← Icono pequeño
├── icon-512.png        ← Icono grande
├── INSTALACION.md      ← Guía detallada
└── README.md           ← Este archivo
```

---

## ⚠️ IMPORTANTE

Antes de usar, **DEBES**:
1. ✅ Crear proyecto en Google Cloud Console
2. ✅ Habilitar Google Calendar API
3. ✅ Obtener CLIENT_ID y API_KEY
4. ✅ Editar `app.js` con tus credenciales
5. ✅ Agregar tu email en "Usuarios de prueba" en Google Cloud Console

---

## 🚨 Solución Rápida de Problemas

**"Origin not allowed"**
→ Agrega tu URL en "Orígenes autorizados" en Google Cloud Console

**No aparece botón "Instalar"**
→ Usa HTTPS o localhost

**No se conecta a Google**
→ Verifica CLIENT_ID y API_KEY en `app.js`

**Eventos no se guardan**
→ Revisa permisos de Google Calendar en tu cuenta

---

## 💡 Tips

- Usa en múltiples dispositivos con la misma cuenta
- Los eventos se sincronizan automáticamente
- Puedes personalizar colores en `styles.css`
- La app funciona sin internet después de instalada

---

**¡Disfruta agregando eventos a tu calendario!** 🎉
