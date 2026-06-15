// dashboard-teacher-course-progress.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';
import {
    sanitizeText,
    getInitials,
    getCourseIdFromUrl,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    getMockQuizzes,
    getMockParticipationData
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isTeacher()) {
        window.location.href = '../login.html';
        return;
    }

    const validation = validateCourseAccess(true, false);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const teacherCourses = CourseService.getTeacherCourses();

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

    // Get sub-section from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subsection = urlParams.get('subsection') || 'summary';

    // Display appropriate content based on sub-section
    displayContent(courseId, subsection);
});

function displayContent(courseId, subsection) {
    const container = document.getElementById('content-container');
    if (!container) return;

    const students = DataService.getStudentsByCourse(courseId);

    switch (subsection) {
        case 'summary':
            container.innerHTML = `
                <h1>Resumen de Progreso del Curso</h1>
                <div class="summary-cards">
                    <div class="summary-card">
                        <span class="label">Total Estudiantes</span>
                        <span class="value">${students.length}</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Promedio del Curso</span>
                        <span class="value">${(Math.random() * 3 + 15).toFixed(1)}/20</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Asistencia Promedio</span>
                        <span class="value">${Math.floor(Math.random() * 20) + 80}%</span>
                    </div>
                </div>
                <h2>Detalles</h2>
                <p>Vista general del progreso de todos los estudiantes en el curso.</p>
            `;
            break;

        case 'quiz-ranking':
            const quizzes = getMockQuizzes(courseId);
            const sortedQuizzes = [...quizzes].sort((a, b) => b.score - a.score);
            container.innerHTML = `
                <h1>Ranking de Quizes</h1>
                <div class="panel">
                    <h3>Mejor a Peor Desempeño</h3>
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Estudiante</th>
                                <th>Nota</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedQuizzes.map((q, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${sanitizeText(q.studentName)}</td>
                                    <td>${q.score}/20</td>
                                    <td>${new Date(q.date).toLocaleDateString('es-ES')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;

        case 'participation':
            const participationData = getMockParticipationData(courseId);
            const sortedParticipation = [...participationData].sort((a, b) => b.participationScore - a.participationScore);
            container.innerHTML = `
                <h1>Participacion</h1>
                <div class="panel">
                    <h3>Participacion de Estudiantes</h3>
                    <table class="participation-table">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Puntaje de Participacion</th>
                                <th>Sesiones Asistidas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedParticipation.map(p => `
                                <tr>
                                    <td>${sanitizeText(p.studentName)}</td>
                                    <td>${p.participationScore}%</td>
                                    <td>${p.sessionsAttended}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;

        case 'reports':
            container.innerHTML = `
                <h1>Reportes</h1>
                <div class="reports-container">
                    <div class="report-card">
                        <h3>Reporte de Notas</h3>
                        <p>Genera un reporte detallado de todas las notas del curso.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                    <div class="report-card">
                        <h3>Reporte de Asistencia</h3>
                        <p>Genera un reporte de asistencia de todos los estudiantes.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                    <div class="report-card">
                        <h3>Reporte de Participacion</h3>
                        <p>Genera un reporte de participacion en el curso.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                </div>
            `;
            // Add event listeners to report buttons
            document.querySelectorAll('.report-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    alert('Reporte generado! (Funcionalidad en desarrollo)');
                });
            });
            break;

        default:
            container.innerHTML = `<p>Selecciona una opcion del menu.</p>`;
    }
}
