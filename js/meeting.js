import { ApiClient } from './apiClient.js';

const shell = () => document.getElementById('meeting-shell');
const side = () => document.getElementById('meeting-side');
const sideContent = () => document.getElementById('meeting-side-content');
const stage = () => document.getElementById('stage-content');
const participants = () => document.getElementById('participant-list');
const saveModal = () => document.getElementById('save-modal');

const fallbackFiles = [
    { name: 'Ejemplo Funcion lineal.png', status: 'Disponible offline', size: '430 KB' },
    { name: 'Ejemplo Funcion cuadratica.png', status: 'Guardado para clase', size: '510 KB' },
    { name: 'Ejemplo Funcion exponencial.png', status: 'Pendiente al reconectar', size: '485 KB' },
    { name: 'Resumen Algebra 5B.pdf', status: 'Prioritario', size: '1.2 MB' }
];

const fallbackParticipantRows = [
    { name: 'Prof. Garcia', role: 'Docente', connection: 'Estable', level: 'good', activity: 'Compartiendo pantalla' },
    { name: 'Tu', role: 'Estudiante', connection: 'Estable', level: 'good', activity: 'Audio activo' },
    { name: 'Emma Lucia', role: 'Estudiante', connection: 'Inestable', level: 'warn', activity: 'Respuesta pendiente' },
    { name: 'Liam Torres', role: 'Estudiante', connection: 'Modo ahorro', level: 'warn', activity: 'Chat disponible' },
    { name: 'Mateo Ruiz', role: 'Estudiante', connection: 'Desconectado', level: 'bad', activity: 'Reingreso sugerido' }
];

let meetingData = null;
let endCallConfirmBound = false;

const DEMO_AI_RESPONSE = 'Esta es una respuesta de demostracion. Aqui deberian ir las respuestas de la IA.';

function setCourseLabel(view) {
    const label = document.getElementById('meeting-course-label');
    if (meetingData?.course) {
        const suffix = view === 'presentation' ? '20260508' : '20260420';
        label.textContent = `${meetingData.course.name} - ${suffix}`;
        return;
    }
    label.textContent = view === 'presentation'
        ? 'Ciencia y tecnologia - 20260508'
        : 'Algebra - 20260420';
}

function setActiveButton(view) {
    document.querySelectorAll('[data-view]').forEach(button => {
        button.classList.toggle('is-selected', button.dataset.view === view);
    });
}

function getMeetingFiles() {
    return meetingData?.files?.length ? meetingData.files.map(file => ({
        name: file.name,
        status: file.status,
        size: file.size
    })) : fallbackFiles;
}

function getMeetingParticipants() {
    return meetingData?.participants?.length ? meetingData.participants : fallbackParticipantRows;
}

function getMeetingMessages(kind) {
    const messages = meetingData?.messages || [];
    if (kind === 'ai') {
        return messages.filter(message => message.kind === 'ai');
    }
    return messages.filter(message => message.kind === 'chat' || message.kind === 'status');
}

function getParticipantInitial(name) {
    const cleanName = String(name || 'Usuario')
        .replace(/^prof\.?\s*/i, '')
        .trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || 'U').toUpperCase();
}

function getCurrentMeetingUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (error) {
        return null;
    }
}

function renderParticipants(mode = 'video') {
    const isOffline = mode !== 'video';
    const currentUser = getCurrentMeetingUser();
    const rows = getMeetingParticipants();
    const currentRow = currentUser
        ? {
            name: currentUser.name || currentUser.email || 'Tu',
            role: currentUser.role === 'teacher' ? 'Docente' : 'Estudiante',
            connection: 'Tu sesion',
            level: 'good',
            activity: currentUser.role === 'teacher' ? 'Presentando' : 'En clase'
        }
        : null;
    const visibleRows = [
        ...(currentRow ? [currentRow] : []),
        ...rows.filter(row => !currentUser || row.id !== currentUser.id)
    ].slice(0, 4);
    participants().innerHTML = `
        <div class="participant-rail-title">Participantes</div>
        ${visibleRows.map((row, index) => `
            <article class="participant-card initials-card ${row.role === 'Docente' ? 'presenting' : ''} ${isOffline || row.level === 'bad' ? 'camera-off' : ''}">
                <div class="participant-video initials-video">
                    <span>${getParticipantInitial(row.name)}</span>
                </div>
                <span class="participant-name">${row.name}</span>
                <small>${row.role === 'Docente' ? 'Presentando' : row.connection || 'En linea'}</small>
            </article>
        `).join('')}
    `;
}

