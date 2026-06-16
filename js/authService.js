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

// Hash password using SHA-256 (Web Crypto API)
async function hashPassword(password) {
    if (!password) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
        
        const user = DataService.getUserByEmail(email);
        if (user) {
            const hashedPassword = await hashPassword(password);
            // Support both hashed and plain text passwords for migration
            const storedPassword = user.passwordHash || user.password;
            if (storedPassword === hashedPassword || storedPassword === password) {
                // Ensure user has hashed password
                if (user.password && !user.passwordHash) {
                    user.passwordHash = await hashPassword(user.password);
                    delete user.password;
                    await DataService.updateUser(email, { passwordHash: user.passwordHash });
                }
                const userToStore = { ...user };
                delete userToStore.password;
                delete userToStore.passwordHash;
                localStorage.setItem('currentUser', JSON.stringify(userToStore));
                return userToStore;
            }
        }
        return null;
    },

    async register(userData) {
        if (!isValidEmail(userData.email)) {
            throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
        }
        if (!isValidPassword(userData.password)) {
            throw new Error(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
        }
        
        // Check if user already exists
        const existingUser = DataService.getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error(ERROR_MESSAGES.USER_EXISTS);
        }
        
        const hashedPassword = await hashPassword(userData.password);
        const user = {
            id: Date.now().toString(),
            email: sanitizeInput(userData.email),
            name: userData.name ? sanitizeInput(userData.name) : null,
            passwordHash: hashedPassword,
            role: userData.role !== undefined ? userData.role : null,
            createdAt: new Date().toISOString()
        };
        return await DataService.registerUser(user);
    },

    logout() {
        localStorage.removeItem('currentUser');
    },

    getCurrentUser() {
        try {
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error al leer currentUser:', error);
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
        if (!currentUser) return 'Usuario';
        return sanitizeInput(currentUser.name || currentUser.email || 'Usuario');
    }
};

export { AuthService };
