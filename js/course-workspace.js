import { AuthService, CourseService, ApiClient } from './services.js';
import { ROUTES } from './config.js';

const demoCourses = [
    { id: 'science', name: 'Ciencia y tecnología', code: '5632' },
    { id: 'math', name: 'Razonamiento matematico', code: '4244' }
];

const moduleGroups = {
    teacher: [
        {
            key: 'progress',
            label: 'Progreso',
            items: [
                ['overview', 'Resumen'],
                ['rankings', 'Ranking de quizes'],
                ['participation', 'Participacion'],
                ['reports', 'Reportes']
            ]
        },
        {
            key: 'sessions',
            label: 'Sesiones',
            items: [
                ['sessions', 'Historial de sesiones'],
                ['create-session', 'Crear sesion']
            ]
        },
        {
            key: 'repository',
            label: 'Repositorio',
            items: [
                ['files', 'Busqueda de archivos'],
                ['downloads', 'Administrador de descargas']
            ]
        },
        {
            key: 'config',
            label: 'Configuracion',
            items: [['config', 'Configuracion']]
        }
    ],
    student: [
        {
            key: 'progress',
            label: 'Progreso',
            items: [
                ['overview', 'Resumen'],
                ['rankings', 'Ranking de quizes'],
                ['participation', 'Participacion'],
                ['reports', 'Reportes']
            ]
        },
        {
            key: 'sessions',
            label: 'Sesiones',
            items: [
                ['sessions', 'Historial de sesiones'],
                ['create-session', 'Crear sesion']
            ]
        },
        {
            key: 'repository',
            label: 'Repositorio',
            items: [
                ['files', 'Busqueda de archivos'],
                ['downloads', 'Administrador de descargas']
            ]
        },
        {
            key: 'config',
            label: 'Configuracion',
            items: [['config', 'Salir del curso']]
        }
    ]
};

const students = [
    ['Emma', 96, 18.4, 'Destacada'],
    ['Liam', 86, 17.0, 'Regular'],
    ['Mateo', 72, 15.8, 'Seguimiento'],
    ['Sofia', 98, 18.8, 'Destacada'],
    ['Santiago', 68, 13.5, 'Riesgo'],
    ['Mia', 91, 16.9, 'Regular'],
    ['Juan', 75, 14.8, 'Seguimiento']
];

const files = [
    ['Clase 2026-04-07.pdf', 'PDF', '50MB', 'Disponible offline', 92],
    ['Clase 2026-05-01.pdf', 'PDF', '20MB', 'Programado', 58],
    ['Práctica.xlsx', 'Hoja', '1MB', 'Actualizado', 24],
    ['Guía rápida de sesión.txt', 'Texto', '120KB', 'Ligero', 12]
];

let workspaceData = null;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

function currentView() {
    return new URLSearchParams(location.search).get('view') || 'overview';
}

function getRole() {
    const user = AuthService.getCurrentUser();
    return user?.role === 'teacher' ? 'teacher' : 'student';
}

function getCourses(role) {
    const courses = role === 'teacher' ? CourseService.getTeacherCourses() : CourseService.getStudentCourses();
    return courses.length ? courses : demoCourses;
}

function getActiveModuleGroup(role, view) {
    return moduleGroups[role].find(group => group.items.some(([key]) => key === view)) || moduleGroups[role][0];
}