function hideSide() {
    side().hidden = true;
    shell().classList.remove('has-side');
}

function showSide(type) {
    side().hidden = false;
    shell().classList.add('has-side');
    const renderers = {
        repository: renderRepositoryPanel,
        prompt: renderPromptPanel,
        ai: renderAiPanel,
        comments: renderCommentsPanel,
        participants: renderParticipantsPanel,
        activities: renderActivitiesPanel,
        reactions: renderReactionsPanel
    };
    sideContent().innerHTML = (renderers[type] || renderRepositoryPanel)();
    bindPanelActions(type);
}

function panelHeader(icon, title, note = '') {
    return `
        <header class="side-title">
            <span class="side-icon">${icon}</span>
            <div>
                <h2>${title}</h2>
                ${note ? `<p>${note}</p>` : ''}
            </div>
        </header>
    `;
}

function renderPromptPanel() {
    return `
        ${panelHeader('ai', 'Teacher Prompt', 'Genera y guarda materiales reutilizables')}
        <div class="meeting-panel-body">
            <label class="meeting-label" for="teacher-prompt">INSTRUCTIONS</label>
            <textarea class="meeting-textarea" id="teacher-prompt">creame un ejemplo de regresion lineal/ajuste de curvas/ que use funcion lineal, cuadratica, exponencial</textarea>
            <button class="meeting-primary-action" id="generate-graph" type="button">Generate Graph</button>
            <article class="panel-note-card">
                <strong>US cubierta</strong>
                <p>Herramienta generativa para preparar contenido interactivo sin aumentar la carga docente.</p>
            </article>
        </div>
    `;
}

function renderRepositoryPanel() {
    const panelFiles = getMeetingFiles();
    return `
        ${panelHeader('file', 'Archivos Guardados', 'Materiales disponibles incluso con baja conexion')}
        <div class="meeting-panel-body">
            <div class="connection-summary">
                <strong>4 materiales</strong>
                <span>2 guardados offline</span>
                <span>1 pendiente de sincronizar</span>
            </div>
            <div class="saved-files">
                ${panelFiles.map(file => `
                    <article class="saved-file">
                        <img class="file-glyph" src="../iconos/abrir-documento.png" alt="">
                        <div>
                            <p>${file.name}</p>
                            <span>${file.status} · ${file.size}</span>
                        </div>
                        <button type="button" aria-label="Descargar ${file.name}">down</button>
                        <button type="button" aria-label="Expandir ${file.name}">full</button>
                    </article>
                `).join('')}
            </div>
            <button class="meeting-primary-action" type="button" id="prioritize-material">Priorizar para modo ahorro</button>
            <p class="meeting-feedback" id="material-feedback" hidden>Material priorizado para usarlo si la conexion falla.</p>
        </div>
    `;
}

