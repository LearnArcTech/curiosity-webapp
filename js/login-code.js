// login-code.js
import { AuthService, CourseService } from './services.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const codeForm = document.querySelector('form');

    if (codeForm) {
        codeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseCode = document.getElementById('course-code').value.trim();

            try {
                await CourseService.enrollInCourse(courseCode);
                alert('Successfully enrolled in course!');
                window.location.href = ROUTES.DASHBOARD_STUDENT;
            } catch (error) {
                alert(error.message);
            }
        });
    }
});