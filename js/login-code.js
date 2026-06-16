// login-code.js
import { CourseService } from './courseService.js';
import { AuthService } from './authService.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const codeForm = document.querySelector('form');

    if (codeForm) {
        codeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseCode = document.getElementById('course-code').value.trim();

            try {
                await CourseService.enrollInCourse(courseCode);
                alert('Te inscribiste al curso correctamente.');
                window.location.href = ROUTES.DASHBOARD_STUDENT;
            } catch (error) {
                alert(error.message);
            }
        });
    }
});