function renderCommentsPanel() {
    const messages = getMeetingMessages('chat');
    return `
        ${panelHeader('chat', 'Comentarios de clase', 'Dudas y mensajes sin interrumpir la sesion')}
        <div class="meeting-panel-body meeting-thread">
            ${messages.slice(0, 4).map(message => `
                <article class="chat-bubble ${message.kind === 'status' ? 'status' : message.author_id === 'teacher-garcia' ? 'teacher' : ''}">
                    <strong>${message.author_name}</strong>
                    <p>${message.body}</p>
                </article>
            `).join('') || '<article class="chat-bubble status"><strong>Sistema</strong><p>El chat esta listo para la clase.</p></article>'}
            <label class="meeting-label" for="class-comment">COMENTARIO</label>
            <textarea class="meeting-textarea compact" id="class-comment">Tengo una duda sobre el segundo paso.</textarea>
            <button class="meeting-primary-action" type="button" id="send-comment">Enviar comentario</button>
            <p class="meeting-feedback" id="comment-feedback" hidden>Comentario guardado y pendiente de sincronizacion.</p>
        </div>
    `;
}

function renderAiPanel() {
    return `
        <header class="ai-panel-header">
            <h2>AI Assistant</h2>
            <button type="button" id="close-ai-panel" aria-label="Cerrar asistente">x</button>
        </header>
        <div class="ai-chat-body">
            <article class="ai-message assistant">Hola! Soy tu asistente de IA. Como puedo ayudarte durante esta sesion?</article>
            <article class="ai-message user">Genera una pregunta para los estudiantes</article>
            <article class="ai-message assistant">${DEMO_AI_RESPONSE}</article>
        </div>
        <section class="ai-suggestions">
            <strong>SUGERENCIAS:</strong>
            <button type="button" data-ai-prompt="content">Ayuda con el contenido de la leccion</button>
            <button type="button" data-ai-prompt="quiz">Genera una pregunta para los estudiantes</button>
            <button type="button" data-ai-prompt="summary">Crea un resumen del tema</button>
            <button type="button" data-ai-prompt="interactive">Sugiere actividades interactivas</button>
        </section>
        <div class="ai-compose">
            <textarea id="ai-message" aria-label="Mensaje para IA"></textarea>
            <button type="button" id="send-ai">Enviar</button>
        </div>
    `;
}

