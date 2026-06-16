// courseUtils.js - Shared utilities for course-related pages
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

// Validate and get course ID from URL
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
}

// Common authentication and course validation
async function validateCourseAccess(isTeacher, isStudent) {
    const user = AuthService.getCurrentUser();

    // Guard against unauthenticated users before anything else
    if (!user) {
        window.location.href = '../pages/login.html';
        return null;
    }

    const courseId = getCourseIdFromUrl();

    if (!courseId) {
        window.location.href = isTeacher ? 'dashboard-teacher.html' : 'dashboard-student.html';
        return null;
    }

    const course = await DataService.getCourseById(courseId);

    if (!course) {
        window.location.href = isTeacher ? 'dashboard-teacher.html' : 'dashboard-student.html';
        return null;
    }

    if (isTeacher) {
        // Coerce both to strings to avoid number/string type mismatch
        // Also check camelCase fallback in case the API uses teacherId
        const courseTeacherId = String(course.teacher_id ?? course.teacherId ?? '');
        const userId = String(user.id ?? '');

        if (!courseTeacherId || courseTeacherId !== userId) {
            window.location.href = 'dashboard-teacher.html';
            return null;
        }
    } else if (isStudent) {
        const studentCourses = await CourseService.getStudentCourses();
        // Same coercion for enrollment ID comparison
        const isEnrolled = studentCourses.some(c => String(c.id) === String(courseId));
        if (!isEnrolled) {
            window.location.href = 'dashboard-student.html';
            return null;
        }
    }

    return { courseId, course };
}

// Populate course list in sidebar
function populateCourseList(courseListId, courses, currentCourseId, isTeacher) {
    const courseList = document.getElementById(courseListId);
    if (!courseList) return;

    if (courses.length === 0) {
        courseList.innerHTML = isTeacher
            ? '<li><a href="#" style="color: #666;">No courses yet. Create your first course!</a></li>'
            : '<li><a href="#" style="color: #666;">No courses yet. Enroll to get started!</a></li>';
    } else {
        courseList.innerHTML = courses.map(c => {
            const name = sanitizeText(c.name || 'Unnamed Course');
            const code = sanitizeText(c.code || '');
            const isActive = String(c.id) === String(currentCourseId);
            const targetPage = isTeacher
                ? `dashboard-teacher-course-summary.html?courseId=${c.id}`
                : `dashboard-student-course-summary.html?courseId=${c.id}`;
            return `<li><a href="${targetPage}" ${isActive ? 'class="active"' : ''}>${name}${code ? ` (${code})` : ''}</a></li>`;
        }).join('');
    }
}

// Set course title in sidebar
function setCourseTitle(courseTitleId, course) {
    const courseTitleElement = document.getElementById(courseTitleId);
    if (courseTitleElement && course) {
        courseTitleElement.textContent = sanitizeText(course.name || 'Curso sin nombre');
    }
}

