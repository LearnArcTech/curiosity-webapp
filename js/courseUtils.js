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

// Get course ID from URL parameters
function getCourseId() {
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

    const courseId = getCourseId();

    if (!courseId) {
        window.location.href = isTeacher ? 'dashboard.html?role=teacher' : 'dashboard.html?role=student';
        return null;
    }

    const course = await DataService.getCourseById(courseId);

    if (!course) {
        window.location.href = isTeacher ? 'dashboard.html?role=teacher' : 'dashboard.html?role=student';
        return null;
    }

    if (isTeacher) {
        // Coerce both to strings to avoid number/string type mismatch
        // Also check camelCase fallback in case the API uses teacherId
        const courseTeacherId = String(course.teacher_id ?? course.teacherId ?? '');
        const userId = String(user.id ?? '');

        if (!courseTeacherId || courseTeacherId !== userId) {
            window.location.href = 'dashboard.html?role=teacher';
            return null;
        }
    } else if (isStudent) {
        const studentCourses = await CourseService.getStudentCourses();
        // Same coercion for enrollment ID comparison
        const isEnrolled = studentCourses.some(c => String(c.id) === String(courseId));
        if (!isEnrolled) {
            window.location.href = 'dashboard.html?role=student';
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
            const role = isTeacher ? 'teacher' : 'student';
            const targetPage = `dashboard.html?role=${role}&courseId=${c.id}&section=summary`;
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
    // Get current section from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const currentSection = urlParams.get('section') || 'summary';
    const currentSubsection = urlParams.get('subsection');

    // Determine active category based on URL section parameter
    let activeCategory = null;
    
    // Map section names to categories
    const sectionToCategory = {
        summary: 'progress',
        progress: 'progress',
        sessions: 'sessions',
        repository: 'repository',
        settings: 'settings',
        create: 'sessions' // create session is a subsection of sessions
    };
    
    activeCategory = sectionToCategory[currentSection] || 'progress';

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
            const isExpanded = navItem.classList.contains('expanded');

            e.preventDefault();

            // Collapse all other categories
            navItemsList.forEach(item => {
                if (item !== navItem) {
                    item.classList.remove('active', 'expanded');
                    const subnav = item.querySelector('.course-subnav');
                    if (subnav) subnav.style.display = 'none';
                }
            });

            if (!isExpanded) {
                navItem.classList.add('active', 'expanded');
                const subnav = navItem.querySelector('.course-subnav');
                if (subnav) subnav.style.display = 'block';
            } else {
                navItem.classList.remove('expanded');
                const subnav = navItem.querySelector('.course-subnav');
                if (subnav) subnav.style.display = 'none';
            }
        });
    });

    // Setup sub-section navigation (for sub-items in the menu)
    // These redirect to the same page but with different content based on subsection parameter
    const role = isTeacher ? 'teacher' : 'student';
    const subNavTargets = {
        'nav-progress-summary': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=summary`,
        'nav-progress-quiz-ranking': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=quiz-ranking`,
        'nav-progress-participation': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=participation`,
        'nav-progress-reports': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=reports`,
        'nav-progress-achievements': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=achievements`,
        'nav-progress-rankings': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=rankings`,
        'nav-progress-grades': `dashboard.html?role=${role}&courseId=${courseId}&section=progress&subsection=grades`,
        'nav-sessions-history': `dashboard.html?role=${role}&courseId=${courseId}&section=sessions&subsection=history`,
        'nav-sessions-create': `dashboard.html?role=${role}&courseId=${courseId}&section=sessions&subsection=create`,
        'nav-repository-search': `dashboard.html?role=${role}&courseId=${courseId}&section=repository&subsection=search`,
        'nav-repository-downloads': `dashboard.html?role=${role}&courseId=${courseId}&section=repository&subsection=downloads`
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

export {
    sanitizeText,
    getInitials,
    getCourseId,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation,
    formatDate,
    formatFileSize
};