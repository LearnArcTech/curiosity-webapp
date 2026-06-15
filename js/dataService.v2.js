// dataService.js - Data service that switches between localStorage and API
// In development: uses localStorage
// In production: uses API calls

import { isProduction, API_BASE_URL } from './config.js';

// Check if we should use API
function useAPI() {
    return isProduction();
}

// Get the current user's ID for API authentication
function getCurrentUserId() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        try {
            return JSON.parse(user).id;
        } catch (error) {
            return null;
        }
    }
    return null;
}

// API request helper
async function apiRequest(method, endpoint, body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    const userId = getCurrentUserId();
    if (userId) {
        headers['Authorization'] = userId;
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            const error = new Error(data.message || 'API request failed');
            error.response = response;
            error.data = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error(`API request failed: ${method} ${endpoint}`, error);
        throw error;
    }
}

// LocalStorage implementation (original)
const LocalStorageService = {
    _lock: false,
    _lockQueue: [],

    _acquireLock() {
        return new Promise((resolve) => {
            if (!this._lock) {
                this._lock = true;
                resolve();
            } else {
                this._lockQueue.push(resolve);
            }
        });
    },

    _releaseLock() {
        if (this._lockQueue.length > 0) {
            const nextResolve = this._lockQueue.shift();
            nextResolve();
        } else {
            this._lock = false;
        }
    },

    init() {
        try {
            const existingData = localStorage.getItem('curiosityData');
            if (!existingData) {
                const initialData = {
                    users: [],
                    courses: [],
                    enrollments: []
                };
                localStorage.setItem('curiosityData', JSON.stringify(initialData));
            } else {
                try {
                    const data = JSON.parse(existingData);
                    if (!data.users || !data.courses || !data.enrollments) {
                        const fixedData = {
                            users: data.users || [],
                            courses: data.courses || [],
                            enrollments: data.enrollments || []
                        };
                        localStorage.setItem('curiosityData', JSON.stringify(fixedData));
                    }
                } catch (e) {
                    localStorage.removeItem('curiosityData');
                    this.init();
                }
            }
        } catch (error) {
            console.error('Failed to initialize LocalStorageService:', error);
        }
    },

    getData() {
        try {
            const data = localStorage.getItem('curiosityData');
            return data ? JSON.parse(data) : { users: [], courses: [], enrollments: [] };
        } catch (error) {
            console.error('Error parsing curiosityData:', error);
            this.init();
            return this.getData();
        }
    },

    async saveData(data) {
        try {
            await this._acquireLock();
            localStorage.setItem('curiosityData', JSON.stringify(data));
            this._releaseLock();
        } catch (error) {
            this._releaseLock();
            console.error('Error saving to localStorage:', error);
            throw new Error('Failed to save data. Storage may be full.');
        }
    },

    async registerUser(user) {
        const data = this.getData();
        const existingUser = data.users.find(u => u.email === user.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const userToStore = { ...user };
        delete userToStore.password;
        data.users.push(userToStore);
        await this.saveData(data);
        return userToStore;
    },

    getUserByEmail(email) {
        const data = this.getData();
        return data.users.find(u => u.email === email);
    },

    async updateUser(email, updates) {
        const data = this.getData();
        const userIndex = data.users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...updates };
            await this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    },

    async createCourse(course) {
        const data = this.getData();
        data.courses.push(course);
        await this.saveData(data);
        return course;
    },

    getCourseById(id) {
        if (!id) return null;
        const data = this.getData();
        return data.courses.find(c => c.id === id) || null;
    },

    getCourseByCode(code) {
        if (!code) return null;
        const data = this.getData();
        return data.courses.find(c => c.code === code) || null;
    },

    getAllCourses() {
        const data = this.getData();
        return data.courses || [];
    },

    async enrollStudent(studentId, courseId) {
        const data = this.getData();
        const duplicate = data.enrollments.find(
            e => e.studentId === studentId && e.courseId === courseId
        );
        if (duplicate) {
            return duplicate;
        }
        const enrollment = {
            id: Date.now().toString(),
            studentId,
            courseId,
            date: new Date().toISOString()
        };
        data.enrollments.push(enrollment);
        await this.saveData(data);
        return enrollment;
    },

    getEnrollmentsByStudent(studentId) {
        if (!studentId) return [];
        const data = this.getData();
        return data.enrollments.filter(e => e.studentId === studentId) || [];
    },

    getStudentsByCourse(courseId) {
        if (!courseId) return [];
        const data = this.getData();
        const enrollments = data.enrollments.filter(e => e.courseId === courseId);
        return enrollments.map(e => {
            const user = data.users.find(u => u.id === e.studentId);
            return user;
        }).filter(u => u) || [];
    }
};

// API implementation
const ApiService = {
    async registerUser(user) {
        const response = await apiRequest('POST', '/api/auth/register', {
            email: user.email,
            password: user.password || user.passwordHash,
            name: user.name,
            role: user.role
        });
        return response.data.user;
    },

    async getUserByEmail(email) {
        // Note: This is tricky - in API mode, we can't list all users
        // For auth, we'll need to modify authService to handle this differently
        // For now, return null
        return null;
    },

    async updateUser(email, updates) {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('Not authenticated');
        }
        const response = await apiRequest('PUT', '/api/users/me', updates);
        return response.data.user;
    },

    async createCourse(course) {
        const response = await apiRequest('POST', '/api/courses', {
            name: course.name,
            description: course.description,
            code: course.code
        });
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

    async enrollStudent(studentId, courseId) {
        // Need to get course code first
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
        const response = await apiRequest('GET', '/api/enrollments');
        return response.data.enrollments || [];
    },

    async getStudentsByCourse(courseId) {
        const response = await apiRequest('GET', `/api/courses/${courseId}`);
        return response.data.students || [];
    }
};

// Main DataService that switches between implementations
const DataService = useAPI() ? ApiService : LocalStorageService;

// Initialize in development mode
if (!useAPI() && typeof window !== 'undefined' && window.localStorage) {
    LocalStorageService.init();
}

export { DataService, LocalStorageService, ApiService, useAPI };