// Setup collapsible course navigation menu
function setupCourseNavigation(courseId, isTeacher) {
    const basePath = isTeacher ? 'dashboard-teacher' : 'dashboard-student';

    const navItems = {
        progress: `${basePath}-course-progress.html`,
        sessions: `${basePath}-course-sessions.html`,
        repository: `${basePath}-course-repository.html`,
        settings: `${basePath}-course-settings.html`
    };

    // Get current page to determine which category to expand
    const currentPath = window.location.pathname.split('/').pop();

    // Determine active category based on current page
    let activeCategory = null;

    // Check which main category we're in
    if (currentPath.includes('-course-progress')) {
        activeCategory = 'progress';
    } else if (currentPath.includes('-course-sessions')) {
        activeCategory = 'sessions';
    } else if (currentPath.includes('-course-repository')) {
        activeCategory = 'repository';
    } else if (currentPath.includes('-course-settings')) {
        activeCategory = 'settings';
    } else if (currentPath.includes('-course-summary')) {
        // Summary page should have Progreso expanded by default
        activeCategory = 'progress';
    }

    // Get all nav items and subnavs
    const navItemsList = document.querySelectorAll('.nav-item');
    const subnavs = document.querySelectorAll('.course-subnav');
    const navMainLinks = document.querySelectorAll('.nav-main');
    const navSubLinks = document.querySelectorAll('.nav-sub');

    // Collapse all submenus initially
    subnavs.forEach(subnav => {
        subnav.style.display = 'none';
    });

    // Remove active class from all nav items
    navItemsList.forEach(item => {
        item.classList.remove('active', 'expanded');
    });

    // Remove active class from all nav links
    navMainLinks.forEach(link => {
        link.classList.remove('active');
    });
    navSubLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Expand and activate the current category
    if (activeCategory === 'progress') {
        const progressItem = document.querySelector('.nav-item[data-category="progress"]');
        if (progressItem) {
            progressItem.classList.add('active', 'expanded');
            const progressSubnav = progressItem.querySelector('.course-subnav');
            if (progressSubnav) {
                progressSubnav.style.display = 'block';
            }
            // Activate the first sub-item by default
            const firstSubLink = progressItem.querySelector('.nav-sub');
            if (firstSubLink) {
                firstSubLink.classList.add('active');
            }
        }
    } else if (activeCategory === 'sessions') {
        const sessionsItem = document.querySelector('.nav-item[data-category="sessions"]');
        if (sessionsItem) {
            sessionsItem.classList.add('active', 'expanded');
            const sessionsSubnav = sessionsItem.querySelector('.course-subnav');
            if (sessionsSubnav) {
                sessionsSubnav.style.display = 'block';
            }
            const firstSubLink = sessionsItem.querySelector('.nav-sub');
            if (firstSubLink) {
                firstSubLink.classList.add('active');
            }
        }
    } else if (activeCategory === 'repository') {
        const repoItem = document.querySelector('.nav-item[data-category="repository"]');
        if (repoItem) {
            repoItem.classList.add('active', 'expanded');
            const repoSubnav = repoItem.querySelector('.course-subnav');
            if (repoSubnav) {
                repoSubnav.style.display = 'block';
            }
            const firstSubLink = repoItem.querySelector('.nav-sub');
            if (firstSubLink) {
                firstSubLink.classList.add('active');
            }
        }
    }

    // Setup click handlers for main category links
    navMainLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const category = link.closest('.nav-item').dataset.category;
            const navItem = link.closest('.nav-item');

            // Check if this category is already expanded
            const isExpanded = navItem.classList.contains('expanded');

            if (category === 'progress' && !isExpanded) {
                // For Progreso: expand and redirect to progress page (which shows summary)
                e.preventDefault();
                // Collapse all other categories
                navItemsList.forEach(item => {
                    item.classList.remove('active', 'expanded');
                    const subnav = item.querySelector('.course-subnav');
                    if (subnav) subnav.style.display = 'none';
                });
                // Expand Progreso
                navItem.classList.add('active', 'expanded');
                const subnav = navItem.querySelector('.course-subnav');
                if (subnav) subnav.style.display = 'block';
                // Redirect to progress page
                window.location.href = `${navItems.progress}?courseId=${courseId}`;
            } else if ((category === 'sessions' || category === 'repository') && !isExpanded) {
                // For Sesiones and Repositorio: redirect to the category page
                e.preventDefault();
                window.location.href = `${navItems[category]}?courseId=${courseId}`;
            } else if (isExpanded) {
                // If already expanded, collapse it
                e.preventDefault();
                navItem.classList.remove('expanded');
                const subnav = navItem.querySelector('.course-subnav');
                if (subnav) subnav.style.display = 'none';
            }
        });
    });

    // Setup sub-section navigation (for sub-items in the menu)
    // These redirect to the same page but with different content based on subsection parameter
    const subNavTargets = {
        'nav-progress-summary': `${navItems.progress}?courseId=${courseId}&subsection=summary`,
        'nav-progress-quiz-ranking': `${navItems.progress}?courseId=${courseId}&subsection=quiz-ranking`,
        'nav-progress-participation': `${navItems.progress}?courseId=${courseId}&subsection=participation`,
        'nav-progress-reports': `${navItems.progress}?courseId=${courseId}&subsection=reports`,
        'nav-progress-achievements': `${navItems.progress}?courseId=${courseId}&subsection=achievements`,
        'nav-progress-rankings': `${navItems.progress}?courseId=${courseId}&subsection=rankings`,
        'nav-progress-grades': `${navItems.progress}?courseId=${courseId}&subsection=grades`,
        'nav-sessions-history': `${navItems.sessions}?courseId=${courseId}&subsection=history`,
        'nav-sessions-create': `dashboard-teacher-course-crease-session.html?courseId=${courseId}`,
        'nav-repository-search': `${navItems.repository}?courseId=${courseId}&subsection=search`,
        'nav-repository-downloads': `${navItems.repository}?courseId=${courseId}&subsection=downloads`
    };

    Object.entries(subNavTargets).forEach(([id, href]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = href;
            });
        }
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return '0B';
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
}

