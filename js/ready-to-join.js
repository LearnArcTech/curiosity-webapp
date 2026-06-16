// ready-to-join.js - Handle session validation and joining for students
import { AuthService, SessionService, CourseService, DataService } from './services.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Get session ID and course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const courseId = urlParams.get('courseId');

    // Check if we have the required parameters
    if (!sessionId) {
        // No session ID provided, redirect to invalid session page
        window.location.href = `invalid-session.html?message=${encodeURIComponent('No se ha proporcionado un ID de sesión válido')}`;
        return;
    }

    // Check authentication
    const user = AuthService.getCurrentUser();
    if (!user) {
        // Not authenticated, redirect to login
        window.location.href = '../login.html';
        return;
    }

    // Display user information
    const usernameElement = document.getElementById('username-display');
    if (usernameElement) {
        usernameElement.textContent = user.name || user.email || 'Usuario';
    }

    try {
        // Get session information
        const session = await SessionService.getSession(sessionId);
        
        if (!session) {
            // Session not found
            window.location.href = `invalid-session.html?message=${encodeURIComponent('La sesión no existe o ha expirado')}`;
            return;
        }

        // Update class info
        const classInfoElement = document.getElementById('class-info');
        if (classInfoElement) {
            const course = await DataService.getCourseById(session.course_id);
            if (course) {
                classInfoElement.textContent = `🏫 Clase: ${course.name || 'Curso'} - ${course.code || ''}`;
            } else {
                classInfoElement.textContent = `🏫 Sesión: ${session.name || 'Sesión sin nombre'}`;
            }
        }

        // Check if session requires password and user is not the teacher
        if (session.requires_password && session.teacher_id !== user.id) {
            const passwordSection = document.getElementById('password-section');
            if (passwordSection) {
                passwordSection.style.display = 'block';
            }
        }

        // Setup join button
        const joinButton = document.getElementById('join-now-btn');
        if (joinButton) {
            joinButton.addEventListener('click', async () => {
                await joinSession(sessionId, user);
            });
        }

        // Setup present button
        const presentButton = document.getElementById('present-btn');
        if (presentButton) {
            presentButton.addEventListener('click', async () => {
                await joinSession(sessionId, user, true); // isPresenting = true
            });
        }

    } catch (error) {
        console.error('Error loading session information:', error);
        window.location.href = `invalid-session.html?message=${encodeURIComponent('Error al cargar la información de la sesión')}`;
    }
});

async function joinSession(sessionId, user, isPresenting = false) {
    const passwordInput = document.getElementById('session-password');
    const password = passwordInput ? passwordInput.value : null;

    try {
        // Validate session access
        const validation = await SessionService.validateSessionAccess(sessionId, user.id);
        
        if (!validation.valid) {
            // Session access denied
            window.location.href = `invalid-session.html?message=${encodeURIComponent(validation.error || 'Acceso denegado')}`;
            return;
        }

        const { session, requiresPassword, isTeacher } = validation;

        // If session requires password and user is not teacher, verify password
        if (requiresPassword && !isTeacher) {
            if (!password) {
                alert('Por favor ingresa la contraseña de la sesión');
                return;
            }

            try {
                const passwordValid = await SessionService.verifySessionPassword(sessionId, password);
                if (!passwordValid) {
                    alert('Contraseña incorrecta');
                    return;
                }
            } catch (error) {
                alert('Contraseña incorrecta');
                return;
            }
        }

        // Join the session
        await SessionService.joinSession(sessionId, user.id);
        
        // Redirect to session page
        const sessionUrl = `session.html?sessionId=${sessionId}&courseId=${session.course_id}&isPresenting=${isPresenting}`;
        window.location.href = sessionUrl;
        
    } catch (error) {
        console.error('Error joining session:', error);
        alert('Error al unirse a la sesión: ' + error.message);
    }
}
