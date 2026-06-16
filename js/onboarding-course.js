// onboarding-course.js
import { AuthService, CourseService } from './services.js';
import { ROUTES } from './config.js';

// Check if user is authenticated and is a teacher
if (!AuthService.isAuthenticated() || !AuthService.isTeacher()) {
    window.location.href = ROUTES.LOGIN;
}

document.addEventListener('DOMContentLoaded', async () => {
    const courseForm = document.getElementById('course-form');
    const skipBtn = document.querySelector('.skip-btn');

    if (courseForm) {
        courseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseName = document.getElementById('course-name').value.trim();
            
            if (courseName) {
                try {
                    await CourseService.createCourse({ name: courseName });
                    alert('Curso creado correctamente.');
                    window.location.href = ROUTES.DASHBOARD_TEACHER;
                } catch (error) {
                    console.error('Error al crear el curso:', error);
                    alert(error.message || 'No se pudo crear el curso. Inténtalo de nuevo.');
                }
            } else {
                alert('Ingresa un nombre para el curso');
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            window.location.href = ROUTES.DASHBOARD_TEACHER;
        });
    }
});
