// dashboard.js - Consolidated dashboard handler
// Handles all dashboard views: main teacher/student dashboards and course-specific views

import { AuthService, CourseService, DataService, SessionService } from './services.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';
import {
    sanitizeText,
    getInitials,
    getCourseId,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    formatDate,
    formatFileSize
} from './courseUtils.js';
import {
    getMockSessions,
    getMockRepositoryFiles,
    getMockQuizzes,
    getMockParticipationData,
    getMockAchievements,
    getMockGrades
} from './mockData.js';

// ============================================================================
// ROUTE HANDLING
// ============================================================================

/**
 * Parse URL parameters and determine the current view
 * URL format: dashboard.html?role=teacher|student&courseId=123&section=summary|progress|sessions|repository|settings&subsection=...
 */
function parseRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Determine view type - try role first, then view, then fallback to user role
    let role = urlParams.get('role') || urlParams.get('view');
    
    // If no role in URL, try to get from current user
    if (!role) {
        const user = AuthService.getCurrentUser();
        role = user?.role || 'teacher';
    }
    
    const courseId = urlParams.get('courseId');
    const section = urlParams.get('section') || 'summary';
    const subsection = urlParams.get('subsection');
    
    return { role, courseId, section, subsection };
}

/**
 * Determine if we're in a course-specific view
 */
function isCourseView(route) {
    return route.courseId !== null && route.courseId !== '';
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const route = parseRoute();
    
    try {
        if (route.role === 'teacher') {
            await handleTeacherDashboard(route);
        } else {
            await handleStudentDashboard(route);
        }
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError(error.message || 'Failed to initialize dashboard');
    }
});

// ============================================================================
// TEACHER DASHBOARD HANDLER
// ============================================================================

async function handleTeacherDashboard(route) {
    // Check if user is teacher
    if (!AuthService.isTeacher()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }
    
    const user = AuthService.getCurrentUser();
    
    if (isCourseView(route)) {
        // Course-specific view
        await handleTeacherCourseView(route, user);
    } else {
        // Main teacher dashboard
        await handleMainTeacherView(user);
    }
}