function appendAiExchange(promptText) {
    const chatBody = document.querySelector('.ai-chat-body');
    if (!chatBody) return;
    const cleanPrompt = String(promptText || 'Genera una ayuda para esta sesion.').trim();
    chatBody.insertAdjacentHTML('beforeend', `
        <article class="ai-message user">${cleanPrompt}</article>
        <article class="ai-message assistant">${DEMO_AI_RESPONSE}</article>
    `);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function renderPresentationStage() {
    return `
        <section class="presentation-stage-card">
            <header>
                <div>
                    <span>Presentando ahora</span>
                    <strong>${meetingData?.course?.name || 'Algebra - Clase 5B'}</strong>
                </div>
                <span class="live-pill">En vivo</span>
            </header>
            <div class="presentation-image-wrap">
                <img src="../iconos/presentacion.png" alt="Presentacion compartida">
            </div>
        </section>
    `;
}

function renderParticipantsPanel() {
    const rows = getMeetingParticipants();
    const counters = rows.reduce((acc, row) => {
        acc[row.level] += 1;
        return acc;
    }, { good: 0, warn: 0, bad: 0 });
    return `
        ${panelHeader('user', 'Participantes', 'Estado de conexion del grupo')}
        <div class="meeting-panel-body">
            <div class="connection-summary three">
                <span><strong>${counters.good}</strong> estable</span>
                <span><strong>${counters.warn}</strong> inestable</span>
                <span><strong>${counters.bad}</strong> fuera</span>
            </div>
            <div class="participant-status-list">
                ${rows.map(row => `
                    <article class="participant-status ${row.level}">
                        <span class="status-dot"></span>
                        <div>
                            <strong>${row.name}</strong>
                            <p>${row.role} · ${row.connection}</p>
                        </div>
                        <small>${row.activity}</small>
                    </article>
                `).join('')}
            </div>
            <button class="meeting-primary-action" id="suggest-low-mode" type="button">Sugerir modo ahorro</button>
            <p class="meeting-feedback" id="participants-feedback" hidden>Sugerencia enviada a estudiantes con conexion inestable.</p>
        </div>
    `;
}

function renderActivitiesPanel() {
    const activities = meetingData?.activities || [];
    const responses = meetingData?.responses || [];
    const activityMap = Object.fromEntries(activities.map(activity => [activity.kind, activity]));
    return `
        ${panelHeader('tool', 'Actividades en vivo', 'Cuestionarios, encuestas, pizarra y grupos')}
        <div class="meeting-panel-body">
            <div class="activity-grid">
                <button type="button" data-activity="quiz"><strong>Quiz rapido</strong><span>${activityMap.quiz?.payload?.questions || 3} preguntas · ${activityMap.quiz?.payload?.responses || 6} respuestas</span></button>
                <button type="button" data-activity="poll"><strong>Encuesta</strong><span>${activityMap.poll?.title || 'Comprension del grupo'}</span></button>
                <button type="button" data-activity="board"><strong>Pizarra</strong><span>${activityMap.board?.payload?.mode || 'Modo solo docente'}</span></button>
                <button type="button" data-activity="groups"><strong>Grupos</strong><span>${activityMap.groups?.payload?.groups || 2} equipos creados</span></button>
            </div>
            <section class="timer-card">
                <span>Temporizador</span>
                <strong id="timer-readout">02:00</strong>
                <div class="button-row compact">
                    <button class="plain-action" type="button" id="pause-timer">Pausar</button>
                    <button class="plain-action" type="button" id="reset-timer">Reiniciar</button>
                </div>
            </section>
            <article class="pending-answer-card">
                <strong>Respuesta pendiente</strong>
                <p>${responses[0]?.student_name || 'Emma'} envio una respuesta con baja conexion. Se conserva para confirmar al reconectar.</p>
                <button class="meeting-primary-action" id="confirm-pending" type="button">Confirmar envio</button>
            </article>
            <p class="meeting-feedback" id="activity-feedback" hidden>Actividad preparada para los estudiantes conectados.</p>
        </div>
    `;
}

function renderReactionsPanel() {
    return `
        ${panelHeader('hand', 'Reacciones rapidas', 'Comunica sin interrumpir la clase')}
        <div class="meeting-panel-body">
            <div class="reaction-grid">
                <button type="button" data-reaction="Mano levantada">Mano levantada</button>
                <button type="button" data-reaction="Tengo una duda">Tengo una duda</button>
                <button type="button" data-reaction="Necesito una pausa">Necesito una pausa</button>
                <button type="button" data-reaction="Voy bien">Voy bien</button>
            </div>
            <section class="reaction-summary">
                <strong>Resumen docente</strong>
                <span>3 dudas similares agrupadas</span>
                <span>1 estudiante pide pausa</span>
                <span>6 estudiantes respondieron el quiz</span>
            </section>
            <p class="meeting-feedback" id="reaction-feedback" hidden>Reaccion enviada al docente.</p>
        </div>
    `;
}

function bindPanelActions(type) {
    if (type === 'prompt') {
        document.getElementById('generate-graph')?.addEventListener('click', renderPrompt);
    }
    document.getElementById('prioritize-material')?.addEventListener('click', () => showFeedback('material-feedback'));
    document.getElementById('send-comment')?.addEventListener('click', async () => {
        const body = document.getElementById('class-comment')?.value || '';
        try {
            await ApiClient.post('/api/meetings/current/messages', { body, kind: 'chat', pending: true });
        } catch (error) {
            console.warn('Comentario no sincronizado:', error.message);
        }
        showFeedback('comment-feedback');
    });
    document.getElementById('send-ai')?.addEventListener('click', async () => {
        const body = document.getElementById('ai-message')?.value || '';
        try {
            await ApiClient.post('/api/meetings/current/activities', { kind: 'ai', title: body, payload: { source: 'chat-ia' } });
        } catch (error) {
            console.warn('Actividad IA no sincronizada:', error.message);
        }
        appendAiExchange(body);
        const input = document.getElementById('ai-message');
        if (input) input.value = '';
    });
    document.getElementById('close-ai-panel')?.addEventListener('click', () => {
        side().hidden = true;
        shell().classList.remove('has-side');
        setActiveButton('presentation');
    });
    document.getElementById('suggest-low-mode')?.addEventListener('click', () => showFeedback('participants-feedback'));
    document.getElementById('confirm-pending')?.addEventListener('click', () => showFeedback('activity-feedback', 'Respuesta confirmada y registrada.'));
    document.querySelectorAll('[data-ai-prompt], [data-activity]').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                await ApiClient.post('/api/meetings/current/activities', {
                    kind: button.dataset.activity || button.dataset.aiPrompt || 'activity',
                    title: button.textContent.trim(),
                    payload: { createdFrom: type }
                });
            } catch (error) {
                console.warn('Actividad no sincronizada:', error.message);
            }
            if (button.dataset.aiPrompt) {
                appendAiExchange(button.textContent.trim());
                return;
            }
            showFeedback(type === 'ai' ? 'ai-feedback' : 'activity-feedback');
        });
    });
    document.querySelectorAll('[data-reaction]').forEach(button => {
        button.addEventListener('click', async () => {
            try {
                await ApiClient.post('/api/meetings/current/reactions', { reaction: button.dataset.reaction });
            } catch (error) {
                console.warn('Reaccion no sincronizada:', error.message);
            }
            showFeedback('reaction-feedback', `${button.dataset.reaction} enviada al docente.`);
        });
    });
    document.getElementById('pause-timer')?.addEventListener('click', () => {
        document.getElementById('timer-readout').textContent = '01:24';
        showFeedback('activity-feedback', 'Temporizador pausado para la actividad.');
    });
    document.getElementById('reset-timer')?.addEventListener('click', () => {
        document.getElementById('timer-readout').textContent = '02:00';
        showFeedback('activity-feedback', 'Temporizador reiniciado.');
    });
}

