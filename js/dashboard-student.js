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
        // Get students from the courses the current student is enrolled in
        const classmates = new Set();
        courses.forEach(course => {
            const students = await DataService.getStudentsByCourse(course.id);
            students.forEach(student => {
                if (student.id !== user.id) {
                    classmates.add(student);
                }
            });
        });

        if (classmates.size === 0) {
            classmatesList.innerHTML = '<li class="student-item"><div class="student-info"><div class="student-name" style="color: #666;">No classmates yet</div></div></li>';
        } else {
            classmatesList.innerHTML = Array.from(classmates).map(student => {
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

    // Add enroll in course button
    const mainDashboard2 = document.querySelector('.main-dashboard');
    if (mainDashboard2) {
        const enrollBtn = document.createElement('button');
        enrollBtn.textContent = 'Enroll in Course';
        enrollBtn.className = 'enroll-btn';
        enrollBtn.style.cssText = 'margin: 1rem 0; padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;';
        enrollBtn.addEventListener('click', async () => {
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
        mainDashboard2.prepend(enrollBtn);
    }
});