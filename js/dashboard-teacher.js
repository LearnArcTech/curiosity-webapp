// dashboard-teacher.js
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
    if (!AuthService.isTeacher()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = AuthService.getCurrentUser();
    const courses = await CourseService.getTeacherCourses();

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
            courseList.innerHTML = '<li><a href="#" style="color: #666;">No courses yet. Create your first course!</a></li>';
        } else {
            courseList.innerHTML = courses.map(course => {
                const name = sanitizeText(course.name || 'Unnamed Course');
                const code = sanitizeText(course.code || '');
                return `<li><a href="dashboard-teacher-course-summary.html?courseId=${course.id}">${name}${code ? ` (${code})` : ''}</a></li>`;
            }).join('');
        }
    }

    // Populate summary cards
    const summaryCards = document.getElementById('summary-cards');
    if (summaryCards) {
        const totalCourses = courses.length;
        const studentCounts = await Promise.all(courses.map(c => DataService.getStudentsByCourse(c.id)));
        const totalStudents = studentCounts.reduce((sum, students) => sum + students.length, 0);

        summaryCards.innerHTML = `
            <div class="summary-card">
                <span class="label">Total Courses</span>
                <span class="value">${totalCourses}</span>
            </div>
            <div class="summary-card">
                <span class="label">Total Students</span>
                <span class="value">${totalStudents}</span>
            </div>
            <div class="summary-card">
                <span class="label">Average Session Duration</span>
                <span class="value">N/A</span>
            </div>
        `;
    }

    // Populate podium (placeholder)
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

    // Populate students list
    const studentsList = document.getElementById('students-list');
    if (studentsList) {
        const allStudents = new Map();
        const studentLists = await Promise.all(courses.map(c => DataService.getStudentsByCourse(c.id)));
        studentLists.forEach(students => {
            students.forEach(student => {
                if (student.id !== user.id && !allStudents.has(student.id)) {
                    allStudents.set(student.id, student);
                }
            });
        });

        if (allStudents.size === 0) {
            studentsList.innerHTML = '<li class="student-item"><div class="student-info"><div class="student-name" style="color: #666;">No students yet</div></div></li>';
        } else {
            studentsList.innerHTML = Array.from(allStudents.values()).map(student => {
                const name = sanitizeText(student.name || student.email || 'Unknown');
                const initials = getInitials(student.name || student.email);
                const shortId = student.id ? student.id.substring(0, 4) : 'N/A';
                return `
                <li class="student-item">
                    <div class="student-avatar">${initials}</div>
                    <div class="student-info">
                        <div class="student-name">${name}</div>
                    </div>
                    <div class="student-id">${shortId}</div>
                </li>
            `;
            }).join('');
        }
    }

    // Setup Create New Course button
    const newCourseBtn = document.getElementById('new-course-btn');
    if (newCourseBtn) {
        newCourseBtn.style.cssText = 'display: block; width: 100%; padding: 0.75rem; margin-top: 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; text-align: center;';
        newCourseBtn.addEventListener('click', async () => {
            const courseName = prompt('Enter course name:');
            if (courseName) {
                try {
                    await CourseService.createCourse({ name: courseName.trim() });
                    alert('Course created successfully!');
                    window.location.reload();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }
});
