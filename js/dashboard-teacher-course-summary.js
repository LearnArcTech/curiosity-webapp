// dashboard-teacher-course-summary.js
import { AuthService, CourseService, DataService } from './services.js';
import {
    sanitizeText,
    getInitials,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation
} from './courseUtils.js';

// Check authentication and redirect if not authorized
document.addEventListener('DOMContentLoaded', async () => {
    const validation = await validateCourseAccess(true, false);
    if (!validation) return;

    const { courseId, course } = validation;
    const user = AuthService.getCurrentUser();
    const teacherCourses = await CourseService.getTeacherCourses();

    // Set course title in sidebar
    const courseTitleElement = document.getElementById('course-title');
    if (courseTitleElement) {
        courseTitleElement.textContent = sanitizeText(course.name || 'Curso sin nombre');
    }

    // Populate course list in sidebar
    const courseList = document.getElementById('course-list');
    if (courseList) {
        if (teacherCourses.length === 0) {
            courseList.innerHTML = '<li><a href="#" style="color: #666;">No courses yet. Create your first course!</a></li>';
        } else {
            courseList.innerHTML = teacherCourses.map(c => {
                const name = sanitizeText(c.name || 'Unnamed Course');
                const code = sanitizeText(c.code || '');
                const isActive = c.id === courseId;
                return `<li><a href="dashboard-teacher-course-summary.html?courseId=${c.id}" ${isActive ? 'class="active"' : ''}>${name}${code ? ` (${code})` : ''}</a></li>`;
            }).join('');
        }
    }

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

    // Populate summary cards
    const summaryCards = document.getElementById('summary-cards');
    if (summaryCards) {
        const students = await DataService.getStudentsByCourse(courseId);
        const totalStudents = students.length;
        const mockAttendance = (Math.random() * 20 + 15).toFixed(1);
        const mockParticipation = (Math.random() * 10 + 10).toFixed(1);

        summaryCards.innerHTML = `
            <div class="summary-card">
                <span class="label">Total Estudiantes</span>
                <span class="value">${totalStudents}</span>
            </div>
            <div class="summary-card">
                <span class="label">Asistencia Promedio</span>
                <span class="value">${mockAttendance}%</span>
            </div>
            <div class="summary-card">
                <span class="label">Puntaje Participación Promedio</span>
                <span class="value">${mockParticipation}/20</span>
            </div>
        `;
    }

    // Populate podium (participation leaderboard)
    const podium = document.getElementById('podium');
    if (podium) {
        const students = await DataService.getStudentsByCourse(courseId);
        const sortedStudents = [...students].sort(() => Math.random() - 0.5).slice(0, 3);

        podium.innerHTML = sortedStudents.map((student, index) => {
            const initials = getInitials(student.name || student.email);
            const name = sanitizeText(student.name || student.email || 'Unknown');
            const positions = ['first', 'second', 'third'];
            return `
                <div class="podium-item">
                    <div class="student-avatar">${initials}</div>
                    <div class="podium-bar ${positions[index]}"></div>
                    <span class="podium-label">${index + 1}° Lugar - ${name}</span>
                </div>
            `;
        }).join('');
    }

    // Populate student list
    const studentsList = document.getElementById('students-list');
    if (studentsList) {
        const students = await DataService.getStudentsByCourse(courseId);

        if (students.length === 0) {
            studentsList.innerHTML = '<li class="student-item"><div class="student-info"><div class="student-name" style="color: #666;">No students yet</div></div></li>';
        } else {
            studentsList.innerHTML = students.map(student => {
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
    setupCourseNavigation(courseId, true);
});
