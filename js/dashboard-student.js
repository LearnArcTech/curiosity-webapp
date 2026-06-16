// dashboard-student.js
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';

// Sanitize text to prevent XSS
function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get initials from name for avatar
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isStudent()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = await AuthService.getCurrentUser();
    const courses = await CourseService.getStudentCourses();
    const allCourses = await DataService.getAllCourses();

    // Display welcome message
    const displayName = sanitizeText(user.name || user.email || 'User');
    const mainDashboard = document.querySelector('.main-dashboard');
    if (mainDashboard) {
        const welcomeH1 = mainDashboard.querySelector('h1');
        if (welcomeH1) {
            welcomeH1.textContent = `Welcome, ${displayName}!`;
        }
    }

    // Populate course list in sidebar
    const courseList = document.getElementById('course-list');
    if (courseList) {
        if (courses.length === 0) {
            courseList.innerHTML = '<li><a href="#" style="color: #666;">No courses yet. Enroll to get started!</a></li>';
        } else {
            courseList.innerHTML = courses.map(course => {
                const name = sanitizeText(course.name || 'Unnamed Course');
                const code = sanitizeText(course.code || '');
                return `<li><a href="dashboard-student-course-summary.html?courseId=${course.id}">${name}${code ? ` (${code})` : ''}</a></li>`;
            }).join('');
        }
    }

    // Populate summary cards (placeholder - would need actual data)
    const summaryCards = document.getElementById('summary-cards');
    if (summaryCards) {
        summaryCards.innerHTML = `
            <div class="summary-card">
                <span class="label">Average Attendance</span>
                <span class="value">N/A</span>
            </div>
            <div class="summary-card">
                <span class="label">Average Participation Score</span>
                <span class="value">N/A</span>
            </div>
        `;
    }

    // Populate podium (placeholder - would need actual leaderboard data)
    const podium = document.getElementById('podium');
    if (podium) {
        podium.innerHTML = `
            <div class="podium-item">
                <img src="https://via.placeholder.com/150" alt="Student avatar">
                <div class="podium-bar third"></div>
                <span class="podium-label">3rd Place</span>
            </div>
            <div class="podium-item">
                <img src="https://via.placeholder.com/150" alt="Student avatar">
                <div class="podium-bar first"></div>
                <span class="podium-label">1st Place</span>
            </div>
            <div class="podium-item">
                <img src="https://via.placeholder.com/150" alt="Student avatar">
                <div class="podium-bar second"></div>
                <span class="podium-label">2nd Place</span>
            </div>
        `;
    }

    // Populate classmates list
    const classmatesList = document.getElementById('classmates-list');
    if (classmatesList) {
        const classmates = new Map();
        const studentLists = await Promise.all(courses.map(c => DataService.getStudentsByCourse(c.id)));
        studentLists.forEach(students => {
            students.forEach(student => {
                if (student.id !== user.id && !classmates.has(student.id)) {
                    classmates.set(student.id, student);
                }
            });
        });

        if (classmates.size === 0) {
            classmatesList.innerHTML = '<li class="student-item"><div class="student-info"><div class="student-name" style="color: #666;">No classmates yet</div></div></li>';
        } else {
            classmatesList.innerHTML = Array.from(classmates.values()).map(student => {
                const name = sanitizeText(student.name || student.email || 'Unknown');
                const initials = getInitials(student.name || student.email);
                return `
                <li class="student-item">
                    <div class="student-avatar">${initials}</div>
                    <div class="student-info">
                        <div class="student-name">${name}</div>
                    </div>
                </li>
            `;
            }).join('');
        }
    }

    // Add event listener for sidebar "Add a course by code" button
    const addCourseBtn = document.getElementById('add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', async () => {
            const courseCode = prompt('Enter course code:');
            if (courseCode) {
                try {
                    await CourseService.enrollInCourse(courseCode.trim());
                    alert('Successfully enrolled in course!');
                    window.location.reload();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }
});