// dashboard-student-course-sessions.js
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
    if (!AuthService.isStudent()) {
        window.location.href = '../login.html';
        return;
    }

    const validation = await validateCourseAccess(false, true);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const studentCourses = await CourseService.getStudentCourses();

    // Set course title
    setCourseTitle('course-title', course);

    // Populate course list
    populateCourseList('course-list', studentCourses, courseId, false);

    // Setup navigation
    setupCourseNavigation(courseId, false);

    // Display sessions content
    await displaySessionsContent(courseId);
});

async function displaySessionsContent(courseId) {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    const sessions = await getMockSessions(courseId);

    if (sessions.length === 0) {
        container.innerHTML = '<p>No hay sesiones registradas para este curso.</p>';
        return;
    }

    container.innerHTML = `
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
                    </div>
                `;
    }).join('')}
        </div>
    `;
}
