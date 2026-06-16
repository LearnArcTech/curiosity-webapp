// session.js - Handle live session functionality
import { AuthService, SessionService, DataService } from './services.js';
import { ROUTES, ERROR_MESSAGES } from './config.js';

let currentSession = null;
let currentUser = null;
let isTeacher = false;
let sessionInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Get session ID and course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const courseId = urlParams.get('courseId');
    const isPresenting = urlParams.get('isPresenting') === 'true';

    // Check if we have the required parameters
    if (!sessionId) {
        // No session ID provided, redirect to invalid session page
        window.location.href = `invalid-session.html?message=${encodeURIComponent('No se ha proporcionado un ID de sesión válido')}`;
        return;
    }

    // Check authentication
    currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        // Not authenticated, redirect to login
        window.location.href = '../login.html';
        return;
    }

    isTeacher = AuthService.isTeacher();

    try {
        // Get session information
        currentSession = await SessionService.getSession(sessionId);

        if (!currentSession) {
            // Session not found
            window.location.href = `invalid-session.html?message=${encodeURIComponent('La sesión no existe o ha expirado')}`;
            return;
        }

        // Validate session access
        const validation = await SessionService.validateSessionAccess(sessionId, currentUser.id);
        if (!validation.valid) {
            window.location.href = `invalid-session.html?message=${encodeURIComponent(validation.error || 'Acceso denegado')}`;
            return;
        }

        // Update session info in UI
        await updateSessionUI();

        // Join the session if not already joined
        if (!currentSession.participants || !currentSession.participants.includes(currentUser.id)) {
            await SessionService.joinSession(sessionId, currentUser.id);
        }

        // Setup controls
        setupSessionControls();

        // Start periodic checks for session status
        startSessionMonitoring();

    } catch (error) {
        console.error('Error loading session:', error);
        window.location.href = `invalid-session.html?message=${encodeURIComponent('Error al cargar la sesión')}`;
    }
});

async function updateSessionUI() {
    if (!currentSession) return;

    // Update session title and info
    const sessionTitle = document.getElementById('session-title');
    const sessionInfo = document.getElementById('session-info');
    const sessionTime = document.getElementById('session-time');

    if (sessionTitle) {
        sessionTitle.textContent = currentSession.name || 'Sesión sin nombre';
    }

    if (sessionInfo || sessionTime) {
        try {
            const course = await DataService.getCourseById(currentSession.course_id);
            const courseName = course?.name || 'Curso';
            const courseCode = course?.code || '';

            if (sessionInfo) {
                sessionInfo.textContent = `${courseName}${courseCode ? ` (${courseCode})` : ''}`;
            }

            if (sessionTime) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const dateString = now.toLocaleDateString('es-ES');
                sessionTime.textContent = `${timeString} | ${dateString}`;
            }
        } catch (error) {
            console.error('Error getting course info:', error);
            if (sessionInfo) {
                sessionInfo.textContent = 'Información no disponible';
            }
            if (sessionTime) {
                sessionTime.textContent = new Date().toLocaleTimeString('es-ES');
            }
        }
    }

    // Update video container with participants
    await updateVideoContainer();

    // New logic: Visible to everyone, with context-aware tooltips
    const endCallBtn = document.getElementById('end-call-btn');
    if (endCallBtn) {
        const isTeacherOfSession = isTeacher || currentSession.teacher_id === currentUser.id;

        // Set descriptive text on hover so users know what it does
        endCallBtn.title = isTeacherOfSession ? 'Terminar sesión para todos' : 'Salir de la sesión';

        // Always show it so students can hang up too!
        endCallBtn.style.display = 'block';
    }
}

async function updateVideoContainer() {
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) return;

    try {
        const participants = await SessionService.getSessionParticipants(currentSession.id);

        // Clear existing content
        videoContainer.innerHTML = '';

        // Add participant video streams
        for (const participant of participants) {
            const videoStream = document.createElement('div');
            videoStream.className = 'video-stream';

            const isCurrentUser = participant.id === currentUser.id;
            const userLabel = participant.name || participant.email || 'Usuario';

            videoStream.innerHTML = `
                <img src="../placeholder.img" alt="${userLabel}">
                <div class="user-label">${userLabel}${isCurrentUser ? ' (Tú)' : ''}</div>
            `;

            // If it's the current user and they are presenting, show content overlay
            const urlParams = new URLSearchParams(window.location.search);
            const isPresenting = urlParams.get('isPresenting') === 'true';

            if (isCurrentUser && isPresenting) {
                const contentOverlay = document.createElement('div');
                contentOverlay.className = 'content-overlay';
                contentOverlay.innerHTML = `
                    <h2>${currentSession.name || 'Sesión'}</h2>
                    <div class="content-grid">
                        <div class="content-card">
                            <h3>Contenido de la sesión</h3>
                            <p>Este es el contenido que estás presentando a los estudiantes.</p>
                        </div>
                        <div class="content-card">
                            <h3>Información adicional</h3>
                            <p>Puedes compartir materiales, explicaciones y recursos aquí.</p>
                        </div>
                    </div>
                `;
                videoStream.appendChild(contentOverlay);
            }

            videoContainer.appendChild(videoStream);
        }

    } catch (error) {
        console.error('Error updating video container:', error);
        videoContainer.innerHTML = '<p>Error al cargar los participantes</p>';
    }
}

