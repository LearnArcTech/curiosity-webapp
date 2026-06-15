// register.js
import { AuthService } from './authService.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
                return;
            }

            try {
                // For now, we'll set role as null
                // The onboarding will handle role selection
                const user = {
                    email,
                    password,
                    role: null
                };

                await AuthService.register(user);
                alert('Registration successful! Please login.');
                window.location.href = ROUTES.LOGIN;
            } catch (error) {
                alert(error.message);
            }
        });
    }
});