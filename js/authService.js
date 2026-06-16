// authService.js
import { DataService } from './dataService.js';
import { ROLES, ERROR_MESSAGES } from './config.js';

// Sanitize user input to prevent XSS
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
    return password && password.length >= 6;
}

const AuthService = {
    async login(email, password) {
        if (!isValidEmail(email)) {
            throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
        }

        try {
            const user = await DataService.loginUser(email, password);
            const userToStore = { ...user };
            delete userToStore.password;
            delete userToStore.passwordHash;

            // CHANGED: Using localStorage instead of sessionStorage
            localStorage.setItem('currentUser', JSON.stringify(userToStore));
            return userToStore;
        } catch (error) {
            console.error('Login failed:', error);
            // If it's a connection error, propagate it
            if (error.isConnectionError) {
                throw error;
            }
            throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
    },

    async register(userData) {
        if (!isValidEmail(userData.email)) {
            throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
        }
        if (!isValidPassword(userData.password)) {
            throw new Error(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
        }

        try {
            const user = await DataService.registerUser({
                email: sanitizeInput(userData.email),
                password: userData.password,
                name: userData.name ? sanitizeInput(userData.name) : null,
                role: userData.role !== undefined ? userData.role : null
            });
            return user;
        } catch (error) {
            // If it's a connection error, propagate it
            if (error.isConnectionError) {
                throw error;
            }
            if (error.message && error.message.includes('already exists')) {
                throw new Error(ERROR_MESSAGES.USER_EXISTS);
            }
            throw error;
        }
    },

    async loginUser(email, password) {
        return this.login(email, password);
    },

    logout() {
        // CHANGED: Using localStorage instead of sessionStorage
        localStorage.removeItem('currentUser');
    },

    getCurrentUser() {
        try {
            // CHANGED: Using localStorage instead of sessionStorage
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing currentUser:', error);
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    isTeacher() {
        const user = this.getCurrentUser();
        return user && user.role === 'teacher';
    },

    isStudent() {
        const user = this.getCurrentUser();
        return user && user.role === 'student';
    },

    // Get sanitized user display name
    getDisplayName(user) {
        const currentUser = user || this.getCurrentUser();
        if (!currentUser) return 'User';
        return sanitizeInput(currentUser.name || currentUser.email || 'User');
    }
};

export { AuthService };