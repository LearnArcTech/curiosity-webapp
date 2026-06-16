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

                    if (!user.role) {
                        window.location.href = ROUTES.ONBOARDING_ROLE;
                    } else if (user.role === 'teacher') {
                        window.location.href = ROUTES.DASHBOARD_TEACHER;
                    } else {
                        window.location.href = ROUTES.DASHBOARD_STUDENT;
                    }
                } else {
                    alert('Correo o contraseña inválidos');
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
                    name: 'Visitante',
                    isGuest: true
                };
                localStorage.setItem('currentUser', JSON.stringify(guestUser));
                window.location.href = ROUTES.DASHBOARD_STUDENT;
            } catch (error) {
                alert('No se pudo crear la sesión de visitante');
            }
        });
    }

    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('email').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
});
