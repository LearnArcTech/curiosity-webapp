// courseService.js
import { DataService } from './dataService.js';
import { AuthService } from './authService.js';
import { ERROR_MESSAGES } from './config.js';

const CourseService = {
    async createCourse(courseData) {
        if (!AuthService.isTeacher()) {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        const teacher = AuthService.getCurrentUser();
        const course = {
            id: Date.now().toString(),
            code: this.generateCourseCode(),
            ...courseData,
            teacherId: teacher.id,
            createdAt: new Date().toISOString(),
            students: []
        };

        return await DataService.createCourse(course);
    },

    generateCourseCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('No se pudo generar un código de curso único después de varios intentos');
            }
        } while (DataService.getCourseByCode(code));
        
        return code;
    },

    async enrollInCourse(courseCode) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'student') {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        const course = DataService.getCourseByCode(courseCode);
        if (!course) {
            throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
        }

        // Check for duplicate enrollment
        const enrollments = DataService.getEnrollmentsByStudent(user.id);
        const alreadyEnrolled = enrollments.some(e => e.courseId === course.id);
        if (alreadyEnrolled) {
            throw new Error(ERROR_MESSAGES.DUPLICATE_ENROLLMENT);
        }

        return await DataService.enrollStudent(user.id, course.id);
    },

    getTeacherCourses() {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'teacher') {
            return [];
        }

        const allCourses = DataService.getAllCourses();
        return allCourses.filter(c => c.teacherId === user.id);
    },

    getStudentCourses() {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'student') {
            return [];
        }

        const enrollments = DataService.getEnrollmentsByStudent(user.id);
        const allCourses = DataService.getAllCourses();

        return enrollments.map(e => {
            return allCourses.find(c => c.id === e.courseId);
        }).filter(c => c);
    },

    getCourseStudents(courseId) {
        if (!AuthService.isTeacher()) {
            return [];
        }

        const course = DataService.getCourseById(courseId);
        if (!course || course.teacherId !== AuthService.getCurrentUser().id) {
            return [];
        }

        return DataService.getStudentsByCourse(courseId);
    }
};

export { CourseService };
