// onboarding-role.js
import { AuthService } from './authService.js';
import { DataService } from './dataService.js';
import { ROUTES } from './config.js';

// Check if user is authenticated, otherwise redirect to login
if (!AuthService.isAuthenticated()) {
    window.location.href = ROUTES.LOGIN;
}

document.addEventListener('DOMContentLoaded', () => {
    const studentBtn = document.querySelector('button[data-role="student"]');
    const teacherBtn = document.querySelector('button[data-role="teacher"]');
    const continueBtn = document.getElementById('continue-btn');

    let selectedRole = null;

    if (studentBtn && teacherBtn) {
        studentBtn.addEventListener('click', () => {
            selectedRole = 'student';
            // Visual feedback
            studentBtn.style.borderColor = '#007bff';
            studentBtn.style.borderWidth = '3px';
            teacherBtn.style.borderColor = '#ccc';
            teacherBtn.style.borderWidth = '2px';
            updateButtonState();
        });

        teacherBtn.addEventListener('click', () => {
            selectedRole = 'teacher';
            // Visual feedback
            teacherBtn.style.borderColor = '#007bff';
            teacherBtn.style.borderWidth = '3px';
            studentBtn.style.borderColor = '#ccc';
            studentBtn.style.borderWidth = '2px';
            updateButtonState();
        });
    }

    function updateButtonState() {
        if (continueBtn) {
            continueBtn.disabled = !selectedRole;
            // Visual feedback for continue button
            if (selectedRole) {
                continueBtn.style.opacity = '1';
                continueBtn.style.cursor = 'pointer';
            } else {
                continueBtn.style.opacity = '0.5';
                continueBtn.style.cursor = 'not-allowed';
            }
        }
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!selectedRole) return;

            try {
                const user = AuthService.getCurrentUser();
                if (user) {
                    // Update user role in sessionStorage
                    user.role = selectedRole;
                    sessionStorage.setItem('currentUser', JSON.stringify(user));

                    // Update in database via API
                    await DataService.updateUser(user.id, { role: selectedRole });

                    // Redirect to name collection for both roles
                    window.location.href = ROUTES.ONBOARDING_NAME;
                } else {
                    // If no user is logged in, redirect to login
                    window.location.href = `${ROUTES.LOGIN}?role=${encodeURIComponent(selectedRole)}`;
                }
            } catch (error) {
                console.error('Error during role selection:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
