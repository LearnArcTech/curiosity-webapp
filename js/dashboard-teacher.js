import { AuthService, CourseService, DataService, ApiClient } from './services.js';
import { ROUTES } from './config.js';

const demoCourses = [
    { id: 'demo-science', name: 'Ciencia y tecnología', code: '5632' },
    { id: 'demo-math', name: 'Razonamiento matematico', code: '4244' }
];

const demoStudents = [
    { id: 'st-1', name: 'Emma Rojas', courseCode: '4244', score: 18, attendance: 96, status: 'Destacada' },
    { id: 'st-2', name: 'Liam Torres', courseCode: '4244', score: 16, attendance: 88, status: 'Regular' },
    { id: 'st-3', name: 'Mateo Flores', courseCode: '4244', score: 15, attendance: 78, status: 'Seguimiento' },
    { id: 'st-4', name: 'Sofia Diaz', courseCode: '5632', score: 19, attendance: 98, status: 'Destacada' },
    { id: 'st-5', name: 'Santiago Vega', courseCode: '5632', score: 13, attendance: 68, status: 'Riesgo' },
    { id: 'st-6', name: 'Mia Castro', courseCode: '4244', score: 17, attendance: 91, status: 'Regular' },
    { id: 'st-7', name: 'Juan Paredes', courseCode: '5632', score: 14, attendance: 72, status: 'Seguimiento' }
];

function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatCourseName(course, fallback = 'Curso sin nombre') {
    return sanitizeText(course?.name || fallback);
}

function getDisplayCourses(courses) {
    return courses.length ? courses : demoCourses;
}

function getStudentsForCourse(course) {
    const realStudents = course?.id && !course.id.startsWith('demo-')
        ? DataService.getStudentsByCourse(course.id)
        : [];

    if (realStudents.length) {
        return realStudents.map((student, index) => ({
            id: student.id,
            name: student.name || student.email || `Estudiante ${index + 1}`,
            courseCode: course.code || 'Sin código',
            score: Math.min(20, 12 + index + realStudents.length),
            attendance: Math.min(99, 70 + index * 4),
            status: index % 4 === 0 ? 'Seguimiento' : 'Regular'
        }));
    }

    return demoStudents.filter(student => student.courseCode === (course?.code || '4244'));
}

function getAllTeacherStudents(courses) {
    const studentsById = new Map();
    getDisplayCourses(courses).forEach(course => {
        getStudentsForCourse(course).forEach(student => studentsById.set(student.id, student));
    });
    return Array.from(studentsById.values());
}