function bindCallControls() {
    const micButton = document.getElementById('toggle-mic');
    const cameraButton = document.getElementById('toggle-camera');

    micButton?.addEventListener('click', () => {
        const muted = micButton.getAttribute('aria-pressed') === 'true';
        micButton.setAttribute('aria-pressed', String(!muted));
        micButton.classList.toggle('is-muted', !muted);
        micButton.querySelector('img').src = muted
            ? '../iconos/forma-de-microfono-negro.png'
            : '../iconos/silenciar-microfono.png';
        micButton.setAttribute('title', muted ? 'Microfono activo' : 'Microfono silenciado');
    });

    cameraButton?.addEventListener('click', () => {
        const off = cameraButton.getAttribute('aria-pressed') === 'true';
        cameraButton.setAttribute('aria-pressed', String(!off));
        cameraButton.classList.toggle('is-muted', !off);
        cameraButton.querySelector('img').src = off
            ? '../iconos/camara-de-video.png'
            : '../iconos/camara-apagada.png';
        cameraButton.setAttribute('title', off ? 'Camara activa' : 'Camara apagada');
    });
}

function bindEndCallConfirm() {
    if (endCallConfirmBound) return;
    endCallConfirmBound = true;
    document.addEventListener('click', (event) => {
        const endCallButton = event.target.closest?.('#end-call-btn');
        if (!endCallButton) return;
        const shouldEnd = window.confirm('Quieres terminar la reunion para todos?');
        if (!shouldEnd) {
            event.preventDefault();
        }
    }, true);
}

function showFeedback(id, message) {
    const feedback = document.getElementById(id);
    if (!feedback) return;
    if (message) feedback.textContent = message;
    feedback.hidden = false;
}

function renderSlideContent() {
    stage().className = 'presentation-stage';
    stage().innerHTML = renderPresentationStage();
}

