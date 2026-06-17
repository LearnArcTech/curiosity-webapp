// courseService.js
import { DataService } from './dataService.js';
import { AuthService } from './authService.js';
import { ERROR_MESSAGES } from './config.js';

const CourseService = {
    async createCourse(courseData) {
        if (!AuthService.isTeacher()) {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        return await DataService.createCourse(courseData);
    },

    async enrollInCourse(courseCode) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'student') {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        try {
            return await DataService.enrollStudent(courseCode);
        } catch (error) {
            if (error.status === 404) throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
            if (error.status === 400) throw new Error(ERROR_MESSAGES.DUPLICATE_ENROLLMENT);
            throw error;
        }
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
