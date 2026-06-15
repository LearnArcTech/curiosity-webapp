// dashboard-student-course-summary.js
import { AuthService, CourseService, DataService } from './services.js';
import {
    sanitizeText,
    getInitials,
    getCourseIdFromUrl,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    getMockGrades,
    getMockAchievements
} from './courseUtils.js';

// Check authentication and redirect if not authorized
document.addEventListener('DOMContentLoaded', async () => {
    const validation = validateCourseAccess(false, true);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const studentCourses = CourseService.getStudentCourses();

    // Set course title in sidebar
    const courseTitleElement = document.getElementById('course-title');
    if (courseTitleElement) {
        courseTitleElement.textContent = sanitizeText(course.name || 'Curso sin nombre');
    }

    // Populate course list in sidebar
    const courseList = document.getElementById('course-list');
    if (courseList) {
        if (studentCourses.length === 0) {
            courseList.innerHTML = '<li><a href="#" style="color: #666;">No courses yet</a></li>';
        } else {
            courseList.innerHTML = studentCourses.map(c => {
                const name = sanitizeText(c.name || 'Unnamed Course');
                const code = sanitizeText(c.code || '');
                const isActive = c.id === courseId;
                return `<li><a href="dashboard-student-course-summary.html?courseId=${c.id}" ${isActive ? 'class="active"' : ''}>${name}${code ? ` (${code})` : ''}</a></li>`;
            }).join('');
        }
    }

    // Populate summary cards
    const summaryCards = document.getElementById('summary-cards');
    if (summaryCards) {
        // Mock data for now - in a real app, this would come from course statistics
        summaryCards.innerHTML = `
            <div class="summary-card">
                <span class="label">Asistencia promedio</span>
                <span class="value">${Math.floor(Math.random() * 10) + 15}.${Math.floor(Math.random() * 99)}%</span>
            </div>
            <div class="summary-card">
                <span class="label">Puntaje de participación promedio</span>
                <span class="value">${(Math.random() * 10 + 10).toFixed(1)}/20</span>
            </div>
            <div class="summary-card">
                <span class="label">Duracion promedio de sesiones</span>
                <span class="value">${Math.floor(Math.random() * 2) + 1}h ${Math.floor(Math.random() * 60)}m</span>
            </div>
        `;
    }

    // Populate podium (participation leaderboard)
    const podium = document.getElementById('podium');
    if (podium) {
        const classmates = DataService.getStudentsByCourse(courseId);
        const sortedClassmates = [...classmates].sort(() => Math.random() - 0.5).slice(0, 3);
        
        podium.innerHTML = sortedClassmates.map((student, index) => {
            const initials = getInitials(student.name || student.email);
            const name = sanitizeText(student.name || student.email || 'Unknown');
            const positions = ['first', 'second', 'third'];
            return `
                <div class="podium-item">
                    <div class="student-avatar">${initials}</div>
                    <div class="podium-bar ${positions[index]}"></div>
                    <span class="podium-label">${index + 1}° Place - ${name}</span>
                </div>
            `;
        }).join('');
    }

    // Populate repository usage
    const repositoryUsage = document.getElementById('repository-usage');
    if (repositoryUsage) {
        // Mock repository data
        const mockFiles = [
            { name: 'Clase 2026-04-07', course: course.name, size: '50MB', progress: 100 },
            { name: 'Clase 2026-05-01', course: course.name, size: '20MB', progress: 40 },
            { name: 'Practica.xlsx', course: course.name, size: '1MB', progress: 10 }
        ];
        
        repositoryUsage.innerHTML = mockFiles.map(file => `
            <div class="repo-item">
                <div class="file-info">${sanitizeText(file.name)} | ${sanitizeText(file.course)}</div>
                <div class="file-size">${file.size}</div>
            </div>
            <div class="progress-bar">
                <div class="fill" style="width: ${file.progress}%;"></div>
            </div>
        `).join('');
    }

    // Populate classmates list
    const classmatesList = document.getElementById('classmates-list');
    if (classmatesList) {
        const classmates = DataService.getStudentsByCourse(courseId);
        
        if (classmates.length === 0) {
            classmatesList.innerHTML = '<li class="student-item"><div class="student-info"><div class="student-name" style="color: #666;">No classmates yet</div></div></li>';
        } else {
            classmatesList.innerHTML = classmates.map(student => {
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

    // Setup navigation for sub-sections
    setupCourseNavigation(courseId, false);
});