function graphMarkup() {
    return `
        <div class="graph-card">
            <header>
                <strong>Splines Cubicos: Ejemplo Combinado</strong>
                <div>
                    <button type="button" aria-label="Descargar grafico">down</button>
                    <button type="button" aria-label="Pantalla completa">full</button>
                </div>
            </header>
            <div class="graph-board" aria-label="Grafico generado">
                <div class="graph-grid"></div>
                <span class="formula formula-a">y = 13.8946e<sup>0.0954x</sup></span>
                <span class="formula formula-b">y = 9.9782x<sup>0.5018</sup></span>
                <span class="formula formula-c">y = -0.1x<sup>2</sup> + 3.26x + 8.57</span>
                <span class="graph-curve red"></span>
                <span class="graph-curve purple"></span>
                <span class="graph-curve green"></span>
                <span class="point p1"></span>
                <span class="point p2"></span>
                <span class="point p3"></span>
            </div>
        </div>
    `;
}

function renderPresentation() {
    setCourseLabel('presentation');
    setActiveButton('presentation');
    hideSide();
    renderParticipants('video');
    saveModal().hidden = true;
    renderSlideContent();
}

function renderPrompt() {
    setCourseLabel('prompt');
    setActiveButton('ai');
    showSide('ai');
    renderParticipants('video');
    saveModal().hidden = true;
    renderSlideContent();
}

function renderRepository() {
    setCourseLabel('repository');
    setActiveButton('repository');
    showSide('repository');
    renderParticipants('video');
    stage().className = 'graph-stage graph-stage-dimmed';
    stage().innerHTML = graphMarkup();
    saveModal().hidden = false;
}

function renderSideView(view) {
    setCourseLabel(view);
    setActiveButton(view);
    showSide(view);
    renderParticipants('video');
    saveModal().hidden = true;
    if (!stage().innerHTML || stage().classList.contains('connection-stage') || stage().classList.contains('graph-stage-dimmed')) {
        renderSlideContent();
    }
}

function renderConnection(type) {
    const offline = type === 'offline';
    setCourseLabel('repository');
    setActiveButton(type);
    showSide(offline ? 'comments' : 'repository');
    renderParticipants('offline');
    saveModal().hidden = true;
    stage().className = 'connection-stage';
    stage().innerHTML = `
        <section class="connection-card ${offline ? 'offline' : ''}">
            <span class="connection-icon">x</span>
            <div>
                <h1>${offline ? 'Sin conexion' : 'Baja conexion'}</h1>
                <p>${offline
                    ? 'No se puede conectar la llamada en estos momentos. Sin embargo, puede intentar usar el modo llamada.'
                    : 'La calidad de la llamada ha sido ajustada automaticamente'}</p>
                ${offline ? '<p>Telefono: 9xx-xxx-xxx<br>Codigo de reunion: 3942</p>' : ''}
            </div>
        </section>
    `;
}

function setView(view) {
    const normalized = view || 'presentation';
    if (normalized === 'prompt') renderPrompt();
    else if (normalized === 'repository') renderRepository();
    else if (normalized === 'low') renderConnection('low');
    else if (normalized === 'offline') renderConnection('offline');
    else if (['ai', 'comments', 'participants', 'activities', 'reactions'].includes(normalized)) renderSideView(normalized);
    else renderPresentation();
}

bindEndCallConfirm();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        meetingData = await ApiClient.get('/api/meetings/current');
    } catch (error) {
        console.warn('Reunion desde backend no disponible:', error.message);
    }

    const params = new URLSearchParams(window.location.search);
    setView(params.get('view'));
    bindCallControls();

    document.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', () => setView(button.dataset.view));
    });

    document.getElementById('cancel-save')?.addEventListener('click', () => {
        saveModal().hidden = true;
        stage().classList.remove('graph-stage-dimmed');
    });

    document.getElementById('confirm-save')?.addEventListener('click', () => {
        saveModal().hidden = true;
        stage().classList.remove('graph-stage-dimmed');
    });
});
