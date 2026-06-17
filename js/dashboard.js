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

function filterNavByRole(isTeacher) {
    const role = isTeacher ? 'teacher' : 'student';
    document.querySelectorAll('#course-sidebar [data-roles]').forEach(el => {
        const roles = el.getAttribute('data-roles').split(' ');
        el.style.display = roles.includes(role) ? '' : 'none';
    });
}

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

// Small utilities to show/hide a persistent loading overlay during async navigation
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Global function to handle route changes for client-side navigation
window.handleRouteChange = async function () {
    const route = parseRoute();
    showLoading();
    try {
        // Mark that we're doing a route change, not initial load
        window.isRouteChange = true;

        if (route.role === 'teacher') {
            await handleTeacherDashboard(route);
        } else {
            await handleStudentDashboard(route);
        }

        delete window.isRouteChange;
    } catch (error) {
        console.error('Route change error:', error);
        showError(error.message || 'Failed to load content');
        delete window.isRouteChange;
    } finally {
        // Ensure loading overlay is hidden after route handling completes
        hideLoading();
    }
};

// Listen for popstate events (back/forward button)
window.addEventListener('popstate', window.handleRouteChange);

// Listen for custom routechange events
window.addEventListener('routechange', window.handleRouteChange);

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

/**
 * Setup titlebar navigation handlers
 */
