// services.js
export { DataService, ApiError } from './dataService.js';
export { AuthService } from './authService.js';
export { CourseService } from './courseService.js';
export { SessionService } from './sessionService.js';
export * from './mockData.js';

// Import your custom apiRequest function
import { apiRequest } from './dataService.js';

export class ReportService {
    static async getReports(courseId) {
        // apiRequest handles headers, tokens, and error throwing automatically
        const response = await apiRequest('GET', `/courses/${courseId}/reports`);

        // Return the flat response (or response.reports if your backend wraps it in an object)
        return response.reports || response;
    }

    static async createReport(courseId, reportData) {
        // Just pass the method, endpoint, and payload object
        const response = await apiRequest('POST', `/courses/${courseId}/reports`, reportData);

        return response;
    }
}