function calculateMetrics(courses, students) {
    const attendance = students.length
        ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
        : 0;
    const participation = students.length
        ? (students.reduce((sum, student) => sum + student.score, 0) / students.length).toFixed(1)
        : '0.0';

    return [
        { label: 'Asistencia promedio', value: attendance ? `${attendance}%` : '20.6' },
        { label: 'Puntaje de participación promedio', value: `${participation}/20` },
        { label: 'Duracion promedio de sesiones', value: '1h 30m' },
        { label: 'Estudiantes en seguimiento', value: students.filter(student => student.status !== 'Regular' && student.status !== 'Destacada').length }
    ];
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

function renderConnectionStatus(students) {
    const target = document.getElementById('teacher-connection-status');
    if (!target) return;

    const unstable = Math.max(1, Math.round(students.length * 0.18));
    target.innerHTML = `
        <strong>Conexión del grupo</strong>
        <span>${unstable} estudiante${unstable === 1 ? '' : 's'} con senal inestable</span>
    `;
}

function renderMetrics(metrics) {
    const summaryCards = document.getElementById('summary-cards');
    if (!summaryCards) return;

    summaryCards.innerHTML = metrics.map(metric => `
        <article class="summary-card">
            <span>${sanitizeText(metric.label)}</span>
            <strong>${sanitizeText(metric.value)}</strong>
        </article>
    `).join('');
}

function renderPodium(students) {
    const target = document.getElementById('participation-podium');
    if (!target) return;

    const top = [...students].sort((a, b) => b.score - a.score).slice(0, 3);
    while (top.length < 3) top.push(demoStudents[top.length]);

    target.innerHTML = `
        <div class="podium-chart" aria-label="Top de participación">
            <div class="podium-place second">
                <span class="avatar">${sanitizeText(top[1].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[1].score}</span></div>
                <small>${sanitizeText(top[1].name.split(' ')[0])}</small>
            </div>
            <div class="podium-place first">
                <span class="avatar">${sanitizeText(top[0].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[0].score}</span></div>
                <small>${sanitizeText(top[0].name.split(' ')[0])}</small>
            </div>
            <div class="podium-place third">
                <span class="avatar">${sanitizeText(top[2].name.charAt(0))}</span>
                <div class="podium-bar"><span>${top[2].score}</span></div>
                <small>${sanitizeText(top[2].name.split(' ')[0])}</small>
            </div>
        </div>
    `;
}

function buildResources(courses) {
    const displayCourses = getDisplayCourses(courses);
    return [
        {
            title: `Clase 2026-04-07 | ${displayCourses[1]?.name || 'Razonamiento matematico'}`,
            size: '50MB',
            progress: 94,
            tag: 'Publicado',
            folder: 'Sesión 01'
        },
        {
            title: `Clase 2026-05-01 | ${displayCourses[0]?.name || 'Ciencia y tecnología'}`,
            size: '20MB',
            progress: 58,
            tag: 'Programado',
            folder: 'Material previo'
        },
        {
            title: `Práctica.xlsx | ${displayCourses[0]?.name || 'Ciencia y tecnología'}`,
            size: '1MB',
            progress: 21,
            tag: 'Actualizado',
            folder: 'Evaluaciones'
        }
    ];
}

function normalizeResources(resources, courses) {
    if (!resources?.length) return buildResources(courses);
    return resources.map((resource, index) => ({
        title: resource.title || resource.name || `Material ${index + 1}`,
        size: resource.size || '0MB',
        progress: Number(resource.progress ?? Math.min(96, 24 + index * 16)),
        tag: resource.tag || resource.status || 'Publicado',
        folder: resource.folder || resource.kind || 'Repositorio'
    }));
}

function renderResources(resources) {
    const resourceList = document.getElementById('teacher-resource-list');
    const searchInput = document.getElementById('teacher-repository-search');
    if (!resourceList) return;

    const paint = (items) => {
        resourceList.innerHTML = items.map(resource => `
            <article class="repo-card">
                <div class="repo-card-top">
                    <strong>${sanitizeText(resource.title)}</strong>
                    <span>${sanitizeText(resource.size)}</span>
                </div>
                <div class="repo-track" aria-label="Uso ${resource.progress}%">
                    <span style="width: ${resource.progress}%"></span>
                </div>
                <div class="repo-meta">
                    <span>${sanitizeText(resource.folder)}</span>
                    <span>${sanitizeText(resource.tag)}</span>
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
            paint(filtered.length ? filtered : [{ title: 'Sin resultados', size: '0MB', progress: 0, folder: 'Repositorio', tag: 'Prueba otro filtro' }]);
        });
    }
}

function renderRoster(students) {
    const roster = document.getElementById('student-roster');
    const courseCount = document.getElementById('course-count');
    if (courseCount) {
        const risk = students.filter(student => student.status === 'Riesgo' || student.status === 'Seguimiento').length;
        courseCount.textContent = `${risk} alertas`;
    }
    if (!roster) return;

    roster.innerHTML = students.slice(0, 7).map(student => `
        <div class="roster-row ${student.status === 'Riesgo' ? 'risk' : ''}">
            <span class="person-icon" aria-hidden="true"></span>
            <strong>${sanitizeText(student.name.split(' ')[0])}</strong>
            <span>${sanitizeText(student.courseCode)}</span>
        </div>
    `).join('');
}

function renderSessionTools() {
    const toolsTarget = document.getElementById('session-tools');
    if (!toolsTarget) return;

    const tools = [
        { title: 'Cuestionario rápido', body: 'Lanza 3 preguntas y conserva respuestas pendientes si falla la red.', href: 'meeting.html' },
        { title: 'Encuesta express', body: 'Mide comprension o ánimo del grupo en tiempo real.', href: 'meeting.html' },
        { title: 'Pizarra colaborativa', body: 'Activa anotaciones para resolver ejercicios visualmente.', href: 'meeting.html' },
        { title: 'Grupos de trabajo', body: 'Divide estudiantes para actividades breves.', href: 'course.html?view=create-session' },
        { title: 'Temporizador', body: 'Muestra tiempo restante durante una actividad.', href: 'meeting.html' },
        { title: 'Compartir pantalla', body: 'Presenta ejemplos o recursos de apoyo.', href: 'meeting.html' },
        { title: 'Teacher Prompt IA', body: 'Genera una actividad interactiva y guardala en repositorio.', href: 'meeting.html' }
    ];

    toolsTarget.innerHTML = tools.map(tool => `
        <a class="tool-card" href="${tool.href}">
            <strong>${sanitizeText(tool.title)}</strong>
            <span>${sanitizeText(tool.body)}</span>
        </a>
    `).join('');

    toolsTarget.querySelectorAll('a').forEach(link => link.setAttribute('aria-label', link.textContent.trim()));
}

function renderReports(students) {
    const reports = document.getElementById('reports-panel');
    const alertSummary = document.getElementById('alert-summary');
    const alertDetail = document.getElementById('alert-detail');
    if (!reports) return;

    const riskStudents = students.filter(student => student.status === 'Riesgo' || student.status === 'Seguimiento');
    if (alertSummary) {
        alertSummary.textContent = riskStudents.length
            ? `${riskStudents.length} alertas activas`
            : 'Sin alertas críticas';
    }
    if (alertDetail) {
        alertDetail.textContent = riskStudents.length
            ? 'Se detectaron estudiantes con baja actividad o asistencia. Puedes enviar seguimiento o justificar el caso.'
            : 'El grupo mantiene actividad suficiente para continuar sin intervenciones urgentes.';
    }

    reports.innerHTML = `
        <div class="report-actions">
            <button type="button" class="outline-action">Reporte de asistencia</button>
            <button type="button" class="outline-action">Exportar rendimiento</button>
            <button type="button" class="outline-action">Comparar cuestionarios</button>
        </div>
        <div class="risk-list">
            ${riskStudents.slice(0, 3).map(student => `
                <article>
                    <strong>${sanitizeText(student.name)}</strong>
                    <span>${student.attendance}% asistencia · ${sanitizeText(student.status)}</span>
                    <button type="button" class="text-action">Marcar justificado</button>
                </article>
            `).join('') || '<p class="panel-note">No hay estudiantes en riesgo con la información actual.</p>'}
        </div>
    `;
}

function renderMessages(courses, backendMessages = null) {
    const messageList = document.getElementById('teacher-message-list');
    if (!messageList) return;

    const courseName = formatCourseName(getDisplayCourses(courses)[0], 'tu curso principal');
    const messages = backendMessages || [
        { title: 'Anuncio publicado', body: `Material previo disponible para ${courseName}.`, time: 'Hoy' },
        { title: 'Historial de dudas', body: '3 conversaciones resueltas quedaron guardadas en el curso.', time: 'Fijado' },
        { title: 'Mensaje preventivo', body: 'Se envio recordatorio a estudiantes con baja actividad.', time: 'Esta semana' }
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

    document.getElementById('new-course-btn')?.addEventListener('click', createCourse);
    document.getElementById('quick-course-btn')?.addEventListener('click', createCourse);

    document.getElementById('publish-resource-btn')?.addEventListener('click', () => {
        alert('Material publicado. Puedes actualizarlo, etiquetarlo o programar su disponibilidad desde el repositorio.');
    });

    document.getElementById('teacher-text-size-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('large-text');
    });
    document.getElementById('teacher-contrast-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
    });
    document.getElementById('teacher-tour-btn')?.addEventListener('click', () => {
        alert('Guía inicial: revisa Resumen, abre un curso, lanza una actividad y publica materiales ligeros.');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isTeacher()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    let dashboard = null;
    try {
        dashboard = await ApiClient.get('/api/dashboard/teacher');
    } catch (error) {
        console.warn('Dashboard docente desde backend no disponible:', error.message);
    }

    const courses = dashboard?.courses || await CourseService.getTeacherCoursesAsync();
    const students = dashboard?.students || getAllTeacherStudents(courses);
    const metrics = dashboard?.metrics || calculateMetrics(courses, students);
    const resources = normalizeResources(dashboard?.resources, courses);

    renderSidebarCourses(courses);
    renderConnectionStatus(students);
    renderMetrics(metrics);
    renderPodium(students);
    renderResources(resources);
    renderRoster(students);
    renderSessionTools();
    renderReports(students);
    renderMessages(courses, dashboard?.messages);
    setupActions();
});
