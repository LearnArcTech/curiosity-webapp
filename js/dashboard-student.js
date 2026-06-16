// dashboard-student.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';

function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCourseName(course, fallback = 'Curso sin nombre') {
    return sanitizeText(course?.name || fallback);
}

function getProgressValue(courses) {
    if (courses.length === 0) return 0;
    return Math.min(92, 42 + courses.length * 12);
}

function getClassmateCount(courses, userId) {
    const classmates = new Map();
    courses.forEach(course => {
        DataService.getStudentsByCourse(course.id).forEach(student => {
            if (student.id !== userId) {
                classmates.set(student.id, student);
            }
        });
    });
    return classmates.size;
}

function buildResources(courses) {
    if (courses.length === 0) {
        return [
            { type: 'Guía', title: 'Guía rápida de Curiosity', course: 'Primeros pasos', status: 'Disponible offline' },
            { type: 'PDF', title: 'Cómo unirte a una sesión activa', course: 'Ayuda', status: 'Ligero' },
            { type: 'Chat', title: 'Historial de dudas frecuentes', course: 'Ayuda', status: 'Sincronizado' }
        ];
    }

    return courses.slice(0, 4).map((course, index) => ({
        type: index % 2 === 0 ? 'PDF' : 'Presentación',
        title: `Material de ${course.name || 'curso'}`,
        course: course.name || 'Curso',
        status: index % 2 === 0 ? 'Disponible offline' : 'Nuevo'
    }));
}

function renderMetrics(courses, classmateCount, progress) {
    const metrics = [
        { label: 'Cursos inscritos', value: courses.length, hint: 'Espacios activos' },
        { label: 'Progreso promedio', value: `${progress}%`, hint: 'Basado en actividad reciente' },
        { label: 'Compañeros', value: classmateCount, hint: 'En tus cursos' },
        { label: 'Materiales', value: Math.max(3, courses.length * 2), hint: 'Listos para revisar' }
    ];

    const summaryCards = document.getElementById('summary-cards');
    if (!summaryCards) return;

    summaryCards.innerHTML = metrics.map(metric => `
        <article class="student-metric-card">
            <span class="metric-label">${metric.label}</span>
            <strong>${metric.value}</strong>
            <span class="metric-hint">${metric.hint}</span>
        </article>
    `).join('');
}

function renderSidebarCourses(courses) {
    const courseList = document.getElementById('course-list');
    if (!courseList) return;

    if (courses.length === 0) {
        courseList.innerHTML = '<li class="empty-nav-item">Aún no tienes cursos.</li>';
        return;
    }

    courseList.innerHTML = courses.map(course => {
        const name = getCourseName(course);
        const code = sanitizeText(course.code || 'Sin código');
        return `<li><a href="#courses">${name}<span>${code}</span></a></li>`;
    }).join('');
}

function renderCourseCards(courses) {
    const courseCards = document.getElementById('course-cards');
    const courseCount = document.getElementById('course-count');
    if (courseCount) {
        courseCount.textContent = `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'}`;
    }
    if (!courseCards) return;

    if (courses.length === 0) {
        courseCards.innerHTML = `
            <div class="empty-state">
                <strong>Empieza uniéndote a tu primer curso</strong>
                <p>Usa el código que te compartió tu docente para acceder a sesiones, materiales y anuncios.</p>
            </div>
        `;
        return;
    }

    courseCards.innerHTML = courses.map((course, index) => {
        const progress = Math.min(95, 48 + index * 11);
        const name = getCourseName(course);
        const code = sanitizeText(course.code || 'Sin código');
        return `
            <article class="course-card">
                <div>
                    <span class="panel-tag">${code}</span>
                    <h3>${name}</h3>
                    <p>Próxima acción: revisar materiales y confirmar asistencia.</p>
                </div>
                <div class="progress-track" aria-label="Progreso ${progress}%">
                    <span style="width: ${progress}%"></span>
                </div>
                <button type="button" class="student-secondary-btn">Abrir curso</button>
            </article>
        `;
    }).join('');
}

function renderActiveSession(courses) {
    const activeSessionCard = document.getElementById('active-session-card');
    if (!activeSessionCard) return;

    const courseName = getCourseName(courses[0], 'Curso de introducción');
    activeSessionCard.innerHTML = `
        <div class="session-card">
            <span class="live-pill">En espera</span>
            <h3>${courseName}</h3>
            <p>No hay una sesión en vivo ahora. Te avisaremos cuando el docente active la clase.</p>
            <div class="session-details">
                <span>Audio ligero listo</span>
                <span>Chat disponible</span>
                <span>Modo ahorro compatible</span>
            </div>
            <button type="button" class="student-primary-btn">Preparar ingreso</button>
        </div>
    `;
}

