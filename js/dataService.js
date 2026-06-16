// dataService.js - API-based data service
// This service makes HTTP requests to the Python API server
// It handles both development (localhost:8000) and production (/api) modes

import { getApiBaseUrl } from './config.js';

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
    const data = await response.json();
    
    if (!response.ok) {
        const error = new Error(data.message || 'API request failed');
        error.response = response;
        error.data = data;
        throw error;
    }
    
    return data;
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
        throw error;
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
        const response = await apiRequest('GET', `/courses/code/${code}`);
        return response.course;
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
    }
};

export { DataService, getAuthToken, apiRequest };