async function handleMainTeacherView(user) {
    // Hide course sidebar for main dashboard
    document.getElementById('course-sidebar').style.display = 'none';
    document.getElementById('add-course-btn').style.display = 'none';
    document.getElementById('new-course-btn').style.display = 'block';
    
    // Update sidebar title
    document.getElementById('sidebar-title').textContent = 'Courses';
    
    // Populate course list
    const courses = await CourseService.getTeacherCourses();
    populateCourseList('course-list', courses, null, true);
    
    // Load main teacher template
    loadTemplate('template-main-teacher');
    
    // Display welcome message
    const displayName = sanitizeText(user.name || user.email || 'User');
    const mainDashboard = document.querySelector('.main-dashboard');
    if (mainDashboard) {
        const welcomeH1 = mainDashboard.querySelector('h1');
        if (welcomeH1) {
            welcomeH1.textContent = `Welcome, ${displayName}!`;
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
}

// ============================================================================
// STUDENT DASHBOARD HANDLER
// ============================================================================

async function handleStudentDashboard(route) {
    // Check if user is student
    if (!AuthService.isStudent()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }
    
    const user = await AuthService.getCurrentUser();
    
    if (isCourseView(route)) {
        // Course-specific view
        await handleStudentCourseView(route, user);
    } else {
        // Main student dashboard
        await handleMainStudentView(user);
    }
}

async function handleMainStudentView(user) {
    // Hide course sidebar for main dashboard
    document.getElementById('course-sidebar').style.display = 'none';
    document.getElementById('add-course-btn').style.display = 'block';
    document.getElementById('new-course-btn').style.display = 'none';
    
    // Update sidebar title
    document.getElementById('sidebar-title').textContent = 'Courses';
    
    // Populate course list
    const courses = await CourseService.getStudentCourses();
    const allCourses = await DataService.getAllCourses();
    populateCourseList('course-list', courses, null, false);
    
    // Load main student template
    loadTemplate('template-main-student');
    
    // Display welcome message
    const displayName = sanitizeText(user.name || user.email || 'User');
    const mainDashboard = document.querySelector('.main-dashboard');
    if (mainDashboard) {
        const welcomeH1 = mainDashboard.querySelector('h1');
        if (welcomeH1) {
            welcomeH1.textContent = `Welcome, ${displayName}!`;
        }
    }
    
    // Populate summary cards (placeholder)
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
}

// ============================================================================
// COURSE VIEW HANDLERS
// ============================================================================

async function handleTeacherCourseView(route, user) {
    // Show course sidebar
    document.getElementById('course-sidebar').style.display = 'block';
    document.getElementById('new-course-btn').style.display = 'block';
    document.getElementById('add-course-btn').style.display = 'none';
    
    // Validate course access
    const validation = await validateCourseAccess(true, false);
    if (!validation) return;
    
    const { courseId, course } = validation;
    const teacherCourses = await CourseService.getTeacherCourses();
    
    // Update sidebar title
    document.getElementById('sidebar-title').textContent = 'Courses';
    
    // Populate course list
    populateCourseList('course-list', teacherCourses, courseId, true);
    
    // Set course title
    setCourseTitle('course-title', course);
    
    // Setup course navigation
    setupCourseNavigation(courseId, true);
    
    // Handle different sections
    switch (route.section) {
        case 'summary':
            await handleTeacherCourseSummary(courseId, course, user, teacherCourses);
            break;
        case 'progress':
            await handleCourseProgress(courseId, course, user, teacherCourses, route.subsection, true);
            break;
        case 'sessions':
            await handleCourseSessions(courseId, course, user, true);
            break;
        case 'repository':
            await handleCourseRepository(courseId, course, user, true, route.subsection);
            break;
        case 'settings':
            await handleCourseSettings(courseId, course, user, true);
            break;
        case 'create':
            await handleCreateSession(courseId, course, user);
            break;
        default:
            await handleTeacherCourseSummary(courseId, course, user, teacherCourses);
    }
}

async function handleStudentCourseView(route, user) {
    // Show course sidebar but hide create session button
    document.getElementById('course-sidebar').style.display = 'block';
    document.getElementById('new-course-btn').style.display = 'none';
    document.getElementById('add-course-btn').style.display = 'none';
    
    // Validate course access
    const validation = await validateCourseAccess(false, true);
    if (!validation) return;
    
    const { courseId, course } = validation;
    const studentCourses = await CourseService.getStudentCourses();
    
    // Update sidebar title
    document.getElementById('sidebar-title').textContent = 'Courses';
    
    // Populate course list
    populateCourseList('course-list', studentCourses, courseId, false);
    
    // Set course title
    setCourseTitle('course-title', course);
    
    // Setup course navigation
    setupCourseNavigation(courseId, false);
    
    // Handle different sections
    switch (route.section) {
        case 'summary':
            await handleStudentCourseSummary(courseId, course, user, studentCourses);
            break;
        case 'progress':
            await handleCourseProgress(courseId, course, user, studentCourses, route.subsection, false);
            break;
        case 'sessions':
            await handleCourseSessions(courseId, course, user, false);
            break;
        case 'repository':
            await handleCourseRepository(courseId, course, user, false, route.subsection);
            break;
        case 'settings':
            await handleCourseSettings(courseId, course, user, false);
            break;
        default:
            await handleStudentCourseSummary(courseId, course, user, studentCourses);
    }
}

// ============================================================================
// SECTION HANDLERS
// ============================================================================

// Teacher Course Summary
async function handleTeacherCourseSummary(courseId, course, user, courses) {
    loadTemplate('template-course-summary');
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Resumen';
    
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
    
    // Populate podium
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
}

// Student Course Summary
async function handleStudentCourseSummary(courseId, course, user, courses) {
    loadTemplate('template-course-summary');
    
    // Update titles for student view
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Resumen';
    
    const podiumTitle = document.getElementById('podium-title');
    if (podiumTitle) podiumTitle.textContent = 'Podio de participacion';
    
    const studentListTitle = document.getElementById('student-list-title');
    if (studentListTitle) studentListTitle.textContent = 'Compañeros';
    
    // Populate summary cards
    const summaryCards = document.getElementById('summary-cards');
    if (summaryCards) {
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
    
    // Populate podium
    const podium = document.getElementById('podium');
    if (podium) {
        const classmates = await DataService.getStudentsByCourse(courseId);
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
    
    // Populate repository usage (student view)
    const repositoryUsage = document.getElementById('repository-usage');
    if (repositoryUsage) {
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
    const classmatesList = document.getElementById('students-list');
    if (classmatesList) {
        const classmates = await DataService.getStudentsByCourse(courseId);

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
}

// Course Progress Handler (shared for teacher and student)
async function handleCourseProgress(courseId, course, user, courses, subsection, isTeacher) {
    loadTemplate('template-course-progress');
    
    if (isTeacher) {
        // Setup new course button for teacher
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
    }
    
    // Get the content container
    const container = document.getElementById('content-container');
    if (!container) return;

    const students = await DataService.getStudentsByCourse(courseId);
    
    // Handle subsections
    subsection = subsection || 'summary';
    
    switch (subsection) {
        case 'summary':
            container.innerHTML = `
                <div class="summary-card">
                    <span class="label">Total Estudiantes</span>
                    <span class="value">${students.length}</span>
                </div>
                <div class="summary-card">
                    <span class="label">Promedio del Curso</span>
                    <span class="value">${(Math.random() * 3 + 15).toFixed(1)}/20</span>
                </div>
                <div class="summary-card">
                    <span class="label">Asistencia Promedio</span>
                    <span class="value">${Math.floor(Math.random() * 20) + 80}%</span>
                </div>
                <h2>Detalles</h2>
                <p>Vista general del progreso de todos los estudiantes en el curso.</p>
            `;
            break;

        case 'quiz-ranking':
            const quizzes = await getMockQuizzes(courseId);
            const sortedQuizzes = [...quizzes].sort((a, b) => b.score - a.score);
            container.innerHTML = `
                <h1>Ranking de Quizes</h1>
                <div class="panel">
                    <h3>Mejor a Peor Desempeño</h3>
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Estudiante</th>
                                <th>Nota</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedQuizzes.map((q, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${sanitizeText(q.studentName)}</td>
                                    <td>${q.score}/20</td>
                                    <td>${new Date(q.date).toLocaleDateString('es-ES')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;

        case 'participation':
            const participationData = await getMockParticipationData(courseId);
            const sortedParticipation = [...participationData].sort((a, b) => b.participationScore - a.participationScore);
            container.innerHTML = `
                <h1>Participacion</h1>
                <div class="panel">
                    <h3>Participacion de Estudiantes</h3>
                    <table class="participation-table">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Puntaje de Participacion</th>
                                <th>Sesiones Asistidas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedParticipation.map(p => `
                                <tr>
                                    <td>${sanitizeText(p.studentName)}</td>
                                    <td>${p.participationScore}%</td>
                                    <td>${p.sessionsAttended}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;

        case 'reports':
            container.innerHTML = `
                <h1>Reportes</h1>
                <div class="reports-container">
                    <div class="report-card">
                        <h3>Reporte de Notas</h3>
                        <p>Genera un reporte detallado de todas las notas del curso.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                    <div class="report-card">
                        <h3>Reporte de Asistencia</h3>
                        <p>Genera un reporte de asistencia de todos los estudiantes.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                    <div class="report-card">
                        <h3>Reporte de Participacion</h3>
                        <p>Genera un reporte de participacion en el curso.</p>
                        <button class="report-btn">Generar Reporte</button>
                    </div>
                </div>
            `;
            // Add event listeners to report buttons
            document.querySelectorAll('.report-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    alert('Reporte generado! (Funcionalidad en desarrollo)');
                });
            });
            break;

        case 'achievements':
        case 'rankings':
        case 'grades':
            container.innerHTML = `<p>Seccion ${subsection} en desarrollo...</p>`;
            break;

        default:
            container.innerHTML = `<p>Selecciona una opcion del menu.</p>`;
    }
}

// Course Sessions Handler
async function handleCourseSessions(courseId, course, user, isTeacher) {
    loadTemplate('template-course-sessions');
    
    const container = document.getElementById('sessions-container');
    if (!container) return;

    const sessions = getMockSessions(courseId);
    const students = await DataService.getStudentsByCourse(courseId);

    container.innerHTML = sessions.map(session => {
        const statusClass = session.status === 'completed' ? 'completed' :
            session.status === 'scheduled' ? 'scheduled' : 'pending';
        return `
            <div class="session-card ${statusClass}">
                <h3>${sanitizeText(session.name)}</h3>
                <p><strong>Fecha:</strong> ${formatDate(session.date)}</p>
                <p><strong>Duracion:</strong> ${session.duration}</p>
                <p><strong>Estado:</strong> ${session.status === 'completed' ? 'Completada' :
                session.status === 'scheduled' ? 'Programada' : 'Pendiente'}</p>
                <p><strong>Asistencia:</strong> ${Math.floor(Math.random() * 20) + 10}/${students.length} estudiantes</p>
                <div class="session-actions">
                    <button class="edit-btn" data-session-id="${session.id}">Editar</button>
                    <button class="delete-btn" data-session-id="${session.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    // Setup create session button for teachers
    const createSessionBtn = document.getElementById('create-session-btn');
    if (createSessionBtn && isTeacher) {
        createSessionBtn.style.display = 'block';
        createSessionBtn.addEventListener('click', () => {
            // Navigate to create session view
            const newUrl = updateUrlParams({ subsection: 'create' });
            window.location.href = newUrl;
        });
    }
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.target.getAttribute('data-session-id');
            alert(`Editar sesion ${sessionId} - en desarrollo`);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.target.getAttribute('data-session-id');
            if (confirm('¿Estas seguro de que quieres eliminar esta sesion?')) {
                alert(`Sesion ${sessionId} eliminada - en desarrollo`);
            }
        });
    });
}

// Course Repository Handler
async function handleCourseRepository(courseId, course, user, isTeacher, subsection) {
    loadTemplate('template-course-repository');
    
    const repositoryUsage = document.getElementById('repository-usage');
    if (repositoryUsage) {
        const mockFiles = getMockRepositoryFiles(courseId);
        
        repositoryUsage.innerHTML = mockFiles.map(file => `
            <div class="repo-item">
                <div class="file-info">${sanitizeText(file.name)} | ${formatFileSize(file.size)} | ${new Date(file.uploadDate).toLocaleDateString('es-ES')}</div>
            </div>
            <div class="progress-bar">
                <div class="fill" style="width: 100%;"></div>
            </div>
        `).join('');
    }
}

// Course Settings Handler
async function handleCourseSettings(courseId, course, user, isTeacher) {
    loadTemplate('template-course-settings');
    // Settings content can be added here
}

// Create Session Handler
async function handleCreateSession(courseId, course, user) {
    loadTemplate('template-create-session');
    
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

            // Redirect the teacher to the session
            const sessionUrl = `session.html?sessionId=${sessionId}&courseId=${courseId}`;
            window.location.href = sessionUrl;

        } catch (error) {
            console.error('Error creating session:', error);
            alert('Error creating session: ' + error.message);
        }
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load a template by ID and insert its content into main-content
 */
function loadTemplate(templateId) {
    const template = document.getElementById(templateId);
    const mainContent = document.getElementById('main-content');
    
    if (template && mainContent) {
        const content = template.content.cloneNode(true);
        mainContent.innerHTML = '';
        mainContent.appendChild(content);
    } else {
        console.error(`Template ${templateId} not found or main-content missing`);
    }
}

/**
 * Update URL parameters and return new URL
 */
function updateUrlParams(newParams) {
    const url = new URL(window.location.href);
    Object.entries(newParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

/**
 * Show error message
 */
function showError(message) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${sanitizeText(message)}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// ============================================================================
// NAVIGATION HANDLERS
// ============================================================================

// Setup navigation event listeners for course submenu
document.addEventListener('DOMContentLoaded', () => {
    // This will be handled by the route parsing on page load
    // Navigation changes should update URL params and reload or use client-side routing
    
    // For now, we'll use simple URL-based navigation
    const navLinks = document.querySelectorAll('[data-section], [data-subsection]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const section = link.dataset.section;
            const subsection = link.dataset.subsection;
            const currentRoute = parseRoute();
            
            const newParams = {
                role: currentRoute.role,
                courseId: currentRoute.courseId,
                section: section || currentRoute.section
            };
            
            if (subsection) {
                newParams.subsection = subsection;
            }
            
            const newUrl = updateUrlParams(newParams);
            window.location.href = newUrl;
            e.preventDefault();
        });
    });
});
