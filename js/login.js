import { AuthService } from './authService.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const guestBtn = document.querySelector('.guest-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;

            try {
                const user = await AuthService.login(email, password);
                if (user) {
                    if (rememberMe) {
                        localStorage.setItem('rememberedUser', email);
                    } else {
                        localStorage.removeItem('rememberedUser');
                    }

                    // Check if user needs onboarding
                    if (!user.role) {
                        window.location.href = ROUTES.ONBOARDING_ROLE;
                    } else if (!user.name) {
                        // Has role but no name - send to name collection
                        window.location.href = ROUTES.ONBOARDING_NAME;
                    } else if (user.role === 'teacher') {
                        window.location.href = ROUTES.DASHBOARD_TEACHER;
                    } else {
                        window.location.href = ROUTES.DASHBOARD_STUDENT;
                    }
                } else {
                    alert('Invalid email or password');
                }
            } catch (error) {
                alert(error.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
            }
        });
    }

    if (guestBtn) {
        guestBtn.addEventListener('click', async () => {
            try {
                const guestUser = {
                    id: 'guest-' + Date.now(),
                    email: 'guest-' + Date.now() + '@example.com',
                    role: 'student',
                    name: 'Guest User',
                    isGuest: true
                };
                localStorage.setItem('currentUser', JSON.stringify(guestUser));
                window.location.href = ROUTES.DASHBOARD_STUDENT;
            } catch (error) {
                alert('Failed to create guest account');
            }
        });
    }

    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('email').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
});