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
            const response = await DataService.loginUser(email, password);
            // loginUser returns { token, user } from the backend
            const userToStore = { ...response.user };
            delete userToStore.password;
            delete userToStore.passwordHash;

            localStorage.setItem('currentUser', JSON.stringify(userToStore));
            // Persist the session token so validateSession() can authenticate
            if (response.token) {
                localStorage.setItem('authToken', response.token);
            }
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

            if (user.token) {
                localStorage.setItem('authToken', user.token);
            }

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

    /**
     * Dedicated live session validator.
     * Pings the backend to verify if the stored token/session is still active.
     * Automatically logs out the user locally if verification fails.
     */
    async validateSession() {
        // Fast local check: if we aren't authenticated locally, don't waste an API call
        if (!this.isAuthenticated()) {
            return false;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            // No token means we can't prove identity to the server
            this.logout();
            return false;
        }

        try {
            // Pings your dedicated validation API route, sending the real session token
            const response = await DataService.validateToken();

            // Keep localStorage updated with fresh user profile state from the DB
            if (response && response.user) {
                localStorage.setItem('currentUser', JSON.stringify(response.user));
            }
            return true;
        } catch (error) {
            console.warn('Session verification failed (DB may have been reset). Cleaning up local state.', error);
            this.logout(); // Instantly wipes localStorage
            return false;
        }
    },

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
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