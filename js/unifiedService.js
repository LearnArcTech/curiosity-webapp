// unifiedService.js - Unified data service that switches between localStorage and API

import { DataService } from './dataService.js';
import { ApiService, isProduction } from './apiService.js';

// Use API in production, localStorage in development
const useAPI = isProduction();

// Check if we should use API
function shouldUseAPI() {
    return useAPI;
}

// Unified service that automatically selects the right backend
const UnifiedService = {
    // Authentication methods
    async registerUser(userData) {
        if (shouldUseAPI()) {
            return await ApiService.registerUser(userData);
        } else {
            return await DataService.registerUser(userData);
        }
    },
    
    getUserByEmail(email) {
        if (shouldUseAPI()) {
            return ApiService.getUserByEmail(email);
        } else {
            return DataService.getUserByEmail(email);
        }
    },
    
    async updateUser(email, updates) {
        if (shouldUseAPI()) {
            // In API mode, we use user ID from currentUser
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                try {
                    const user = JSON.parse(currentUser);
                    return await ApiService.updateUser(user.id, updates);
                } catch (error) {
                    console.error('Error parsing currentUser:', error);
                }
            }
            return null;
        } else {
            return await DataService.updateUser(email, updates);
        }
    },
    
    // Course methods
    async createCourse(courseData) {
        if (shouldUseAPI()) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                try {
                    const user = JSON.parse(currentUser);
                    return await ApiService.createCourse(courseData, user.id);
                } catch (error) {
                    console.error('Error parsing currentUser:', error);
                }
            }
            throw new Error('Not authenticated');
        } else {
            return await DataService.createCourse(courseData);
        }
    },
    
    getCourseById(id) {
        if (shouldUseAPI()) {
            return ApiService.getCourseById(id);
        } else {
            return DataService.getCourseById(id);
        }
    },
    
    getCourseByCode(code) {
        if (shouldUseAPI()) {
            return ApiService.getCourseByCode(code);
        } else {
            return DataService.getCourseByCode(code);
        }
    },
    
    getAllCourses() {
        if (shouldUseAPI()) {
            return ApiService.getAllCourses();
        } else {
            return DataService.getAllCourses();
        }
    },
    
    // Enrollment methods
    async enrollStudent(studentId, courseId) {
        if (shouldUseAPI()) {
            return await ApiService.enrollStudent(studentId, courseId);
        } else {
            return await DataService.enrollStudent(studentId, courseId);
        }
    },
    
    getEnrollmentsByStudent(studentId) {
        if (shouldUseAPI()) {
            return ApiService.getEnrollmentsByStudent(studentId);
        } else {
            return DataService.getEnrollmentsByStudent(studentId);
        }
    },
    
    getStudentsByCourse(courseId) {
        if (shouldUseAPI()) {
            return ApiService.getStudentsByCourse(courseId);
        } else {
            return DataService.getStudentsByCourse(courseId);
        }
    },
    
    // Get teacher courses
    getTeacherCourses(teacherId) {
        if (shouldUseAPI()) {
            return ApiService.getTeacherCourses(teacherId);
        } else {
            // In localStorage mode, filter by teacher
            const allCourses = DataService.getAllCourses();
            return allCourses.filter(c => c.teacherId === teacherId);
        }
    }
};

export { UnifiedService, shouldUseAPI, DataService, ApiService };
