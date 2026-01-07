// Configuración de Google API
const CLIENT_ID = '207326111052-mpt6nqjgnh4dlfk7vg5dr1u9qrfik4l6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDHnWS8nCoIrk9LezNaqYx7mK8XHEqEunY';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// NUEVO: Duración de la sesión (30 días en milisegundos)
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Cargar Google API cuando el script de gapi esté listo
function gapiLoaded() {
    console.log('GAPI script cargado');
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    console.log('Inicializando GAPI client...');
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('GAPI inicializado correctamente');
        maybeEnableButtons();
    } catch (error) {
        console.error('Error inicializando GAPI:', error);
        showStatus('Error al inicializar. Verifica tu API Key.', 'error');
    }
}

// Cargar Google Identity Services
function gisLoaded() {
    console.log('GIS script cargado');
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Se define más adelante
        });
        gisInited = true;
        console.log('GIS inicializado correctamente');
        maybeEnableButtons();
    } catch (error) {
        console.error('Error inicializando GIS:', error);
        showStatus('Error al inicializar. Verifica tu Client ID.', 'error');
    }
}

function maybeEnableButtons() {
    console.log('Verificando inicialización - GAPI:', gapiInited, 'GIS:', gisInited);
    if (gapiInited && gisInited) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            console.log('Botón de login habilitado');
        }
        
        // Intentar restaurar sesión guardada
        restoreSession();
    }
}

// ==========================================
// GESTIÓN DE SESIÓN EXTENDIDA (30 DÍAS)
// ==========================================

function saveSession(token) {
    try {
        // Guardar token y fecha de login
        localStorage.setItem('google_access_token', token.access_token);
        localStorage.setItem('google_token_expiry', token.expires_at || (Date.now() + 3600000));
        localStorage.setItem('session_created', Date.now().toString());
        localStorage.setItem('session_expiry', (Date.now() + SESSION_DURATION).toString());
        localStorage.setItem('remember_session', 'true');
        
        console.log('✅ Sesión guardada (válida por 30 días)');
    } catch (error) {
        console.error('Error guardando sesión:', error);
    }
}

function restoreSession() {
    try {
        const rememberSession = localStorage.getItem('remember_session');
        const sessionExpiry = localStorage.getItem('session_expiry');
        
        if (!rememberSession || rememberSession !== 'true') {
            console.log('❌ No hay sesión guardada');
            return;
        }
        
        if (!sessionExpiry) {
            console.log('❌ No hay fecha de expiración');
            return;
        }
        
        const expiryTime = parseInt(sessionExpiry);
        const now = Date.now();
        
        // Verificar si la sesión de 30 días sigue válida
        if (expiryTime < now) {
            console.log('⏰ Sesión de 30 días expirada');
            clearSession();
            return;
        }
        
        console.log('🔄 Sesión de 30 días válida, restaurando...');
        
        // Verificar si el token de Google (1 hora) sigue válido
        const tokenExpiry = localStorage.getItem('google_token_expiry');
        if (tokenExpiry && parseInt(tokenExpiry) > now) {
            // Token aún válido, restaurar directamente
            const savedToken = localStorage.getItem('google_access_token');
            gapi.client.setToken({
                access_token: savedToken,
                expires_at: parseInt(tokenExpiry)
            });
            verifyAndShowSession();
        } else {
            // Token expirado, pero sesión de 30 días válida
            // Solicitar nuevo token de forma silenciosa
            console.log('🔄 Token expirado, renovando silenciosamente...');
            refreshTokenSilently();
        }
        
    } catch (error) {
        console.error('Error restaurando sesión:', error);
        clearSession();
    }
}

function refreshTokenSilently() {
    // Renovar token sin mostrar el popup de consentimiento
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error renovando token:', resp);
            // Si falla la renovación silenciosa, limpiar y pedir login
            clearSession();
            showLoginSection();
            return;
        }
        
        console.log('✅ Token renovado exitosamente');
        
        // Actualizar solo el token, mantener la sesión de 30 días
        const token = gapi.client.getToken();
        if (!token.expires_at) {
            token.expires_at = Date.now() + (resp.expires_in * 1000);
        }
        
        localStorage.setItem('google_access_token', token.access_token);
        localStorage.setItem('google_token_expiry', token.expires_at.toString());
        
        verifyAndShowSession();
    };
    
    // Intentar obtener token sin prompt
    tokenClient.requestAccessToken({prompt: ''});
}

async function verifyAndShowSession() {
    try {
        // Intentar hacer una petición para verificar que el token funciona
        await gapi.client.calendar.calendarList.list({
            maxResults: 1
        });
        
        // Si llegamos aquí, el token funciona
        const daysRemaining = Math.floor((parseInt(localStorage.getItem('session_expiry')) - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`✅ Sesión restaurada (${daysRemaining} días restantes)`);
        
        showAppSection();
        await loadUpcomingEvents();
        startAutoUpdate();
        showStatus('👋 ¡Bienvenido de vuelta!', 'success');
        
    } catch (error) {
        console.log('❌ Token inválido, intentando renovar...');
        refreshTokenSilently();
    }
}

function clearSession() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('session_created');
    localStorage.removeItem('session_expiry');
    localStorage.removeItem('remember_session');
    gapi.client.setToken('');
    console.log('🗑️ Sesión limpiada completamente');
}