function renderProgress(progress) {
    const progressPanel = document.getElementById('progress-panel');
    if (!progressPanel) return;

    const pending = Math.max(1, Math.round((100 - progress) / 18));
    progressPanel.innerHTML = `
        <div class="progress-summary">
            <div class="progress-ring" aria-label="Progreso general ${progress}%">${progress}%</div>
            <div>
                <h3>Vas en buen camino</h3>
                <p>Te quedan ${pending} actividades sugeridas para reforzar los temas con menor participación.</p>
            </div>
        </div>
        <div class="progress-track large" aria-label="Avance general ${progress}%">
            <span style="width: ${progress}%"></span>
        </div>
    `;
}

function renderResources(resources) {
    const resourceList = document.getElementById('resource-list');
    const searchInput = document.getElementById('repository-search');
    if (!resourceList) return;

    const paint = (items) => {
        resourceList.innerHTML = items.map(resource => `
            <li>
                <span class="resource-type">${sanitizeText(resource.type)}</span>
                <div>
                    <strong>${sanitizeText(resource.title)}</strong>
                    <p>${sanitizeText(resource.course)} · ${sanitizeText(resource.status)}</p>
                </div>
            </li>
        `).join('');
    };

    paint(resources);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const filtered = resources.filter(resource => {
                return `${resource.title} ${resource.course} ${resource.type}`.toLowerCase().includes(query);
            });
            paint(filtered.length ? filtered : [{ type: 'Info', title: 'Sin resultados', course: 'Repositorio', status: 'Prueba otro término' }]);
        });
    }
}

function renderMessages(courses) {
    const messageList = document.getElementById('message-list');
    if (!messageList) return;

    const firstCourse = getCourseName(courses[0], 'Curiosity');
    const messages = [
        { title: 'Bienvenida al espacio de aprendizaje', body: `Revisa los materiales iniciales de ${firstCourse}.`, time: 'Hoy' },
        { title: 'Consejo de conectividad', body: 'Activa Modo ahorro si tu conexión se vuelve inestable.', time: 'Fijado' },
        { title: 'Participación', body: 'Las actividades breves ayudan a mantener tu progreso visible.', time: 'Esta semana' }
    ];

    messageList.innerHTML = messages.map(message => `
        <li>
            <div>
                <strong>${message.title}</strong>
                <p>${message.body}</p>
            </div>
            <span>${message.time}</span>
        </li>
    `).join('');
}

function setupActions(user) {
    const enrollBtn = document.getElementById('enroll-course-btn');
    if (enrollBtn) {
        enrollBtn.addEventListener('click', async () => {
            const courseCode = prompt('Ingresa el código del curso:');
            if (!courseCode) return;

            try {
                await CourseService.enrollInCourse(courseCode.trim());
                alert('Te uniste al curso correctamente.');
                window.location.reload();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn && user.isGuest) {
        guestLoginBtn.hidden = false;
        guestLoginBtn.addEventListener('click', () => {
            AuthService.logout();
            window.location.href = ROUTES.LOGIN;
        });
    }

    const savingModeBtn = document.getElementById('saving-mode-btn');
    if (savingModeBtn) {
        savingModeBtn.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('saving-mode');
            savingModeBtn.setAttribute('aria-pressed', String(isActive));
        });
    }

    const simpleModeBtn = document.getElementById('simple-mode-btn');
    if (simpleModeBtn) {
        simpleModeBtn.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('simple-mode');
            simpleModeBtn.setAttribute('aria-pressed', String(isActive));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthService.isStudent()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = AuthService.getCurrentUser();
    const courses = CourseService.getStudentCourses();
    const displayName = sanitizeText(user.name || user.email || 'Estudiante');
    const classmateCount = getClassmateCount(courses, user.id);
    const progress = getProgressValue(courses);
    const resources = buildResources(courses);

    document.getElementById('student-welcome-title').textContent = `Hola, ${displayName}`;

    renderSidebarCourses(courses);
    renderMetrics(courses, classmateCount, progress);
    renderCourseCards(courses);
    renderActiveSession(courses);
    renderProgress(progress);
    renderResources(resources);
    renderMessages(courses);
    setupActions(user);
});