function setupSessionControls() {
    // Setup control buttons
    const muteBtn = document.getElementById('mute-btn');
    const cameraBtn = document.getElementById('camera-btn');
    const handBtn = document.getElementById('hand-btn');
    const statsBtn = document.getElementById('stats-btn');
    const moreBtn = document.getElementById('more-btn');
    const endCallBtn = document.getElementById('end-call-btn');

    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', toggleCamera);
    }

    if (handBtn) {
        handBtn.addEventListener('click', raiseHand);
    }

    if (statsBtn) {
        statsBtn.addEventListener('click', showStats);
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', showMoreOptions);
    }

    if (endCallBtn) {
        endCallBtn.addEventListener('click', endSession);
    }
}

function toggleMute() {
    // Toggle mute functionality
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        const isMuted = muteBtn.textContent === '🔇';
        muteBtn.textContent = isMuted ? '🎤' : '🔇';
        // Here you would actually toggle the microphone stream
        console.log('Microphone:', isMuted ? 'Unmuted' : 'Muted');
    }
}

function toggleCamera() {
    // Toggle camera functionality
    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) {
        const isOff = cameraBtn.textContent === '📷';
        cameraBtn.textContent = isOff ? '📹' : '📷';
        // Here you would actually toggle the camera stream
        console.log('Camera:', isOff ? 'On' : 'Off');
    }
}

function raiseHand() {
    // Raise hand functionality
    console.log('Hand raised');
    // Here you would send a notification to the teacher
}

function showStats() {
    // Show session statistics
    console.log('Showing stats');
    // Here you would show participation stats, etc.
}

function showMoreOptions() {
    // Show more options menu
    console.log('Showing more options');
    // Here you would show additional options
}

async function endSession() {
    if (!currentSession) return;

    const isTeacherOfSession = isTeacher || currentSession.teacher_id === currentUser.id;

    // Tailor the confirmation prompt to the user's role
    const confirmMessage = isTeacherOfSession
        ? '¿Estás seguro de que quieres terminar la sesión para todos?'
        : '¿Estás seguro de que quieres salir de la sesión?';

    if (confirm(confirmMessage)) {
        try {
            if (isTeacherOfSession) {
                // Teachers destroy the session globally for everyone
                await SessionService.endSession(currentSession.id);
            }

            // Both teachers and students run local cleanup to leave the participant array
            await cleanupSession();

            // Redirect back to their respective landing dashboards
            window.location.href = isTeacherOfSession
                ? 'dashboard-teacher.html'
                : 'dashboard-student.html';

        } catch (error) {
            console.error('Error exiting session:', error);
            alert('Error al salir de la sesión: ' + error.message);
        }
    }
}

function startSessionMonitoring() {
    // Check session status every 3 seconds (3000ms) instead of 30 seconds
    sessionInterval = setInterval(async () => {
        try {
            const session = await SessionService.getSession(currentSession.id);

            if (!session) {
                cleanupSession();
                window.location.href = `invalid-session.html?message=${encodeURIComponent('La sesión ha terminado')}`;
                return;
            }

            if (session.status !== 'active') {
                cleanupSession();
                window.location.href = `invalid-session.html?message=${encodeURIComponent('La sesión ha terminado')}`;
                return;
            }

            // PERFORMANCE OPTIMIZATION:
            // Compare the previous participant IDs with the incoming ones.
            // Only rewrite the DOM if someone actually joined or left.
            const oldParticipants = JSON.stringify(currentSession.participants || []);
            const newParticipants = JSON.stringify(session.participants || []);

            if (oldParticipants !== newParticipants || currentSession.status !== session.status) {
                currentSession = session;
                await updateSessionUI();
            }

        } catch (error) {
            console.error('Error checking session status:', error);
        }
    }, 3000); // 3000ms = 3 seconds
}

async function cleanupSession() {
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
    }
    if (currentSession && currentUser) {
        try {
            await SessionService.leaveSession(currentSession.id, currentUser.id);
        } catch (error) {
            console.error('Error leaving session:', error);
        }
    }
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => cleanupSession());
