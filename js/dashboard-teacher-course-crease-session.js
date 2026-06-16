// dashboard-teacher-course-crease-session.js
import { AuthService, CourseService, SessionService } from './services.js';
import { ROUTES } from './config.js';
import {
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    sanitizeText
} from './courseUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isTeacher()) {
        window.location.href = '../pages/login.html';
        return;
    }

    const validation = await validateCourseAccess(true, false);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
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

    // Setup create session form
    setupCreateSessionForm(courseId);
});

function setupCreateSessionForm(courseId) {
    const form = document.getElementById('create-session-form');
    const requirePasswordCheckbox = document.getElementById('require-password');
    const passwordInput = document.getElementById('session-password');
    const waitingRoomCheckbox = document.getElementById('waiting-room');

    if (!form) return;

    // Toggle password field visibility based on checkbox
    if (requirePasswordCheckbox && passwordInput) {
        requirePasswordCheckbox.addEventListener('change', () => {
            passwordInput.style.display = requirePasswordCheckbox.checked ? 'block' : 'none';
        });
        // Initialize visibility
        passwordInput.style.display = requirePasswordCheckbox.checked ? 'block' : 'none';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const meetingNameInput = document.getElementById('meeting-name');
        const meetingName = meetingNameInput ? meetingNameInput.value.trim() : '';

        if (!meetingName) {
            alert('Please enter a session name');
            return;
        }

        const sessionData = {
            courseId,
            name: sanitizeText(meetingName),
            requiresPassword: requirePasswordCheckbox ? requirePasswordCheckbox.checked : false,
            password: passwordInput && requirePasswordCheckbox && requirePasswordCheckbox.checked ? passwordInput.value : null,
            waitingRoom: waitingRoomCheckbox ? waitingRoomCheckbox.checked : false
        };

        try {
            // Create the session
            const { session, sessionId } = await SessionService.createSession(sessionData);

            // Construct the session URL with the session ID
            const sessionUrl = `../pages/session.html?sessionId=${sessionId}&courseId=${courseId}`;

            // Redirect the teacher to the session
            window.location.href = sessionUrl;

        } catch (error) {
            console.error('Error creating session:', error);
            alert('Error creating session: ' + error.message);
        }
    });
}
