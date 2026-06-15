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
            studentBtn.classList.add('selected');
            teacherBtn.classList.remove('selected');
            updateButtonState();
        });

        teacherBtn.addEventListener('click', () => {
            selectedRole = 'teacher';
            teacherBtn.classList.add('selected');
            studentBtn.classList.remove('selected');
            updateButtonState();
        });
    }

    function updateButtonState() {
        if (continueBtn) {
            continueBtn.disabled = !selectedRole;
            continueBtn.classList.toggle('is-active', !!selectedRole);
        }
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!selectedRole) return;

            try {
                const user = AuthService.getCurrentUser();
                if (user) {
                    // Update user role
                    user.role = selectedRole;
                    localStorage.setItem('currentUser', JSON.stringify(user));

                    // Update in database using DataService
                    const data = DataService.getData();
                    const userIndex = data.users.findIndex(u => u.id === user.id);
                    if (userIndex !== -1) {
                        data.users[userIndex].role = selectedRole;
                        await DataService.saveData(data);
                    }

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
