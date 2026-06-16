// config.js - Application configuration and constants

export const ROUTES = {
    LOGIN: 'login.html',
    REGISTER: 'login-register.html',
    LOGIN_CODE: 'login-code.html',
    LOGIN_WELCOME: 'login-welcome.html',
    ONBOARDING_ROLE: 'onboarding-role.html',
    ONBOARDING_NAME: 'onboarding-name.html',
    ONBOARDING_COURSE: 'onboarding-course.html',
    DASHBOARD_STUDENT: 'dashboard-student.html',
    DASHBOARD_TEACHER: 'dashboard-teacher.html',
    // Student course pages (relative to pages/ directory)
    STUDENT_COURSE_SUMMARY: 'dashboard-student-course-summary.html',
    STUDENT_COURSE_PROGRESS: 'dashboard-student-course-progress.html',
    STUDENT_COURSE_SESSIONS: 'dashboard-student-course-sessions.html',
    STUDENT_COURSE_REPOSITORY: 'dashboard-student-course-repository.html',
    STUDENT_COURSE_SETTINGS: 'dashboard-student-course-settings.html',
    // Teacher course pages (relative to pages/ directory)
    TEACHER_COURSE_SUMMARY: 'dashboard-teacher-course-summary.html',
    TEACHER_COURSE_PROGRESS: 'dashboard-teacher-course-progress.html',
    TEACHER_COURSE_SESSIONS: 'dashboard-teacher-course-sessions.html',
    TEACHER_COURSE_REPOSITORY: 'dashboard-teacher-course-repository.html',
    TEACHER_COURSE_SETTINGS: 'dashboard-teacher-course-settings.html'
};

export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher'
};

export const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    REMEMBERED_USER: 'rememberedUser'
};

export const ERROR_MESSAGES = {
    INVALID_EMAIL: 'Invalid email format',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    USER_EXISTS: 'User already exists',
    INVALID_CREDENTIALS: 'Invalid email or password',
    NOT_AUTHENTICATED: 'Please log in to continue',
    NOT_AUTHORIZED: 'You do not have permission to perform this action',
    COURSE_NOT_FOUND: 'Course not found',
    DUPLICATE_ENROLLMENT: 'You are already enrolled in this course',
    CONNECTION_ERROR: 'Cannot connect to server. Please check your internet connection and try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.'
};

// Environment detection
export function isDevelopment() {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '' ||
            hostname.startsWith('192.168') ||
            hostname.startsWith('10.');
    }
    return false;
}

export function isProduction() {
    return !isDevelopment();
}

// API configuration
export function getApiBaseUrl() {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
            return 'http://127.0.0.1:8000/api';  // ← always explicit in dev
        }
        return 'https://backend-qytn.onrender.com/api';
    }
    return 'https://backend-qytn.onrender.com/api';
}

// Check if we should use API (always true now, since backend is ready)
export function useAPI() {
    return true;
}
