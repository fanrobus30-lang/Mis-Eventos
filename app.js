// Configuración de Google API
const CLIENT_ID = '207326111052-mpt6nqjgnh4dlfk7vg5dr1u9qrfik4l6.apps.googleusercontent.com'; // Reemplazar con tu Client ID
const API_KEY = 'AIzaSyDHnWS8nCoIrk9LezNaqYx7mK8XHEqEunY'; // Reemplazar con tu API Key
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

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
        
        // Verificar si ya hay token
        if (gapi.client.getToken() !== null) {
            showAppSection();
            loadUpcomingEvents();
            startAutoUpdate(); // Iniciar auto-actualización si ya está conectado
        }
    }
}

function handleAuthClick() {
    console.log('Intentando autenticar...');
    
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error en autenticación:', resp);
            showStatus('Error al conectar con Google', 'error');
            throw (resp);
        }
        console.log('Autenticación exitosa');
        showAppSection();
        await loadUpcomingEvents();
        startAutoUpdate(); // Iniciar auto-actualización
        showStatus('¡Conectado exitosamente!', 'success');
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
        stopAutoUpdate(); // Detener auto-actualización
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
        showStatus('Error al agregar el evento', 'error');
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
        document.getElementById('eventsList').innerHTML = '<p class="loading">Error al cargar eventos</p>';
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
            // Evento está ocurriendo AHORA
            eventClass += ' event-happening';
            statusEmoji = '🔴';
        } else if (startDate.toDateString() === now.toDateString()) {
            // Evento es HOY pero aún no empieza
            eventClass += ' event-today';
            statusEmoji = '🟡';
        } else {
            // Evento futuro
            eventClass += ' event-future';
            statusEmoji = '🟢';
        }
        
        // Calcular tiempo restante
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
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error al registrar SW:', err));
    });
}

// Auto-actualizar eventos cada 60 segundos
let updateInterval = null;

function startAutoUpdate() {
    // Limpiar intervalo anterior si existe
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Actualizar cada 60 segundos
    updateInterval = setInterval(() => {
        if (gapi.client.getToken() !== null) {
            loadUpcomingEvents();
        }
    }, 60000); // 60 segundos
}

// Detener auto-actualización
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Esperar a que el DOM esté listo para configurar event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, configurando event listeners...');
    
    // Configurar fecha y hora por defecto
    const now = new Date();
    const dateInput = document.getElementById('eventDate');
    const timeInput = document.getElementById('eventTime');
    
    if (dateInput) dateInput.valueAsDate = now;
    if (timeInput) timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Event listeners
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const eventForm = document.getElementById('eventForm');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
    if (eventForm) eventForm.addEventListener('submit', handleFormSubmit);
});

// Detectar si la app es instalable
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome muestre su propio banner
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    // Mostrar un banner personalizado (opcional)
    showInstallBanner();
});

function showInstallBanner() {
    // Crear banner de instalación
    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.innerHTML = `
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; 
                    background: white; padding: 15px; border-radius: 10px; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
                    display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>📱 Instalar Mis Eventos</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                    Accede rápidamente desde tu pantalla de inicio
                </p>
            </div>
            <button onclick="installApp()" style="background: #4285f4; color: white; 
                    border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                Instalar
            </button>
            <button onclick="dismissInstallBanner()" style="background: transparent; 
                    border: none; font-size: 20px; cursor: pointer; margin-left: 10px;">
                ×
            </button>
        </div>
    `;
    document.body.appendChild(banner);
}

function installApp() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuario aceptó la instalación');
            }
            deferredPrompt = null;
        });
    }
}

function dismissInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();
}

// Detectar cuando la app ya está instalada
window.addEventListener('appinstalled', () => {
    console.log('¡Aplicación instalada exitosamente!');
    deferredPrompt = null;
});