function renderShell(role, courses, view) {
    document.querySelector('[data-dashboard-link]').href = role === 'teacher' ? 'dashboard-teacher.html' : 'dashboard-student.html';
    document.getElementById('active-course-title').textContent = courses[0]?.name || 'Curso';

    document.getElementById('course-list').innerHTML = courses.map((course, index) => `
        <a href="course.html?view=overview&course=${escapeHtml(course.id)}" class="${index === 0 ? 'active' : ''}">
            ${escapeHtml(course.name)}
            <span>${escapeHtml(course.code || 'Sin código')}</span>
        </a>
    `).join('');

    const activeGroup = getActiveModuleGroup(role, view);
    document.getElementById('module-list').innerHTML = moduleGroups[role].map(group => {
        const firstItem = group.items[0];
        const isConfig = group.key === 'config';
        const isOpen = group.key === activeGroup.key && !isConfig;
        return `
            <section class="module-group ${isOpen ? 'is-open' : ''} ${group.key === activeGroup.key ? 'is-active' : ''}">
                <a href="course.html?view=${firstItem[0]}" class="module-group-title ${isConfig ? 'module-config-link' : ''}">
                    ${escapeHtml(group.label)}
                </a>
                ${isOpen ? `
                    <div class="module-sublist">
                        ${group.items.map(([key, label]) => `
                            <a href="course.html?view=${key}" class="module-subitem ${view === key ? 'active' : ''}">
                                ${escapeHtml(label)}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </section>
        `;
    }).join('');
}

function openModal(title, body, primary = 'Confirmar') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-primary').textContent = primary;
    document.getElementById('app-modal').hidden = false;
}

function bindModal() {
    const close = () => {
        document.getElementById('app-modal').hidden = true;
    };
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-primary').addEventListener('click', close);
    document.getElementById('app-modal').addEventListener('click', (event) => {
        if (event.target.id === 'app-modal') close();
    });
}

function renderOverview(role) {
    return `
        <div class="workspace-toolbar">
            <h2>Resumen del curso</h2>
            <a class="app-button" href="meeting.html">Entrar a reunion</a>
        </div>
        <div class="content-grid">
            <article class="stat-card"><span>Asistencia promedio</span><strong>84%</strong><span class="muted">Ultimas 4 sesiones</span></article>
            <article class="stat-card"><span>Participación promedio</span><strong>16.8/20</strong><span class="muted">Cuestionarios y reacciones</span></article>
            <article class="stat-card"><span>Materiales disponibles</span><strong>12</strong><span class="muted">4 con versión ligera</span></article>
        </div>
        <section class="content-grid two" style="margin-top:14px">
            <article class="panel">
                <h3>Próxima sesión</h3>
                <p class="muted">Clase 5B · 10:45 AM · modo adaptable listo para baja conexión.</p>
                <div class="button-row">
                    <a class="ghost-button" href="join-session.html">Previsualizar ingreso</a>
                    ${role === 'teacher' ? '<a class="ghost-button" href="course.html?view=create-session">Editar sesión</a>' : ''}
                </div>
            </article>
            <article class="panel">
                <h3>Actividad recomendada</h3>
                <p class="muted">${role === 'teacher' ? 'Genera un quiz rápido y guarda el resultado en reportes.' : 'Completa el quiz rápido para subir en el ranking.'}</p>
                <div class="progress-track"><span style="width:68%"></span></div>
            </article>
        </section>
    `;
}

function renderCreateSession() {
    return `
        <h2>Crear sesión</h2>
        <section class="panel">
            <label>Nombre de la sesión</label>
            <input class="app-input full-width" value="Clase 2026-06-20 | Ciencia y tecnología">
            <div class="field-row" style="margin-top:12px">
                <label><input type="checkbox" checked> Avisar estudiantes</label>
                <label><input type="checkbox" checked> Solo audio si hay baja conexión</label>
                <label><input type="checkbox"> Sala con grupos de trabajo</label>
            </div>
            <div class="field-row" style="margin-top:12px">
                <input class="app-input" placeholder="Fecha" value="2026-06-20">
                <input class="app-input" placeholder="Hora" value="10:45">
                <select class="app-select"><option>Ciencia y tecnología</option><option>Razonamiento matematico</option></select>
            </div>
            <textarea class="app-textarea" style="margin-top:12px" placeholder="Indicaciones">Traer cuaderno y revisar el material previo disponible offline.</textarea>
            <div class="button-row" style="margin-top:12px">
                <button class="app-button" data-toast="Sesión creada y notificada a estudiantes.">Crear sesión</button>
                <button class="ghost-button" data-modal="teacher-prompt">Generar actividad con IA</button>
            </div>
        </section>
    `;
}

function renderFiles(role) {
    const fileRows = workspaceData?.files?.length
        ? workspaceData.files.map(file => [file.name, file.kind, file.size, file.status, file.progress])
        : files;

    return `
        <div class="workspace-toolbar">
            <h2>Busqueda de archivos</h2>
            <button class="app-button" data-modal="upload">Importar archivo</button>
        </div>
        <div class="field-row" style="margin-bottom:12px">
            <input class="app-input" placeholder="Buscar" value="">
            <select class="app-select"><option>Todos los tipos</option><option>PDF</option><option>Videos</option><option>Presentaciones</option></select>
            <select class="app-select"><option>Más recientes</option><option>Disponibles offline</option><option>Más ligeros</option></select>
        </div>
        <div class="content-grid">
            ${fileRows.slice(0, 3).map(file => `
                <article class="file-card">
                    <span class="file-icon" aria-hidden="true"></span>
                    <strong>${escapeHtml(file[0])}</strong>
                    <span class="muted">${escapeHtml(file[1])} · ${escapeHtml(file[2])}</span>
                    <div class="button-row">
                        <button class="ghost-button" data-modal="preview">Previsualizar</button>
                        ${role === 'teacher' ? '<button class="ghost-button" data-toast="Material actualizado.">Actualizar</button>' : '<button class="ghost-button" data-toast="Material guardado para revisar sin conexión.">Offline</button>'}
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function renderDownloads() {
    const fileRows = workspaceData?.files?.length
        ? workspaceData.files.map(file => [file.name, file.kind, file.size, file.status, file.progress])
        : files;

    return `
        <h2>Administrador de descargas</h2>
        <div class="field-row" style="margin-bottom:12px">
            <input class="app-input full-width" placeholder="Buscar" value="Materiales 2026">
        </div>
        <section class="table-panel">
            <table class="app-table">
                <thead><tr><th>Archivo</th><th>Estado</th><th>Progreso</th></tr></thead>
                <tbody>
                    ${fileRows.map(file => `
                        <tr>
                            <td>${escapeHtml(file[0])}</td>
                            <td>${escapeHtml(file[3])}</td>
                            <td><div class="progress-track"><span style="width:${file[4]}%"></span></div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    `;
}

function renderReports() {
    return `
        <div class="workspace-toolbar">
            <h2>Reportes</h2>
            <button class="app-button" data-modal="report">Importar reporte</button>
        </div>
        <div class="field-row" style="margin-bottom:12px">
            <input class="app-input" placeholder="Buscar">
            <select class="app-select"><option>Todos</option><option>Asistencia</option><option>Notas</option></select>
        </div>
        <div class="content-grid">
            ${['NOTAS 2026-04-03', 'ASISTENCIA 2026-04-10', 'NOTAS 2026-04-15', 'REPORTE 2026-04-21'].map((name, index) => `
                <article class="report-card">
                    <div style="height:95px;background:#9BEACF;border:1px solid var(--curiosity-border)"></div>
                    <strong>${name}</strong>
                    <span class="muted">${index % 2 ? 'Escaneado y procesado' : 'Listo para exportar'}</span>
                    <button class="ghost-button" data-toast="Reporte exportado localmente.">Exportar</button>
                </article>
            `).join('')}
        </div>
    `;
}

function renderParticipation() {
    const rows = workspaceData?.students?.length
        ? workspaceData.students.map(student => [student.name, student.attendance, student.score, student.status])
        : students;

    return `
        <h2>Participación</h2>
        <div class="field-row" style="margin-bottom:12px">
            <input class="app-input" placeholder="Buscar">
            <select class="app-select"><option>Por puntaje</option><option>Por asistencia</option><option>En riesgo</option></select>
        </div>
        <section class="table-panel">
            <table class="app-table">
                <thead><tr><th></th><th>Nombre</th><th>Participación</th></tr></thead>
                <tbody>${rows.map(row => `<tr><td><span class="file-icon" style="height:24px;width:22px"></span></td><td>${row[0]}</td><td>${row[2]}</td></tr>`).join('')}</tbody>
            </table>
        </section>
    `;
}

function renderRankings(role) {
    return `
        <h2>Rankings</h2>
        <section class="content-grid two">
            <article class="panel">
                <h3>${role === 'student' ? 'Tu posicion #5' : 'Ranking del curso'}</h3>
                <section class="table-panel">
                    <table class="app-table">
                        <thead><tr><th></th><th>Nombre</th><th>Puntaje</th></tr></thead>
                        <tbody>${students.map(row => `<tr><td><span class="file-icon" style="height:22px;width:20px"></span></td><td>${row[0]}</td><td>${row[2]}</td></tr>`).join('')}</tbody>
                    </table>
                </section>
            </article>
            <article class="panel">
                <h3>Podio de quizzes</h3>
                <div class="podium-small">
                    <div><b>18</b><span>Emma</span></div>
                    <div><b>19</b><span>Sofia</span></div>
                    <div><b>17</b><span>Liam</span></div>
                </div>
            </article>
        </section>
    `;
}

function renderGrades() {
    const rows = [
        ['2026-04-03', 'Quiz', '17.5'],
        ['2026-04-10', 'Participación', '18.4'],
        ['2026-04-17', 'Quiz', '16.8'],
        ['2026-05-01', 'Presentacion', '18.0'],
        ['2026-05-15', 'Quiz', '16.4']
    ];
    return `
        <h2>Historial de notas</h2>
        <section class="table-panel">
            <table class="app-table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Puntaje</th></tr></thead>
                <tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('')}</tbody>
            </table>
        </section>
    `;
}

function renderSessions() {
    const rows = workspaceData?.sessions?.length
        ? workspaceData.sessions.map(session => [session.date, session.duration, session.status, session.size])
        : [
        ['2026-04-03', '80 min', 'Grabacion', '20MB'],
        ['2026-04-10', '95 min', 'Sincronizado', '50MB'],
        ['2026-04-17', '70 min', 'Audio ligero', '8MB'],
        ['2026-05-01', '90 min', 'Grabacion', '32MB']
    ];
    return `
        <h2>Historial sesiones</h2>
        <section class="table-panel">
            <table class="app-table">
                <thead><tr><th>Fecha</th><th>Tiempo</th><th>Estado</th><th>Peso</th></tr></thead>
                <tbody>${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`).join('')}</tbody>
            </table>
        </section>
    `;
}

function renderAchievements() {
    const rows = [
        ['Logro de constancia', '2026-04-03'],
        ['Racha de participación', '2026-04-10'],
        ['Primer lugar en quiz', '2026-05-01']
    ];
    return `
        <h2>Historial de logros</h2>
        <section class="table-panel">
            <table class="app-table">
                <thead><tr><th></th><th>Nombre del logro</th><th>Fecha</th></tr></thead>
                <tbody>${rows.map(row => `<tr><td><span class="file-icon" style="height:22px;width:20px"></span></td><td>${row[0]}</td><td>${row[1]}</td></tr>`).join('')}</tbody>
            </table>
        </section>
    `;
}

function renderConfig(role) {
    return role === 'teacher'
        ? `
            <h2>Configuración</h2>
            <section class="panel">
                <label>Nombre de curso</label>
                <input class="app-input" value="Ciencia y tecnología">
                <div class="button-row" style="margin-top:12px">
                    <button class="app-button" data-toast="Configuración guardada.">Guardar cambios</button>
                    <button class="danger-button" data-modal="delete-course">Eliminar curso</button>
                </div>
            </section>
        `
        : `
            <h2>Configuración</h2>
            <section class="panel">
                <h3>Salir del curso?</h3>
                <p class="muted">Puedes volver a unirte usando el código de invitacion si el docente lo mantiene activo.</p>
                <button class="danger-button" data-modal="leave-course">Salir del curso</button>
            </section>
        `;
}

function renderView(role, view) {
    const root = document.getElementById('view-root');
    const renderers = {
        overview: () => renderOverview(role),
        'create-session': renderCreateSession,
        files: () => renderFiles(role),
        downloads: renderDownloads,
        reports: renderReports,
        participation: renderParticipation,
        rankings: () => renderRankings(role),
        grades: renderGrades,
        sessions: renderSessions,
        achievements: renderAchievements,
        config: () => renderConfig(role)
    };
    root.innerHTML = (renderers[view] || renderers.overview)();
}

function bindActions() {
    document.querySelectorAll('[data-toast]').forEach(button => {
        button.addEventListener('click', () => alert(button.dataset.toast));
    });
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.modal;
            if (type === 'upload') {
                openModal('Importar archivo', '<div class="drop-zone">Arrastra un archivo aquí o haz click para subir uno</div>', 'Subir archivo');
            } else if (type === 'report') {
                openModal('Importar reporte', '<div class="drop-zone">Arrastra una foto o documento para escanear</div><label><input type="checkbox" checked> Procesar con OCR mock</label>', 'Generar reporte');
            } else if (type === 'teacher-prompt') {
                openModal('Teacher Prompt', '<textarea class="app-textarea">Genera un ejemplo interactivo sobre el ciclo del agua.</textarea>', 'Guardar en repositorio');
            } else if (type === 'delete-course') {
                openModal('Eliminar curso', '<p class="notice">Esta accion queda simulada localmente. No se eliminara información real.</p>', 'Si, eliminar');
            } else if (type === 'leave-course') {
                openModal('Salir del curso', '<p class="notice">Esta accion queda simulada localmente. Podras volver con código.</p>', 'Si, sacame de aquí');
            } else {
                openModal('Previsualizar material', '<p>Vista previa ligera del archivo seleccionada para dispositivos de bajos recursos.</p>', 'Cerrar');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isAuthenticated()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const role = getRole();
    const view = currentView();
    const queryCourse = new URLSearchParams(location.search).get('course');
    try {
        workspaceData = await ApiClient.get(`/api/workspace${queryCourse ? `?course=${encodeURIComponent(queryCourse)}` : ''}`);
    } catch (error) {
        console.warn('Workspace desde backend no disponible:', error.message);
    }
    const courses = workspaceData?.courses || (role === 'teacher'
        ? await CourseService.getTeacherCoursesAsync()
        : await CourseService.getStudentCoursesAsync());
    const displayCourses = courses.length ? courses : getCourses(role);
    renderShell(role, displayCourses, view);
    renderView(role, view);
    bindModal();
    bindActions();
});
