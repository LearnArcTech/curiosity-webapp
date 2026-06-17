// dataService.js - API-based data service
// This service makes HTTP requests to the Python API server
// It handles both development (localhost:8000) and production (/api) modes

import { getApiBaseUrl, ERROR_MESSAGES } from './config.js';

/**
 * ApiError - Centralized error class for API-related errors
 * Provides consistent error handling with status, data, and connection error info
 */
export class ApiError extends Error {
    constructor(message, status = null, data = null, isConnectionError = false) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.isConnectionError = isConnectionError;
        
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
    
    /**
     * Create an ApiError from a response
     * @param {Response} response - Fetch API response
     * @param {object} data - Parsed response data
     * @returns {ApiError} ApiError instance
     */
    static fromResponse(response, data = null) {
        const message = data?.message || 'API request failed';
        return new ApiError(message, response.status, data, false);
    }
    
    /**
     * Create a connection error
     * @param {Error} originalError - Original network error
     * @returns {ApiError} ApiError instance
     */
    static connectionError(originalError) {
        return new ApiError(
            ERROR_MESSAGES.CONNECTION_ERROR,
            null,
            null,
            true
        );
    }
}

// Get the current user's authentication token/ID
function getAuthToken() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('currentUser');
    if (user) {
        try {
            const userObj = JSON.parse(user);
            return userObj.id;
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Get headers with auth token
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = token;
    }

    return headers;
}

// Handle API response
async function handleResponse(response) {
    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        const error = new Error('Invalid server response');
        error.response = response;
        error.parseError = parseError;
        throw error;
    }

    // Now throw separately, outside the try/catch, so status is preserved
    if (!response.ok) {
        const error = new Error(data.message || 'API request failed');
        error.response = response;
        error.data = data;
        error.status = response.status;
        throw error;
    }

    return data;
}

// Detect if error is a network/connection error
function isConnectionError(error) {
    // Check for common network error types
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return true;
    }
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        return true;
    }
    if (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('net::ERR') ||
        error.message.includes('Failed to load')
    )) {
        return true;
    }
    return false;
}

// Make API request
async function apiRequest(method, endpoint, body = null) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const options = {
        method,
        headers: getHeaders()
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        return await handleResponse(response);
    } catch (error) {
        console.error(`API request failed: ${method} ${endpoint}`, error);

        // Create a more user-friendly error for connection issues
        if (isConnectionError(error)) {
            const connectionError = new Error(ERROR_MESSAGES.CONNECTION_ERROR);
            connectionError.originalError = error;
            connectionError.isConnectionError = true;
            throw connectionError;
        }

        // For other errors, try to provide a better message
        const improvedError = new Error(error.message || ERROR_MESSAGES.NETWORK_ERROR);
        improvedError.originalError = error;
        improvedError.status = error.status;  // ← add this
        improvedError.data = error.data;      // ← and this, for the data.error check
        throw improvedError;
    }
}

const DataService = {
    // Authentication operations
    async loginUser(email, password) {
        const response = await apiRequest('POST', '/auth/login', {
            email,
            password
        });
        return response.user;
    },

    // User operations
    async registerUser(userData) {
        const response = await apiRequest('POST', '/auth/register', {
            email: userData.email,
            password: userData.password || userData.passwordHash,
            name: userData.name,
            role: userData.role
        });
        return response.user;
    },

    async getUserByEmail(email) {
        // Not supported by API - returns null
        return null;
    },

    async getUserById(userId) {
        const response = await apiRequest('GET', `/users/${userId}`);
        return response.user;
    },

    async updateUser(userId, updates) {
        const response = await apiRequest('PUT', `/users/me`, updates);
        return response.user;
    },

    // Course operations
    async createCourse(courseData) {
        const response = await apiRequest('POST', '/courses', {
            name: courseData.name,
            description: courseData.description,
            code: courseData.code
        });
        return response.course;
    },

    async getCourseById(id) {
        if (!id) return null;
        const response = await apiRequest('GET', `/courses/${id}`);
        return response.course;
    },

    async getCourseByCode(code) {
        if (!code) return null;
        try {
            const response = await apiRequest('GET', `/courses/code/${code}`);
            return response.course;
        } catch (error) {
            if (error.status === 404 || (error.data && error.data.error)) {
                return null;  // ✅ This should work now...
            }
            throw error;
        }
    },

    async getAllCourses() {
        const response = await apiRequest('GET', '/courses');
        return response.courses || [];
    },

    async getTeacherCourses(teacherId) {
        const response = await apiRequest('GET', `/courses?user_id=${teacherId}`);
        return response.courses || [];
    },

    // Enrollment operations
    async enrollStudent(studentId, courseId) {
        const course = await this.getCourseById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        const response = await apiRequest('POST', '/enrollments', {
            course_code: course.code
        });
        return response.enrollment;
    },

    async getEnrollmentsByStudent(studentId) {
        const response = await apiRequest('GET', '/enrollments');
        return response.enrollments || [];
    },

    async getStudentsByCourse(courseId) {
        if (!courseId) return [];
        const response = await apiRequest('GET', `/courses/${courseId}`);
        return response.students || [];
    },

    // Session operations
    async createSession(sessionData) {
        const response = await apiRequest('POST', '/sessions', {
            course_id: sessionData.course_id,
            name: sessionData.name,
            requires_password: sessionData.requires_password || false,
            password: sessionData.password || null,
            waiting_room: sessionData.waiting_room || false
        });
        return response.session;
    },

    async getSession(sessionId) {
        if (!sessionId) return null;
        const response = await apiRequest('GET', `/sessions/${sessionId}`);
        return response.session;
    },

    async getSessionsByCourse(courseId) {
        if (!courseId) return [];
        const response = await apiRequest('GET', `/sessions?course_id=${courseId}`);
        return response.sessions || [];
    },

    async joinSession(sessionId, userId, password = null) {
        const body = { user_id: userId };
        if (password !== null) body.password = password;
        const response = await apiRequest('POST', `/sessions/${sessionId}/join`, body);
        return response.session;
    },

    async leaveSession(sessionId, userId) {
        const response = await apiRequest('POST', `/sessions/${sessionId}/leave`, { user_id: userId });
        return response.session;
    },

    async updateSession(sessionId, updates) {
        const response = await apiRequest('PUT', `/sessions/${sessionId}`, updates);
        return response.session;
    },

    async getSessionParticipants(sessionId) {
        if (!sessionId) return [];
        const response = await apiRequest('GET', `/sessions/${sessionId}/participants`);
        return response.participants || [];
    }
};

export { DataService, getAuthToken, apiRequest, isConnectionError };