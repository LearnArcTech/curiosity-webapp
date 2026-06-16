// dashboard-teacher-course-sessions.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';
import {
    sanitizeText,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    getMockSessions,
    formatDate
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isTeacher()) {
        window.location.href = '../login.html';
        return;
    }

    const validation = await validateCourseAccess(true, false);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = await AuthService.getCurrentUser();
    const teacherCourses = await CourseService.getTeacherCourses();

    // Set course title
    setCourseTitle('course-title', course);

    // Populate course list
    populateCourseList('course-list', teacherCourses, courseId, true);

    // Setup new course button
    const newCourseBtn = document.getElementById('new-course-btn');
    if (newCourseBtn) {
        newCourseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const courseName = prompt('Enter course name:');
            if (courseName) {
                CourseService.createCourse({ name: courseName.trim() })
                    .then(() => {
                        alert('Course created successfully!');
                        window.location.reload();
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            }
        });
    }

    // Setup navigation
    setupCourseNavigation(courseId, true);

    // Display sessions content
    await displaySessionsContent(courseId);
});

async function displaySessionsContent(courseId) {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    const sessions = getMockSessions(courseId);
    const students = await DataService.getStudentsByCourse(courseId);

    container.innerHTML = `
        <div class="session-header">
            <button id="create-session-btn" class="primary-btn">Crear Nueva Sesion</button>
        </div>
        <div class="sessions-grid">
            ${sessions.map(session => {
        const statusClass = session.status === 'completed' ? 'completed' :
            session.status === 'scheduled' ? 'scheduled' : 'pending';
        return `
                    <div class="session-card ${statusClass}">
                        <h3>${sanitizeText(session.name)}</h3>
                        <p><strong>Fecha:</strong> ${formatDate(session.date)}</p>
                        <p><strong>Duracion:</strong> ${session.duration}</p>
                        <p><strong>Estado:</strong> ${session.status === 'completed' ? 'Completada' :
                session.status === 'scheduled' ? 'Programada' : 'Pendiente'}</p>
                        <p><strong>Asistencia:</strong> ${Math.floor(Math.random() * 20) + 10}/${students.length} estudiantes</p>
                        <div class="session-actions">
                            <button class="edit-btn" data-session-id="${session.id}">Editar</button>
                            <button class="delete-btn" data-session-id="${session.id}">Eliminar</button>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Add event listener for create session button
    const createSessionBtn = document.getElementById('create-session-btn');
    if (createSessionBtn) {
        createSessionBtn.addEventListener('click', () => {
            alert('Funcionalidad de crear sesion - en desarrollo');
        });
    }

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.target.getAttribute('data-session-id');
            alert(`Editar sesion ${sessionId} - en desarrollo`);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.target.getAttribute('data-session-id');
            if (confirm('¿Estas seguro de que quieres eliminar esta sesion?')) {
                alert(`Sesion ${sessionId} eliminada - en desarrollo`);
            }
        });
    });
}
