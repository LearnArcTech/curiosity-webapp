// dashboard-student-course-progress.js
import { AuthService, CourseService, DataService } from './services.js';
import {
    sanitizeText,
    getInitials,
    getCourseIdFromUrl,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    getMockGrades,
    getMockAchievements
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isStudent()) {
        window.location.href = '../login.html';
        return;
    }

    const validation = validateCourseAccess(false, true);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const studentCourses = CourseService.getStudentCourses();

    // Set course title
    setCourseTitle('course-title', course);

    // Populate course list
    populateCourseList('course-list', studentCourses, courseId, false);

    // Setup navigation
    setupCourseNavigation(courseId, false);

    // Get sub-section from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subsection = urlParams.get('subsection') || 'summary';

    // Display appropriate content based on sub-section
    displayContent(courseId, user.id, subsection);
});

function displayContent(courseId, studentId, subsection) {
    const container = document.getElementById('content-container');
    if (!container) return;

    const user = AuthService.getCurrentUser();

    switch (subsection) {
        case 'summary':
            container.innerHTML = `
                <h1>Resumen de Progreso</h1>
                <div class="summary-cards">
                    <div class="summary-card">
                        <span class="label">Promedio General</span>
                        <span class="value">${(Math.random() * 15 + 13).toFixed(1)}/20</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Logros Obtenidos</span>
                        <span class="value">${Math.floor(Math.random() * 5) + 1}</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Asistencia</span>
                        <span class="value">${Math.floor(Math.random() * 20) + 80}%</span>
                    </div>
                </div>
                <h2>Detalles</h2>
                <p>Bienvenido a tu area de progreso. Aquí puedes ver tu rendimiento en el curso.</p>
            `;
            break;

        case 'achievements':
            const achievements = getMockAchievements(courseId, studentId);
            container.innerHTML = `
                <h1>Historial de Logros</h1>
                <div class="achievements-list">
                    ${achievements.map(ach => `
                        <div class="achievement-card">
                            <h3>${sanitizeText(ach.name)}</h3>
                            <p>${sanitizeText(ach.description)}</p>
                            <small>Obtenido: ${new Date(ach.date).toLocaleDateString('es-ES')}</small>
                        </div>
                    `).join('')}
                </div>
            `;
            break;

        case 'rankings':
            const classmates = DataService.getStudentsByCourse(courseId);
            const sortedClassmates = [...classmates].sort(() => Math.random() - 0.5);
            container.innerHTML = `
                <h1>Rankings</h1>
                <div class="panel">
                    <h3>Ranking General del Curso</h3>
                    <ol class="ranking-list">
                        ${sortedClassmates.slice(0, 5).map((student, index) => {
                            const name = sanitizeText(student.name || student.email || 'Unknown');
                            const score = (Math.random() * 15 + 13).toFixed(1);
                            return `
                                <li>
                                    <span class="rank">${index + 1}</span>
                                    <span class="student-name">${name}</span>
                                    <span class="score">${score}/20</span>
                                </li>
                            `;
                        }).join('')}
                    </ol>
                </div>
            `;
            break;

        case 'grades':
            const grades = getMockGrades(courseId, studentId);
            container.innerHTML = `
                <h1>Historial de Notas</h1>
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>Evaluacion</th>
                            <th>Nota</th>
                            <th>Maximo</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map(grade => `
                            <tr>
                                <td>${sanitizeText(grade.name)}</td>
                                <td>${grade.score}/${grade.maxScore}</td>
                                <td>${((grade.score / grade.maxScore) * 100).toFixed(1)}%</td>
                                <td>${new Date(grade.date).toLocaleDateString('es-ES')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;

        default:
            container.innerHTML = `<p>Selecciona una opcion del menu.</p>`;
    }
}
