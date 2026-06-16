// onboarding-course.js
import { AuthService, CourseService } from './services.js';
import { ROUTES } from './config.js';

// Check if user is authenticated and is a teacher
if (!AuthService.isAuthenticated() || !AuthService.isTeacher()) {
    window.location.href = ROUTES.LOGIN;
}

document.addEventListener('DOMContentLoaded', async () => {
    // If the teacher already has a name, role, and at least one course, skip onboarding
    const _currentUser = AuthService.getCurrentUser();
    if (_currentUser && _currentUser.role === 'teacher' && _currentUser.name) {
        try {
            const existingCourses = await CourseService.getTeacherCourses();
            if (existingCourses && existingCourses.length > 0) {
                window.location.href = ROUTES.DASHBOARD_TEACHER;
                return;
            }
        } catch (_err) {
            // If we can't fetch courses, continue showing the form rather than blocking
            console.warn('Could not verify existing courses during onboarding:', _err);
        }
    }

    const courseForm = document.getElementById('course-form');
    const skipBtn = document.querySelector('.skip-btn');

    if (courseForm) {
        courseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseName = document.getElementById('course-name').value.trim();

            if (courseName) {
                try {
                    await CourseService.createCourse({ name: courseName });
                    alert('Course created successfully!');
                    window.location.href = ROUTES.DASHBOARD_TEACHER;
                } catch (error) {
                    console.error('Error creating course:', error);
                    alert(error.message || 'Failed to create course. Please try again.');
                }
            } else {
                alert('Please enter a course name');
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            window.location.href = ROUTES.DASHBOARD_TEACHER;
        });
    }
});