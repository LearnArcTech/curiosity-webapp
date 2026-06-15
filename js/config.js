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
    DASHBOARD_TEACHER: 'dashboard-teacher.html'
};

export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher'
};

export const STORAGE_KEYS = {
    DATA: 'curiosityData',
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
    DUPLICATE_ENROLLMENT: 'You are already enrolled in this course'
};
