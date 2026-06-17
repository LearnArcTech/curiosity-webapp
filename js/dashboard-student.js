import { AuthService, CourseService, DataService, ApiClient } from './services.js';
import { ROUTES } from './config.js';

const demoCourses = [
    { id: 'demo-science', name: 'Ciencia y tecnología', code: '5632' },
    { id: 'demo-math', name: 'Razonamiento matematico', code: '4244' }
];

const demoClassmates = [
    { id: 'st-1', name: 'Emma', score: 19, courseCode: '4244' },
    { id: 'st-2', name: 'Liam', score: 17, courseCode: '4244' },
    { id: 'st-3', name: 'Mateo', score: 15, courseCode: '4244' },
    { id: 'st-4', name: 'Sofia', score: 18, courseCode: '5632' },
    { id: 'st-5', name: 'Santiago', score: 14, courseCode: '5632' },
    { id: 'st-6', name: 'Mia', score: 16, courseCode: '4244' },
    { id: 'st-7', name: 'Juan', score: 13, courseCode: '5632' }
];

function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function getDisplayCourses(courses) {
    return courses.length ? courses : demoCourses;
}

function formatCourseName(course, fallback = 'Curso sin nombre') {
    return sanitizeText(course?.name || fallback);
}

function getProgressValue(courses) {
    return Math.min(92, 48 + Math.max(courses.length, 1) * 11);
}

function getClassmates(courses, userId) {
    const classmates = new Map();
    courses.forEach(course => {
        DataService.getStudentsByCourse(course.id).forEach((student, index) => {
            if (student.id !== userId) {
                classmates.set(student.id, {
                    id: student.id,
                    name: student.name || student.email || `Compañero ${index + 1}`,
                    score: Math.min(20, 13 + index),
                    courseCode: course.code || 'Sin código'
                });
            }
        });
    });

    return classmates.size ? Array.from(classmates.values()) : demoClassmates;
}

function renderSidebarCourses(courses) {
    const courseList = document.getElementById('course-list');
    if (!courseList) return;

    courseList.innerHTML = getDisplayCourses(courses).map((course, index) => `
        <a href="course.html?view=overview&course=${sanitizeText(course.id)}" class="${index === 0 ? 'active' : ''}">
            ${formatCourseName(course)}
            <span>${sanitizeText(course.code || 'Sin código')}</span>
        </a>
    `).join('');
}

function renderConnectionStatus() {
    const target = document.getElementById('student-connection-status');
    if (!target) return;

    target.innerHTML = `
        <strong>Modo adaptable</strong>
        <span>Audio, chat y materiales siguen disponibles con baja conexión.</span>
    `;
}

function renderMetrics(courses, classmates, progress, backendMetrics = null) {
    const metrics = backendMetrics || [
        { label: 'Tu asistencia promedio', value: '20.6' },
        { label: 'Tu puntaje de participación promedio', value: '16.8/20' },
        { label: 'Ranking del curso', value: `#${Math.max(1, Math.min(5, classmates.length - 2))}` },
        { label: 'Insignias obtenidas', value: Math.max(2, courses.length + 2) }
    ];

    const summaryCards = document.getElementById('summary-cards');
    if (!summaryCards) return;

    summaryCards.innerHTML = metrics.map(metric => `
        <article class="summary-card">
            <span>${sanitizeText(metric.label)}</span>
            <strong>${sanitizeText(metric.value)}</strong>
        </article>
    `).join('');
}

function renderPodium(classmates) {
    const target = document.getElementById('student-podium');
    if (!target) return;

    const top = [...classmates].sort((a, b) => b.score - a.score).slice(0, 3);
    while (top.length < 3) top.push(demoClassmates[top.length]);

    target.innerHTML = `
        <div class="podium-chart" aria-label="Top de participación">
            <div class="podium-place second">
                <span class="avatar">${sanitizeText(top[1].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[1].score}</span></div>
                <small>${sanitizeText(top[1].name)}</small>
            </div>
            <div class="podium-place first">
                <span class="avatar">${sanitizeText(top[0].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[0].score}</span></div>
                <small>${sanitizeText(top[0].name)}</small>
            </div>
            <div class="podium-place third">
                <span class="avatar">${sanitizeText(top[2].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[2].score}</span></div>
                <small>${sanitizeText(top[2].name)}</small>
            </div>
        </div>
    `;
}

