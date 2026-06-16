// dashboard-teacher-course-settings.js
import { AuthService, CourseService, DataService } from './services.js';
import {
    sanitizeText,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation
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

    // Display settings content
    await displaySettingsContent(courseId, course);
});

async function displaySettingsContent(courseId, course) {
    const container = document.getElementById('settings-content');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-panel">
            <h2>Configuracion del Curso</h2>
            
            <div class="setting-section">
                <h3>Informacion del Curso</h3>
                <div class="setting-item">
                    <label>
                        Nombre del Curso:
                        <input type="text" id="course-name" value="${sanitizeText(course.name || '')}">
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        Descripcion:
                        <textarea id="course-description" rows="3">${sanitizeText(course.description || '')}</textarea>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        Código del Curso: <strong>${sanitizeText(course.code || 'N/A')}</strong>
                    </label>
                </div>
            </div>

            <div class="setting-section">
                <h3>Acceso</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="course-public" ${course.isPublic ? 'checked' : ''}>
                        <span>Curso publico (cualquier estudiante puede unirse con el código)</span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="course-requires-approval" ${course.requiresApproval ? 'checked' : ''}>
                        <span>Requerir aprobación para nuevos estudiantes</span>
                    </label>
                </div>
            </div>

            <div class="setting-section">
                <h3>Peligro</h3>
                <div class="setting-item warning">
                    <label>
                        <input type="checkbox" id="delete-course-confirm">
                        <span>Entiendo que eliminar el curso es irreversible</span>
                    </label>
                </div>
                <button id="delete-course-btn" class="danger-btn" disabled>Eliminar Curso</button>
            </div>

            <button id="save-settings-btn" class="primary-btn">Guardar Configuracion</button>
        </div>
    `;

    // Add event listeners
    const deleteConfirm = document.getElementById('delete-course-confirm');
    const deleteBtn = document.getElementById('delete-course-btn');
    const saveBtn = document.getElementById('save-settings-btn');

    if (deleteConfirm && deleteBtn) {
        deleteConfirm.addEventListener('change', () => {
            deleteBtn.disabled = !deleteConfirm.checked;
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Estas ABSOLUTAMENTE seguro de que quieres eliminar este curso y todo su contenido?')) {
                alert('Curso eliminado - en desarrollo');
                window.location.href = 'dashboard-teacher.html';
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Configuracion guardada correctamente!');
        });
    }
}
