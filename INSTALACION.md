# 📅 Mis Eventos - Guía de Instalación

## ¿Qué es esta aplicación?

Una aplicación web (PWA) simple y fácil de usar que te permite agregar eventos a tu Google Calendar directamente desde tu teléfono Android. Se instala como una app nativa sin necesidad de Play Store.

---

## 🚀 PASO 1: Obtener Credenciales de Google

Antes de usar la app, necesitas crear credenciales en Google Cloud Console:

### 1.1 Ir a Google Cloud Console
- Visita: https://console.cloud.google.com/

### 1.2 Crear un Proyecto
1. Haz clic en el selector de proyectos (arriba a la izquierda)
2. Clic en "Nuevo Proyecto"
3. Nombre: "Mis Eventos Calendar"
4. Clic en "Crear"

### 1.3 Habilitar Google Calendar API
1. En el menú lateral, ve a "APIs y servicios" → "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en ella y presiona "HABILITAR"

### 1.4 Crear Credenciales - OAuth 2.0 Client ID
1. Ve a "APIs y servicios" → "Credenciales"
2. Clic en "+ CREAR CREDENCIALES" → "ID de cliente de OAuth"
3. Si te pide configurar la pantalla de consentimiento:
   - Selecciona "Externo"
   - Nombre de la aplicación: "Mis Eventos"
   - Email de asistencia: tu email
   - Email del desarrollador: tu email
   - Guarda y continúa (puedes dejar el resto por defecto)
   - En "Ámbitos", agrega: `https://www.googleapis.com/auth/calendar.events`
   - En "Usuarios de prueba", agrega tu email de Google
   - Guarda y continúa

4. Ahora crea el Client ID:
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "Mis Eventos Web Client"
   - Orígenes autorizados de JavaScript:
     - Si usas local: `http://localhost:8000`
     - Si subes a un servidor: agrega la URL completa (ej: `https://tudominio.com`)
   - URIs de redirección autorizados: (mismo que arriba)
   - Clic en "CREAR"

5. **IMPORTANTE**: Copia el "ID de cliente" que aparece (algo como: `123456-abc.apps.googleusercontent.com`)

### 1.5 Crear API Key
1. En "Credenciales", clic en "+ CREAR CREDENCIALES" → "Clave de API"
2. **IMPORTANTE**: Copia la API Key que aparece
3. (Opcional pero recomendado) Restringe la clave:
   - Clic en "Editar clave de API"
   - Restricciones de API → Selecciona "Google Calendar API"
   - Guarda

---

## 🔧 PASO 2: Configurar la Aplicación

### 2.1 Editar el archivo `app.js`

Abre el archivo `app.js` y reemplaza estas líneas al inicio:

```javascript
const CLIENT_ID = 'TU_CLIENT_ID_AQUI'; // ← Pega tu Client ID aquí
const API_KEY = 'TU_API_KEY_AQUI';     // ← Pega tu API Key aquí
```

**Ejemplo:**
```javascript
const CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPp';
```

---

## 📱 PASO 3: Instalar en tu Android

### Opción A: Servidor Local (Para pruebas)

1. **Instalar Python** (si no lo tienes):
   - En tu computadora, descarga Python desde python.org

2. **Ejecutar servidor local**:
   - Abre la terminal/CMD en la carpeta de la app
   - Ejecuta: `python -m http.server 8000`
   - La app estará en: `http://localhost:8000`

3. **Acceder desde tu Android**:
   - Conecta tu Android y PC a la misma red WiFi
   - En tu PC, busca tu IP local (ejecuta `ipconfig` en Windows o `ifconfig` en Mac/Linux)
   - En tu Android, abre Chrome y ve a: `http://TU_IP_LOCAL:8000`
   - Ejemplo: `http://192.168.1.100:8000`

### Opción B: Subir a un Servidor (Para uso permanente)

Puedes usar servicios gratuitos como:

**1. GitHub Pages** (Recomendado - Gratis)
- Crea una cuenta en github.com
- Sube todos los archivos a un repositorio
- En Settings → Pages, activa GitHub Pages
- Tu app estará en: `https://tu-usuario.github.io/nombre-repo`

**2. Netlify** (Fácil y gratis)
- Ve a netlify.com
- Arrastra la carpeta con todos los archivos
- Te dan una URL automáticamente
- Puedes personalizar el dominio

**3. Vercel** (Alternativa)
- Similar a Netlify
- Ve a vercel.com y sube los archivos

### Instalar como App en Android

1. **Abrir la app** en Chrome en tu Android
2. Espera a que cargue completamente
3. En el menú de Chrome (⋮), busca la opción **"Agregar a pantalla de inicio"** o **"Instalar app"**
4. Confirma la instalación
5. ¡Listo! Ahora tendrás un ícono en tu pantalla de inicio

---

## 🎯 PASO 4: Usar la Aplicación

1. **Primera vez**: Presiona "Conectar con Google"
2. Inicia sesión con tu cuenta de Google
3. Acepta los permisos (solo acceso a calendario)
4. **Agregar eventos**:
   - Título del evento
   - Fecha y hora
   - Duración
   - Descripción (opcional)
   - Presiona "Agregar al Calendario"
5. Los eventos aparecen automáticamente en tu Google Calendar

---

## 🔍 Solución de Problemas

### Error: "Origin not allowed"
- Asegúrate de agregar la URL correcta en las "Orígenes autorizados" en Google Cloud Console

### No aparece el botón "Instalar app"
- Asegúrate de estar usando HTTPS o localhost
- Recarga la página completamente
- Verifica que todos los archivos estén en el servidor

### No se conecta a Google
- Verifica que copiaste correctamente el CLIENT_ID y API_KEY
- Asegúrate de haber habilitado la Google Calendar API
- Revisa que tu email esté en "Usuarios de prueba"

### Los eventos no se guardan
- Verifica los permisos en tu cuenta de Google
- Asegúrate de tener conexión a internet

---

## 📋 Archivos Incluidos

- `index.html` - Estructura de la app
- `styles.css` - Diseño y estilos
- `app.js` - Lógica y conexión con Google Calendar (¡EDITAR ESTE!)
- `manifest.json` - Configuración PWA
- `sw.js` - Service Worker para funcionar offline
- `INSTALACION.md` - Esta guía

---

## 🎨 Personalización

### Cambiar colores
Edita `styles.css`:
```css
/* Línea 7: Color de fondo principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Línea 32: Color de encabezado */
color: #4285f4;
```

### Cambiar duración predeterminada
En `index.html`, línea 73:
```html
<option value="60" selected>1 hora</option>
```

---

## 💡 Consejos

- **Conexión offline**: La app funciona sin internet después de instalada, pero necesitas conexión para guardar eventos
- **Múltiples dispositivos**: Instala en todos tus dispositivos Android con la misma cuenta
- **Privacidad**: Tus datos solo los ves tú, están en tu cuenta de Google
- **Actualizaciones**: Si modificas el código, borra el cache del navegador o desinstala y reinstala

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los pasos de configuración de Google Cloud Console
2. Verifica que el CLIENT_ID y API_KEY estén correctos
3. Asegúrate de estar usando HTTPS o localhost
4. Revisa la consola del navegador para ver errores (F12 en Chrome)

---

¡Disfruta tu nueva aplicación de calendario! 🎉