// ==========================================
// AUTENTICACIÓN - ACTUALIZADO
// ==========================================

function handleAuthClick() {
    console.log('Intentando autenticar...');
    
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error en autenticación:', resp);
            showStatus('Error al conectar con Google', 'error');
            throw (resp);
        }
        
        console.log('✅ Autenticación exitosa');
        
        // Obtener el token completo con tiempo de expiración
        const token = gapi.client.getToken();
        if (!token.expires_at) {
            token.expires_at = Date.now() + (resp.expires_in * 1000);
        }
        
        // Guardar sesión de 30 días
        saveSession(token);
        
        showAppSection();
        await loadUpcomingEvents();
        startAutoUpdate();
        showStatus('¡Conectado exitosamente! Sesión válida por 30 días 🎉', 'success');
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        clearSession();
        stopAutoUpdate();
        showLoginSection();
        showStatus('Sesión cerrada', 'success');
    }
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
}

function showAppSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const duration = parseInt(document.getElementById('eventDuration').value);
    const description = document.getElementById('eventDescription').value;

    // Crear fechas de inicio y fin
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const event = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': startDateTime.toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        'end': {
            'dateTime': endDateTime.toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };

    try {
        console.log('Creando evento:', event);
        const response = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });

        console.log('Evento creado:', response);
        showStatus('✓ Evento agregado al calendario', 'success');
        
        // Limpiar formulario
        document.getElementById('eventForm').reset();
        
        // Resetear fecha y hora actuales
        const now = new Date();
        document.getElementById('eventDate').valueAsDate = now;
        document.getElementById('eventTime').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Recargar lista de eventos
        await loadUpcomingEvents();

    } catch (error) {
        console.error('Error al crear evento:', error);
        
        // Si el error es por token expirado, renovar automáticamente
        if (error.status === 401) {
            console.log('🔄 Token expirado, renovando...');
            refreshTokenSilently();
            showStatus('Renovando sesión...', 'info');
        } else {
            showStatus('Error al agregar el evento', 'error');
        }
    }
}

async function loadUpcomingEvents() {
    try {
        console.log('Cargando eventos...');
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        });

        const events = response.result.items;
        console.log('Eventos cargados:', events.length);
        displayEvents(events);

    } catch (error) {
        console.error('Error al cargar eventos:', error);
        
        // Si el error es por token expirado, renovar automáticamente
        if (error.status === 401) {
            console.log('🔄 Token expirado, renovando...');
            refreshTokenSilently();
        } else {
            document.getElementById('eventsList').innerHTML = '<p class="loading">Error al cargar eventos</p>';
        }
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsList');

    if (!events || events.length === 0) {
        container.innerHTML = '<p class="no-events">No hay eventos próximos</p>';
        return;
    }

    const now = new Date();
    let html = '';
    
    events.forEach(event => {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Determinar el estado del evento
        let eventClass = 'event-item';
        let statusEmoji = '📅';
        
        if (now >= startDate && now <= endDate) {
            eventClass += ' event-happening';
            statusEmoji = '🔴';
        } else if (startDate.toDateString() === now.toDateString()) {
            eventClass += ' event-today';
            statusEmoji = '🟡';
        } else {
            eventClass += ' event-future';
            statusEmoji = '🟢';
        }
        
        const timeUntil = getTimeUntil(startDate, now);
        
        const dateStr = startDate.toLocaleDateString('es-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const timeStr = event.start.dateTime ? 
            startDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Todo el día';

        html += `
            <div class="${eventClass}">
                <div class="event-title">${statusEmoji} ${event.summary || 'Sin título'}</div>
                <div class="event-time">
                    📅 ${dateStr} • 🕐 ${timeStr}
                </div>
                <div class="event-countdown">${timeUntil}</div>
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function getTimeUntil(eventDate, now) {
    const diff = eventDate - now;
    
    if (diff < 0) {
        return '⏰ En curso';
    }
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `⏱️ Faltan ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        if (remainingMinutes > 0) {
            return `⏱️ Faltan ${hours}h ${remainingMinutes}min`;
        }
        return `⏱️ Faltan ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `⏱️ Faltan ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return '⏰ ¡Empieza pronto!';
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 3000);
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error al registrar SW:', err));
    });
}

// Auto-actualizar eventos cada 60 segundos
let updateInterval = null;

function startAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        if (gapi.client.getToken() !== null) {
            loadUpcomingEvents();
        }
    }, 60000);
}

function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, configurando event listeners...');
    
    const now = new Date();
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    
    if (dateInput) dateInput.valueAsDate = now;
    if (timeInput) timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const eventForm = document.getElementById('eventForm');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
    if (eventForm) eventForm.addEventListener('submit', handleFormSubmit);
});