function renderClassmates(classmates) {
    const target = document.getElementById('classmate-list');
    const courseCount = document.getElementById('course-count');
    if (courseCount) courseCount.textContent = `${classmates.length} compañeros`;
    if (!target) return;

    target.innerHTML = classmates.slice(0, 7).map(classmate => `
        <div class="roster-row">
            <span class="person-icon" aria-hidden="true"></span>
            <strong>${sanitizeText(classmate.name)}</strong>
            <span>${sanitizeText(classmate.courseCode || '')}</span>
        </div>
    `).join('');
}

function renderCourseCards(courses) {
    const target = document.getElementById('course-cards');
    if (!target) return;

    target.innerHTML = getDisplayCourses(courses).map((course, index) => {
        const progress = Math.min(94, 54 + index * 13);
        return `
            <article class="mini-course-card">
                <div>
                    <span class="status-chip">${sanitizeText(course.code || 'Sin código')}</span>
                    <h4>${formatCourseName(course)}</h4>
                    <p>Próxima accion: revisar material previo y responder el quiz rápido.</p>
                </div>
                <div class="repo-track" aria-label="Progreso ${progress}%">
                    <span style="width: ${progress}%"></span>
                </div>
                <a class="outline-action" href="course.html?view=overview&course=${sanitizeText(course.id)}">Abrir curso</a>
            </article>
        `;
    }).join('');
}

function renderActiveSession(courses) {
    const target = document.getElementById('active-session-card');
    if (!target) return;

    const courseName = formatCourseName(getDisplayCourses(courses)[0], 'Curso activo');
    target.innerHTML = `
        <div class="session-card">
            <span class="status-chip">En espera</span>
            <h4>${courseName}</h4>
            <p>Si la conexión cae, puedes volver a la clase con audio, chat y materiales ligeros.</p>
            <div class="reaction-row" aria-label="Reacciones rapidas">
                <button type="button">Levantar mano</button>
                <button type="button">Tengo una duda</button>
                <button type="button">Necesito pausa</button>
            </div>
            <div class="pending-answer">
                <strong>Respuesta pendiente</strong>
                <span>Tu último quiz se guardara cuando vuelva la conexión.</span>
            </div>
            <a class="sidebar-action full-width" href="join-session.html">Preparar reingreso</a>
        </div>
    `;

    target.querySelectorAll('.reaction-row button').forEach(button => {
        button.addEventListener('click', () => button.classList.toggle('active'));
    });

}

function renderProgress(progress) {
    const target = document.getElementById('progress-panel');
    if (!target) return;

    target.innerHTML = `
        <div class="progress-summary">
            <div class="progress-ring" aria-label="Progreso general ${progress}%">${progress}%</div>
            <div>
                <h4>Vas en buen camino</h4>
                <p>Temas por reforzar: funciones, lectura crítica y ejercicios cronometrados.</p>
            </div>
        </div>
        <div class="achievement-list">
            <span>Insignia: Constancia</span>
            <span>Notificacion: nuevo logro desbloqueado</span>
            <span>Historial: 5 actividades completadas</span>
        </div>
    `;
}

function buildResources(courses) {
    const displayCourses = getDisplayCourses(courses);
    return [
        {
            title: `Guía ligera | ${displayCourses[0]?.name || 'Ciencia y tecnología'}`,
            size: '1.2MB',
            progress: 30,
            tag: 'Offline',
            folder: 'Material previo'
        },
        {
            title: `Presentacion resumida | ${displayCourses[1]?.name || 'Razonamiento matematico'}`,
            size: '4MB',
            progress: 52,
            tag: 'Previsualizar',
            folder: 'Sesión activa'
        },
        {
            title: 'Historial de chat y dudas resueltas',
            size: '800KB',
            progress: 18,
            tag: 'Sincronizado',
            folder: 'Comunicación'
        }
    ];
}

function normalizeResources(resources, courses) {
    if (!resources?.length) return buildResources(courses);
    return resources.map((resource, index) => ({
        title: resource.title || resource.name || `Material ${index + 1}`,
        size: resource.size || '0KB',
        progress: Number(resource.progress ?? Math.min(95, 24 + index * 18)),
        tag: resource.tag || resource.status || 'Disponible',
        folder: resource.folder || resource.kind || 'Repositorio'
    }));
}

