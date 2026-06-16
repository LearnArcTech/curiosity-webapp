// dashboard-teacher.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';

function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getCourseName(course, fallback = 'Curso sin nombre') {
    return sanitizeText(course?.name || fallback);
}

function getAllTeacherStudents(courses) {
    const studentsById = new Map();
    courses.forEach(course => {
        DataService.getStudentsByCourse(course.id).forEach(student => {
            if (student?.id) {
                studentsById.set(student.id, student);
            }
        });
    });
    return Array.from(studentsById.values());
}

function getParticipationAverage(courses, studentCount) {
    if (courses.length === 0 || studentCount === 0) return 0;
    return Math.min(94, 52 + courses.length * 8 + Math.min(studentCount, 10) * 2);
}

function buildResources(courses) {
    if (courses.length === 0) {
        return [
            { type: 'Guía', title: 'Guía para crear tu primer curso', course: 'Primeros pasos', status: 'Plantilla' },
            { type: 'PDF', title: 'Buenas prácticas para baja conectividad', course: 'Ayuda docente', status: 'Ligero' },
            { type: 'Lista', title: 'Checklist de sesión virtual', course: 'Gestión de sesión', status: 'Editable' }
        ];
    }

    return courses.slice(0, 5).map((course, index) => ({
        type: index % 2 === 0 ? 'PDF' : 'Actividad',
        title: index % 2 === 0 ? `Material base de ${course.name}` : `Actividad breve de ${course.name}`,
        course: course.name || 'Curso',
        status: index % 2 === 0 ? 'Compartido' : 'Pendiente'
    }));
}

function renderSidebarCourses(courses) {
    const courseList = document.getElementById('course-list');
    if (!courseList) return;

    if (courses.length === 0) {
        courseList.innerHTML = '<li class="empty-nav-item">Aún no tienes cursos creados.</li>';
        return;
    }

    courseList.innerHTML = courses.map(course => {
        const students = DataService.getStudentsByCourse(course.id).length;
        return `
            <li>
                <a href="#courses">
                    ${getCourseName(course)}
                    <span>${sanitizeText(course.code || 'Sin código')} · ${students} estudiantes</span>
                </a>
            </li>
        `;
    }).join('');
}

function renderMetrics(courses, students, participationAverage) {
    const summaryCards = document.getElementById('summary-cards');
    if (!summaryCards) return;

    const activeAlerts = students.length > 0 ? Math.max(0, Math.ceil(students.length * 0.18)) : 0;
    const metrics = [
        { label: 'Cursos activos', value: courses.length, hint: 'Espacios gestionados' },
        { label: 'Estudiantes', value: students.length, hint: 'Inscritos en tus cursos' },
        { label: 'Participación', value: `${participationAverage}%`, hint: 'Promedio estimado' },
        { label: 'Alertas', value: activeAlerts, hint: 'Requieren seguimiento' }
    ];

    summaryCards.innerHTML = metrics.map(metric => `
        <article class="teacher-metric-card">
            <span class="metric-label">${metric.label}</span>
            <strong>${metric.value}</strong>
            <span class="metric-hint">${metric.hint}</span>
        </article>
    `).join('');
}

function renderAlerts(students) {
    const alertSummary = document.getElementById('alert-summary');
    const alertDetail = document.getElementById('alert-detail');
    if (!alertSummary || !alertDetail) return;

    if (students.length === 0) {
        alertSummary.textContent = 'Sin estudiantes inscritos';
        alertDetail.textContent = 'Crea un curso y comparte el código para empezar a monitorear participación y progreso.';
        return;
    }

    const alertCount = Math.max(1, Math.ceil(students.length * 0.18));
    alertSummary.textContent = `${alertCount} estudiante${alertCount === 1 ? '' : 's'} con seguimiento sugerido`;
    alertDetail.textContent = 'Revisa participación reciente y comparte materiales de refuerzo antes de la siguiente sesión.';
}

