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
            code: await this.generateCourseCode(),
            ...courseData,
            teacher_id: teacher.id
        };

        return await DataService.createCourse(course);
    },

    async generateCourseCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('Failed to generate unique course code after multiple attempts');
            }
            const existing = await DataService.getCourseByCode(code);
            if (!existing) break;
        } while (true);
        
        return code;
    },

    async enrollInCourse(courseCode) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'student') {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        const course = await DataService.getCourseByCode(courseCode);
        if (!course) {
            throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
        }

        // Check for duplicate enrollment
        const enrollments = await DataService.getEnrollmentsByStudent(user.id);
        const alreadyEnrolled = enrollments.some(e => e.course_id === course.id);
        if (alreadyEnrolled) {
            throw new Error(ERROR_MESSAGES.DUPLICATE_ENROLLMENT);
        }

        return await DataService.enrollStudent(user.id, course.id);
    },

    async getTeacherCourses() {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'teacher') {
            return [];
        }

        const allCourses = await DataService.getTeacherCourses(user.id);
        return allCourses;
    },

    async getStudentCourses() {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'student') {
            return [];
        }

        const enrollments = await DataService.getEnrollmentsByStudent(user.id);
        
        const courses = [];
        for (const enrollment of enrollments) {
            const course = await DataService.getCourseById(enrollment.course_id);
            if (course) {
                courses.push(course);
            }
        }
        
        return courses;
    },

    async getCourseStudents(courseId) {
        if (!AuthService.isTeacher()) {
            return [];
        }

        const course = await DataService.getCourseById(courseId);
        if (!course || course.teacher_id !== AuthService.getCurrentUser().id) {
            return [];
        }

        return await DataService.getStudentsByCourse(courseId);
    }
};

export { CourseService };
