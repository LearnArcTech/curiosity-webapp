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
    INVALID_EMAIL: 'El formato del correo no es válido',
    PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    USER_EXISTS: 'El usuario ya existe',
    INVALID_CREDENTIALS: 'Correo o contraseña inválidos',
    NOT_AUTHENTICATED: 'Inicia sesión para continuar',
    NOT_AUTHORIZED: 'No tienes permiso para realizar esta acción',
    COURSE_NOT_FOUND: 'No se encontró el curso',
    DUPLICATE_ENROLLMENT: 'Ya estás inscrito en este curso'
};