function renderCourseCards(courses) {
    const courseCards = document.getElementById('teacher-course-cards');
    const courseCount = document.getElementById('course-count');
    if (courseCount) {
        courseCount.textContent = `${courses.length} ${courses.length === 1 ? 'curso' : 'cursos'}`;
    }
    if (!courseCards) return;

    if (courses.length === 0) {
        courseCards.innerHTML = `
            <div class="empty-state">
                <strong>Crea tu primer curso</strong>
                <p>Configura un curso para compartir materiales, iniciar sesiones y monitorear el progreso de tus estudiantes.</p>
            </div>
        `;
        return;
    }

    courseCards.innerHTML = courses.map((course, index) => {
        const students = DataService.getStudentsByCourse(course.id).length;
        const progress = Math.min(96, 46 + students * 8 + index * 5);
        return `
            <article class="teacher-course-card">
                <div>
                    <span class="panel-tag">${sanitizeText(course.code || 'Sin código')}</span>
                    <h3>${getCourseName(course)}</h3>
                    <p>${students} estudiante${students === 1 ? '' : 's'} inscritos · ${progress}% de actividad estimada</p>
                </div>
                <div class="progress-track" aria-label="Actividad ${progress}%">
                    <span style="width: ${progress}%"></span>
                </div>
                <div class="teacher-card-actions">
                    <button type="button" class="teacher-secondary-btn">Abrir curso</button>
                    <button type="button" class="teacher-secondary-btn">Ver analítica</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderSessionTools(courses) {
    const sessionTools = document.getElementById('session-tools');
    if (!sessionTools) return;

    const activeCourse = getCourseName(courses[0], 'Curso por configurar');
    const tools = [
        { title: 'Lanzar cuestionario', body: 'Activa preguntas breves para medir atención durante la sesión.' },
        { title: 'Compartir archivo', body: 'Publica materiales ligeros para estudiantes con baja conectividad.' },
        { title: 'Enviar anuncio', body: `Comunica indicaciones rápidas a ${activeCourse}.` }
    ];

    sessionTools.innerHTML = tools.map(tool => `
        <button type="button" class="session-tool">
            <strong>${tool.title}</strong>
            <span>${tool.body}</span>
        </button>
    `).join('');
}

function renderAnalytics(students, participationAverage) {
    const analyticsPanel = document.getElementById('analytics-panel');
    if (!analyticsPanel) return;

    const riskCount = students.length > 0 ? Math.max(1, Math.ceil(students.length * 0.18)) : 0;
    analyticsPanel.innerHTML = `
        <div class="analytics-summary">
            <div class="analytics-score" aria-label="Participación promedio ${participationAverage}%">${participationAverage}%</div>
            <div>
                <h3>Participación general</h3>
                <p>${riskCount} estudiante${riskCount === 1 ? '' : 's'} podrían requerir apoyo preventivo.</p>
            </div>
        </div>
        <div class="progress-track large" aria-label="Participación general ${participationAverage}%">
            <span style="width: ${participationAverage}%"></span>
        </div>
    `;
}

function renderResources(resources) {
    const resourceList = document.getElementById('teacher-resource-list');
    const searchInput = document.getElementById('teacher-repository-search');
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

function renderMessages(courses, students) {
    const messageList = document.getElementById('teacher-message-list');
    if (!messageList) return;

    const courseName = getCourseName(courses[0], 'tu curso principal');
    const messages = [
        { title: 'Recordatorio de sesión', body: `Programa una actividad breve para ${courseName}.`, time: 'Hoy' },
        { title: 'Repositorio', body: 'Los materiales ligeros ayudan a estudiantes con conexión inestable.', time: 'Fijado' },
        { title: 'Seguimiento', body: `${students.length} estudiante${students.length === 1 ? '' : 's'} visibles en tus cursos.`, time: 'Esta semana' }
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

function setupActions() {
    const createCourse = async () => {
        const courseName = prompt('Ingresa el nombre del curso:');
        if (!courseName) return;

        try {
            await CourseService.createCourse({ name: courseName.trim() });
            alert('Curso creado correctamente.');
            window.location.reload();
        } catch (error) {
            alert(error.message);
        }
    };

    const newCourseBtn = document.getElementById('new-course-btn');
    const quickCourseBtn = document.getElementById('quick-course-btn');
    if (newCourseBtn) newCourseBtn.addEventListener('click', createCourse);
    if (quickCourseBtn) quickCourseBtn.addEventListener('click', createCourse);

    const publishResourceBtn = document.getElementById('publish-resource-btn');
    if (publishResourceBtn) {
        publishResourceBtn.addEventListener('click', () => {
            alert('La carga de materiales estará disponible en la siguiente iteración.');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthService.isTeacher()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = AuthService.getCurrentUser();
    const courses = CourseService.getTeacherCourses();
    const students = getAllTeacherStudents(courses);
    const participationAverage = getParticipationAverage(courses, students.length);
    const resources = buildResources(courses);
    const displayName = sanitizeText(user.name || user.email || 'Usuario');

    document.getElementById('teacher-welcome-title').textContent = `Hola, ${displayName}`;

    renderSidebarCourses(courses);
    renderMetrics(courses, students, participationAverage);
    renderAlerts(students);
    renderCourseCards(courses);
    renderSessionTools(courses);
    renderAnalytics(students, participationAverage);
    renderResources(resources);
    renderMessages(courses, students);
    setupActions();
});
