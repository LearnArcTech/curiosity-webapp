// CoursePageBase.js - Base class for course-related pages
// Handles common lifecycle: validateCourseAccess → populateCourseList → setCourseTitle → setupCourseNavigation → displayContent

import { AuthService, CourseService } from './services.js';
import {
    sanitizeText,
    validateCourseAccess,
    populateCourseList,
    setCourseTitle,
    setupCourseNavigation
} from './courseUtils.js';

/**
 * Base class for course-related pages
 * Handles common authentication, course validation, and navigation setup
 */
export class CoursePageBase {
    /**
     * @param {boolean} isTeacher - Whether this is a teacher page
     * @param {string} courseListId - DOM element ID for course list
     * @param {string} courseTitleId - DOM element ID for course title
     * @param {function} displayContentFunction - Function to display page-specific content
     */
    constructor(isTeacher, courseListId = 'course-list', courseTitleId = 'course-title', displayContentFunction = null) {
        this.isTeacher = isTeacher;
        this.courseListId = courseListId;
        this.courseTitleId = courseTitleId;
        this.displayContentFunction = displayContentFunction;
    }

    /**
     * Initialize the page - handles the common lifecycle
     * @param {function} displayContentFunction - Optional override for displayContent
     */
    async init(displayContentFunction = null) {
        // Validate course access
        const validation = await validateCourseAccess(this.isTeacher, !this.isTeacher);
        if (!validation) return;

        const { courseId, course } = validation;
        const user = AuthService.getCurrentUser();
        
        // Get the appropriate courses for the user type
        const courses = this.isTeacher 
            ? await CourseService.getTeacherCourses()
            : await CourseService.getStudentCourses();

        // Set course title in sidebar
        setCourseTitle(this.courseTitleId, course);

        // Populate course list in sidebar
        populateCourseList(this.courseListId, courses, courseId, this.isTeacher);

        // Setup course navigation
        setupCourseNavigation(courseId, this.isTeacher);

        // Display page-specific content
        const contentFunction = displayContentFunction || this.displayContentFunction;
        if (contentFunction) {
            await contentFunction(courseId, course, user, courses);
        }

        return { courseId, course, user, courses };
    }

    /**
     * Setup new course button (common for teacher pages)
     * @param {string} buttonId - DOM element ID for new course button
     */
    setupNewCourseButton(buttonId = 'new-course-btn') {
        const newCourseBtn = document.getElementById(buttonId);
        if (newCourseBtn) {
            newCourseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const courseName = prompt('Enter course name:');
                if (courseName) {
                    CourseService.createCourse({ name: courseName.trim() })
                        .then(() => {
                            alert('Course created successfully!');
                            window.location.reload();
                        })
                        .catch(error => {
                            alert(error.message);
                        });
                }
            });
        }
    }
}

/**
 * Factory function to create a course page handler
 * @param {boolean} isTeacher - Whether this is a teacher page
 * @param {object} options - Configuration options
 * @param {function} displayContent - Function to display page-specific content
 * @returns {CoursePageBase} Instance of CoursePageBase
 */
export function createCoursePageHandler(isTeacher, options = {}, displayContent = null) {
    const {
        courseListId = 'course-list',
        courseTitleId = 'course-title'
    } = options;

    return new CoursePageBase(isTeacher, courseListId, courseTitleId, displayContent);
}

/**
 * Simple course page initializer for pages that don't need custom display logic
 * @param {boolean} isTeacher - Whether this is a teacher page
 * @param {function} customLogic - Optional custom logic to run after common setup
 */
export async function initCoursePage(isTeacher, customLogic = null) {
    const handler = new CoursePageBase(isTeacher);
    
    // If no custom display logic, just run the common initialization
    const result = await handler.init();
    
    if (customLogic && result) {
        await customLogic(result.courseId, result.course, result.user, result.courses);
    }
    
    return result;
}