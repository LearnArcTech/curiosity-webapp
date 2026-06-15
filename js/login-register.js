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

                const registeredUser = await AuthService.register(user);
                const userToStore = { ...registeredUser };
                delete userToStore.passwordHash;
                localStorage.setItem('currentUser', JSON.stringify(userToStore));
                window.location.href = ROUTES.ONBOARDING_ROLE;
            } catch (error) {
                alert(error.message);
            }
        });
    }
});
