// apiService.js - API-based data service for production
// This service makes HTTP requests to the Python API server

const API_BASE_URL = ''; // Empty because we're at the same origin

// Check if we should use API (production) or localStorage (development)
function isProduction() {
    // Use API in production, localStorage in development
    // You can also use environment variables or other heuristics
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' &&
           window.location.hostname !== '';
}

// Get the current user's authentication token/ID
function getAuthToken() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        try {
            const userObj = JSON.parse(user);
            return userObj.id; // Use user ID as auth token for now
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
    const url = `${API_BASE_URL}${endpoint}`;
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

const ApiService = {
    // Authentication
    async registerUser(userData) {
        const response = await apiRequest('POST', '/api/auth/register', {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role
        });
        return response.data.user;
    },
    
    async loginUser(email, password) {
        const response = await apiRequest('POST', '/api/auth/login', {
            email,
            password
        });
        return response.data.user;
    },
    
    async getUserByEmail(email) {
        // This is a bit tricky - we don't have a direct endpoint for this
        // In production, we'd need to fetch all users (admin only) or use current user
        // For now, we'll return null and let authService handle it differently
        return null;
    },
    
    async updateUser(userId, updates) {
        const response = await apiRequest('PUT', `/api/users/me`, updates);
        return response.data.user;
    },
    
    // Course operations
    async createCourse(courseData, teacherId) {
        const response = await apiRequest('POST', '/api/courses', courseData);
        return response.data.course;
    },
    
    async getCourseById(id) {
        const response = await apiRequest('GET', `/api/courses/${id}`);
        return response.data.course;
    },
    
    async getCourseByCode(code) {
        const response = await apiRequest('GET', `/api/courses/code/${code}`);
        return response.data.course;
    },
    
    async getAllCourses() {
        const response = await apiRequest('GET', '/api/courses');
        return response.data.courses || [];
    },
    
    async getTeacherCourses(teacherId) {
        const response = await apiRequest('GET', `/api/courses?user_id=${teacherId}`);
        return response.data.courses || [];
    },
    
    async updateCourse(courseId, updates) {
        const response = await apiRequest('PUT', `/api/courses/${courseId}`, updates);
        return response.data.course;
    },
    
    // Enrollment operations
    async enrollStudent(studentId, courseId) {
        // First, we need to get the course code
        const course = await this.getCourseById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        const response = await apiRequest('POST', '/api/enrollments', {
            course_code: course.code
        });
        return response.data.enrollment;
    },
    
    async getEnrollmentsByStudent(studentId) {
        // Use the current user's enrollments endpoint
        const response = await apiRequest('GET', '/api/enrollments');
        return response.data.enrollments || [];
    },
    
    async getStudentsByCourse(courseId) {
        const response = await apiRequest('GET', `/api/courses/${courseId}`);
        return response.data.students || [];
    },
    
    // User operations
    async getUserById(userId) {
        const response = await apiRequest('GET', `/api/users/${userId}`);
        return response.data.user;
    }
};

export { ApiService, isProduction };