function setupTitlebarNavigation() {
    // Setup profile icon click handler
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // Setup help link
    const helpLink = document.querySelector('.help-link');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'help.html';
        });
    }

    // Setup courses link - redirect to main dashboard if in course view
    const coursesLink = document.querySelector('.courses-link');
    if (coursesLink) {
        coursesLink.addEventListener('click', (e) => {
            e.preventDefault();
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('courseId');
            if (courseId) {
                // If in a course view, go back to main dashboard
                window.location.href = 'dashboard.html';
            }
            // Otherwise, already on main dashboard
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Setup titlebar navigation first
    setupTitlebarNavigation();

    const route = parseRoute();
    showLoading();
    try {
        if (route.role === 'teacher') {
            await handleTeacherDashboard(route);
        } else {
            await handleStudentDashboard(route);
        }
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError(error.message || 'Failed to initialize dashboard');
    } finally {
        hideLoading();
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
    const isInitialLoad = !window.dashboardInitialized;

    if (isInitialLoad) {
        // First time loading - do full initialization
        if (isCourseView(route)) {
            await handleTeacherCourseView(route, user);
        } else {
            await handleMainTeacherView(user);
        }
        window.dashboardInitialized = true;
    } else {
        // Subsequent navigation - only update content
        if (isCourseView(route)) {
            await updateCourseContent(route, user, true);
        } else {
            await updateMainContent(route, user, true);
        }
    }
}

// Content-only handlers for route changes
async function handleTeacherCourseViewContent(route) {
    // Use stored data from initial load
    const courseId = window.currentCourseId || route.courseId;
    const course = window.currentCourse;
    const user = window.currentUser;
    const teacherCourses = window.currentCourses;

    if (!courseId || !course) {
        console.error('No course data available for route change');
        return;
    }

    // Update course navigation active state
    setupCourseNavigation(courseId, true);

    // Load content
    await loadTeacherCourseContent(route, courseId, course, user, teacherCourses);
}

async function handleStudentCourseViewContent(route) {
    // Use stored data from initial load
    const courseId = window.currentCourseId || route.courseId;
    const course = window.currentCourse;
    const user = window.currentUser;
    const studentCourses = window.currentCourses;

    if (!courseId || !course) {
        console.error('No course data available for route change');
        return;
    }

    // Update course navigation active state
    setupCourseNavigation(courseId, false);

    // Load content
    await loadStudentCourseContent(route, courseId, course, user, studentCourses);
}

// Update course content without re-initializing layout
async function updateCourseContent(route, user, isTeacher) {
    if (isTeacher) {
        await handleTeacherCourseViewContent(route);
    } else {
        await handleStudentCourseViewContent(route);
    }
}

// Update main content without re-initializing layout  
async function updateMainContent(route, user, isTeacher) {
    if (isTeacher) {
        await handleMainTeacherContent(user);
    } else {
        await handleMainStudentContent(user);
    }
}

// Content-only version for route changes
async function handleMainTeacherContent(user) {
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
    const courses = await CourseService.getTeacherCourses();
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

    // Load and populate content
    await handleMainTeacherContent(user);

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
    const isRouteChange = window.isRouteChange;

    // Only do layout setup on initial load
    if (!isRouteChange) {
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
        filterNavByRole(true);

        // Store for route changes
        window.currentCourseId = courseId;
        window.currentCourse = course;
        window.currentUser = user;
        window.currentCourses = teacherCourses;

        // Load content
        await loadTeacherCourseContent(route, courseId, course, user, teacherCourses);
    } else {
        // Route change - use stored data
        const courseId = window.currentCourseId || route.courseId;
        const course = window.currentCourse;
        const user = window.currentUser;
        const teacherCourses = window.currentCourses;

        // Update course navigation active state
        setupCourseNavigation(courseId, true);
        filterNavByRole(true);

        // Load content
        await loadTeacherCourseContent(route, courseId, course, user, teacherCourses);
    }
}

// Load course content based on route
async function loadTeacherCourseContent(route, courseId, course, user, teacherCourses) {
    switch (route.section) {
        case 'summary':
            await handleTeacherCourseSummary(courseId, course, user, teacherCourses);
            break;
        case 'progress':
            await handleCourseProgress(courseId, course, user, teacherCourses, route.subsection, true);
            break;
        case 'sessions':
            if (route.subsection === 'create') {
                await handleCreateSession(courseId, course, user);
            } else {
                await handleCourseSessions(courseId, course, user, true);
            }
            break;
        case 'repository':
            await handleCourseRepository(courseId, course, user, true, route.subsection);
            break;
        case 'settings':
            await handleCourseSettings(courseId, course, user, true);
            break;
        default:
            await handleTeacherCourseSummary(courseId, course, user, teacherCourses);
    }
}

async function handleStudentCourseView(route, user) {
    const isRouteChange = window.isRouteChange;

    // Only do layout setup on initial load
    if (!isRouteChange) {
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
        filterNavByRole(false);

        // Store for route changes
        window.currentCourseId = courseId;
        window.currentCourse = course;
        window.currentUser = user;
        window.currentCourses = studentCourses;

        // Load content
        await loadStudentCourseContent(route, courseId, course, user, studentCourses);
    } else {
        // Route change - use stored data
        const courseId = window.currentCourseId || route.courseId;
        const course = window.currentCourse;
        const user = window.currentUser;
        const studentCourses = window.currentCourses;

        // Update course navigation active state
        setupCourseNavigation(courseId, false);
        filterNavByRole(false);

        // Load content
        await loadStudentCourseContent(route, courseId, course, user, studentCourses);
    }
}

// Load student course content based on route
async function loadStudentCourseContent(route, courseId, course, user, studentCourses) {
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
    subsection = subsection || 'summary';   // ← move this up, before the early-exit

    // Delegate summary to the fancy handler instead of the basic progress template
    if (subsection === 'summary') {
        if (isTeacher) {
            await handleTeacherCourseSummary(courseId, course, user, courses);
        } else {
            await handleStudentCourseSummary(courseId, course, user, courses);
        }
        return;
    }


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

    // Clear previous content
    container.innerHTML = '';

    switch (subsection) {
        case 'quiz-ranking':
            const quizzes = await getMockQuizzes(courseId);
            const sortedQuizzes = [...quizzes].sort((a, b) => b.score - a.score);
            container.innerHTML = `
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
            container.innerHTML = `<p>Seccion en desarrollo...</p>`;
            break;
        case 'rankings':
            container.innerHTML = `<p>Seccion en desarrollo...</p>`;
            break;
        case 'grades':
            container.innerHTML = `<p>Seccion en desarrollo...</p>`;
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
        createSessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to create session view using client-side routing
            const url = new URL(window.location.href);
            url.searchParams.set('subsection', 'create');

            // Update browser history and URL
            window.history.pushState({}, '', url.toString());

            // Trigger route change
            const event = new CustomEvent('routechange');
            window.dispatchEvent(event);
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

    const classmatesList = document.getElementById('classmates-list');
    if (classmatesList) classmatesList.style.display = 'none';

    if (subsection === 'downloads') {
        const grid = document.getElementById('repository-usage');
        if (grid) grid.innerHTML = '<p style="color: var(--color-text-secondary); padding: 1rem;">No hay descargas activas.</p>';
        return;
    }

    const mockFiles = getMockRepositoryFiles(courseId);

    function renderFiles(files) {
        const grid = document.getElementById('repository-usage');
        if (!grid) return;
        if (files.length === 0) {
            grid.innerHTML = '<p style="color: var(--color-text-secondary); padding: 1rem;">No se encontraron archivos.</p>';
            return;
        }
        grid.innerHTML = files.map(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const iconMap = { pdf: 'ti-file-type-pdf', mp4: 'ti-file-type-video', xlsx: 'ti-file-spreadsheet', pptx: 'ti-presentation', docx: 'ti-file-type-doc', wd: 'ti-file' };
            const icon = iconMap[ext] || 'ti-file';
            return `
                <div class="file-card">
                    <i class="ti ${icon}" aria-hidden="true"></i>
                    <span class="file-name">${sanitizeText(file.name)}</span>
                </div>
            `;
        }).join('');
    }

    renderFiles(mockFiles);

    // Storage bar
    const totalStorage = 200 * 1024 * 1024; // 200MB cap
    const used = mockFiles.reduce((sum, f) => sum + f.size, 0);
    const pct = Math.min(100, Math.round(used / totalStorage * 100));
    const fill = document.getElementById('storage-fill');
    if (fill) fill.style.width = pct + '%';

    // Live search
    const searchInput = document.getElementById('repo-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            renderFiles(q ? mockFiles.filter(f => f.name.toLowerCase().includes(q)) : mockFiles);
        });
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

// Note: Navigation is now handled by setupCourseNavigation in courseUtils.js
// which uses client-side routing and URL parameters
