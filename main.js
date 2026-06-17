// main.js - Global application initialization
// This file serves as the main entry point for the application
// Each page initializes its own services via services.js

// Export services for use in HTML pages
import './js/services.js';
import './js/config.js';

// Initialize global error handling
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // In production, you might want to send this to an error tracking service
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', event.reason);
    });
}

console.log('Curiosity WebApp initialized');