// Generate mock sessions data for a course
function getMockSessions(courseId) {
    const mockSessions = [
        { id: '1', courseId, name: 'Clase Introduccion', date: new Date().toISOString(), duration: '1h 30m', status: 'completed' },
        { id: '2', courseId, name: 'Taller Practico', date: new Date(Date.now() - 86400000).toISOString(), duration: '2h', status: 'completed' },
        { id: '3', courseId, name: 'Evaluacion Final', date: new Date(Date.now() + 86400000).toISOString(), duration: '1h', status: 'scheduled' }
    ];
    return mockSessions.filter(s => s.courseId === courseId);
}

// Generate mock repository files for a course
function getMockRepositoryFiles(courseId) {
    const mockFiles = [
        { id: '1', courseId, name: 'Clase 2026-04-07.pdf', size: 52428800, uploadDate: new Date().toISOString(), type: 'pdf' },
        { id: '2', courseId, name: 'Presentacion.pptx', size: 20971520, uploadDate: new Date(Date.now() - 86400000).toISOString(), type: 'pptx' },
        { id: '3', courseId, name: 'Practica.xlsx', size: 1048576, uploadDate: new Date(Date.now() - 172800000).toISOString(), type: 'xlsx' },
        { id: '4', courseId, name: 'Guia de Estudio.docx', size: 5242880, uploadDate: new Date(Date.now() - 259200000).toISOString(), type: 'docx' }
    ];
    return mockFiles.filter(f => f.courseId === courseId);
}

// Generate mock quiz data
async function getMockQuizzes(courseId) {
    const students = await DataService.getStudentsByCourse(courseId);
    return students.map(student => ({
        studentId: student.id,
        studentName: student.name || student.email,
        score: Math.floor(Math.random() * 20) + 1,
        date: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString()
    }));
}

// Generate mock participation data
async function getMockParticipationData(courseId) {
    const students = await DataService.getStudentsByCourse(courseId);
    return students.map(student => ({
        studentId: student.id,
        studentName: student.name || student.email,
        participationScore: Math.floor(Math.random() * 100) + 1,
        sessionsAttended: Math.floor(Math.random() * 10) + 1
    }));
}

// Generate mock achievement data for a student
async function getMockAchievements(courseId, studentId) {
    const achievements = [
        { id: '1', name: 'Asistencia Perfecta', description: 'Asistio a todas las sesiones', date: new Date().toISOString() },
        { id: '2', name: 'Mejor Participacion', description: 'Mayor puntaje de participacion', date: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Primer Quiz Perfecto', description: 'Obtuvo 20/20 en el primer quiz', date: new Date(Date.now() - 172800000).toISOString() }
    ];
    return achievements;
}

// Generate mock grade data for a student
function getMockGrades(courseId, studentId) {
    return [
        { id: '1', name: 'Quiz 1', score: Math.floor(Math.random() * 20) + 1, maxScore: 20, date: new Date(Date.now() - 259200000).toISOString() },
        { id: '2', name: 'Taller 1', score: Math.floor(Math.random() * 10) + 1, maxScore: 10, date: new Date(Date.now() - 172800000).toISOString() },
        { id: '3', name: 'Examen Parcial', score: Math.floor(Math.random() * 30) + 1, maxScore: 30, date: new Date(Date.now() - 86400000).toISOString() }
    ];
}

export {
    sanitizeText,
    getInitials,
    getCourseIdFromUrl,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    formatDate,
    formatFileSize,
    getMockSessions,
    getMockRepositoryFiles,
    getMockQuizzes,
    getMockParticipationData,
    getMockAchievements,
    getMockGrades
};