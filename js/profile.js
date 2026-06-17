// profile.js - Profile page handler
import { AuthService } from './services.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        // Not authenticated, redirect to login
        window.location.href = 'login.html';
        return;
    }

    // Setup titlebar navigation
    setupTitlebarNavigation();
});

function setupTitlebarNavigation() {
    // Setup profile icon click handler (already on profile page, so just highlight it)
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.style.cursor = 'pointer';
        userIcon.addEventListener('click', () => {
            // Already on profile page, do nothing
        });
    }
}