function renderResources(resources) {
    const resourceList = document.getElementById('resource-list');
    const searchInput = document.getElementById('repository-search');
    if (!resourceList) return;

    const paint = (items) => {
        resourceList.innerHTML = items.map(resource => `
            <article class="repo-card">
                <div class="repo-card-top">
                    <strong>${sanitizeText(resource.title)}</strong>
                    <span>${sanitizeText(resource.size)}</span>
                </div>
                <div class="repo-track" aria-label="Peso relativo ${resource.progress}%">
                    <span style="width: ${resource.progress}%"></span>
                </div>
                <div class="repo-meta">
                    <span>${sanitizeText(resource.folder)}</span>
                    <button type="button" class="text-action">${sanitizeText(resource.tag)}</button>
                </div>
            </article>
        `).join('');
    };

    paint(resources);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const filtered = resources.filter(resource =>
                `${resource.title} ${resource.folder} ${resource.tag}`.toLowerCase().includes(query)
            );
            paint(filtered.length ? filtered : [{ title: 'Sin resultados', size: '0KB', progress: 0, folder: 'Repositorio', tag: 'Reintentar' }]);
        });
    }
}

function renderMessages(courses, backendMessages = null) {
    const messageList = document.getElementById('message-list');
    if (!messageList) return;

    const courseName = formatCourseName(getDisplayCourses(courses)[0], 'Curiosity');
    const messages = backendMessages || [
        { title: 'Anuncio del docente', body: `Material previo disponible para ${courseName}.`, time: 'Hoy' },
        { title: 'Duda respondida', body: 'Tu docente respondio una pregunta en el historial del curso.', time: 'Fijado' },
        { title: 'Conectividad', body: 'Modo ahorro recomendado si tu senal baja durante la clase.', time: 'Esta semana' }
    ];

    messageList.innerHTML = messages.map(message => `
        <li>
            <div>
                <strong>${sanitizeText(message.title)}</strong>
                <p>${sanitizeText(message.body)}</p>
            </div>
            <span>${sanitizeText(message.time)}</span>
        </li>
    `).join('');
}

function setupActions(user) {
    document.getElementById('enroll-course-btn')?.addEventListener('click', async () => {
        const courseCode = prompt('Ingresa el código del curso:');
        if (!courseCode) return;

        try {
            await CourseService.enrollInCourse(courseCode.trim().toUpperCase());
            alert('Te uniste al curso correctamente.');
            window.location.reload();
        } catch (error) {
            alert(error.message);
        }
    });

    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn && user.isGuest) {
        guestLoginBtn.hidden = false;
        guestLoginBtn.addEventListener('click', () => {
            AuthService.logout();
            window.location.href = ROUTES.LOGIN;
        });
    }

    const savingModeBtn = document.getElementById('saving-mode-btn');
    savingModeBtn?.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('saving-mode');
        savingModeBtn.setAttribute('aria-pressed', String(isActive));
        document.getElementById('student-live-status').textContent = isActive ? 'Modo ahorro activo' : 'Conexión estable';
    });

    const simpleModeBtn = document.getElementById('simple-mode-btn');
    simpleModeBtn?.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('simple-mode');
        simpleModeBtn.setAttribute('aria-pressed', String(isActive));
    });

    document.getElementById('student-text-size-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('large-text');
    });
    document.getElementById('student-contrast-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
    });
    document.getElementById('student-tour-btn')?.addEventListener('click', () => {
        alert('Guía inicial: revisa tus cursos, entra a la sesión activa y descarga materiales ligeros antes de clase.');
    });
    document.getElementById('direct-message-btn')?.addEventListener('click', () => {
        const message = prompt('Escribe tu duda para el docente:');
        if (message) alert('Mensaje guardado en el historial del curso.');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isStudent()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = AuthService.getCurrentUser();
    let dashboard = null;
    try {
        dashboard = await ApiClient.get('/api/dashboard/student');
    } catch (error) {
        console.warn('Dashboard estudiante desde backend no disponible:', error.message);
    }

    const courses = dashboard?.courses || await CourseService.getStudentCoursesAsync();
    const classmates = dashboard?.classmates || getClassmates(courses, user.id);
    const progress = dashboard?.progress || getProgressValue(courses);
    const resources = normalizeResources(dashboard?.resources, courses);

    renderSidebarCourses(courses);
    renderConnectionStatus();
    renderMetrics(courses, classmates, progress, dashboard?.metrics);
    renderPodium(classmates);
    renderClassmates(classmates);
    renderCourseCards(courses);
    renderActiveSession(courses);
    renderProgress(progress);
    renderResources(resources);
    renderMessages(courses, dashboard?.messages);
    setupActions(user);
});
