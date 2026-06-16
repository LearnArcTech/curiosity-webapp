// dashboard-student-course-settings.js
import { AuthService, CourseService, DataService } from './services.js';
import {
    sanitizeText,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isStudent()) {
        window.location.href = '../pages/login.html';
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

    // Display settings content
    await displaySettingsContent(courseId, user);
});

async function displaySettingsContent(courseId, user) {
    const container = document.getElementById('settings-content');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-panel">
            <h2>Configuracion del Curso</h2>
            
            <div class="setting-section">
                <h3>Notificaciones</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="notifications-enabled" checked>
                        <span>Recibir notificaciones por correo electronico</span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="notifications-sms" checked>
                        <span>Recibir notificaciones por SMS</span>
                    </label>
                </div>
            </div>

            <div class="setting-section">
                <h3>Privacidad</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="show-profile" checked>
                        <span>Mostrar mi perfil a otros estudiantes</span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="show-grades" checked>
                        <span>Mostrar mis notas en el ranking general</span>
                    </label>
                </div>
            </div>

            <div class="setting-section">
                <h3>Preferencias</h3>
                <div class="setting-item">
                    <label>
                        Idioma:
                        <select id="language">
                            <option value="es">Espanol</option>
                            <option value="en">Ingles</option>
                        </select>
                    </label>
                </div>
            </div>

            <button id="save-settings-btn" class="primary-btn">Guardar Configuracion</button>
            <button id="leave-course-btn" class="secondary-btn">Abandonar Curso</button>
        </div>
    `;

    // Add event listeners
    const saveBtn = document.getElementById('save-settings-btn');
    const leaveBtn = document.getElementById('leave-course-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Configuracion guardada correctamente!');
        });
    }

    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            if (confirm('¿Estas seguro de que quieres abandonar este curso? No podras acceder al contenido ni a tus notas.')) {
                alert('Curso abandonado - en desarrollo');
                window.location.href = 'dashboard-student.html';
            }
        });
    }
}
