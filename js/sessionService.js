// sessionService.js - Service for managing live sessions
import { DataService } from './dataService.js';
import { AuthService } from './authService.js';
import { ERROR_MESSAGES } from './config.js';

const SessionService = {
    // Create a new session for a course
    async createSession(sessionData) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'teacher') {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        // Generate a unique session ID for local storage fallback
        const sessionId = this.generateSessionId();

        const session = {
            id: sessionId,
            course_id: sessionData.courseId,
            teacher_id: user.id,
            name: sessionData.name,
            requires_password: sessionData.requiresPassword || false,
            password: sessionData.password || null,
            waiting_room: sessionData.waitingRoom || false,
            status: 'active',
            participants: [user.id], // Teacher is automatically added
            created_at: new Date().toISOString(),
            started_at: new Date().toISOString()
        };

        try {
            // Try to create session via backend API
            const backendSession = await DataService.createSession({
                course_id: sessionData.courseId,
                name: sessionData.name,
                requires_password: sessionData.requiresPassword || false,
                password: sessionData.password || null,
                waiting_room: sessionData.waitingRoom || false
            });

            if (backendSession && backendSession.id) {
                // Use the backend session ID
                session.id = backendSession.id;
                session.created_at = backendSession.created_at;
                session.started_at = backendSession.created_at;

                // Store in local storage as backup
                this.storeSession(session);

                return { session, sessionId: backendSession.id };
            }
        } catch (error) {
            // Backend not available, fall back to local storage
            console.log('Backend not available for session creation, using local storage:', error.message);
        }

        // Fallback: Store session in local storage
        this.storeSession(session);

        return { session, sessionId };
    },

    // Generate a unique session ID
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substring(2, 12).toUpperCase();
    },

    // Store session in local storage
    storeSession(session) {
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            // Remove any existing session with the same ID
            const existingIndex = sessions.findIndex(s => s.id === session.id);
            if (existingIndex > -1) {
                sessions[existingIndex] = session;
            } else {
                sessions.push(session);
            }
            localStorage.setItem('sessions', JSON.stringify(sessions));
        }
    },

    // Get session by ID - tries backend first, then local storage
    async getSession(sessionId) {
        if (!sessionId) return null;

        try {
            // Try backend first
            const session = await DataService.getSession(sessionId);
            if (session) {
                // Store in local storage for caching
                this.storeSession(session);
                return session;
            }
        } catch (error) {
            console.log('Backend not available for getting session, trying local storage:', error.message);
        }

        // Fallback to local storage
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                return session;
            }
        }

        return null;
    },

    // Get all active sessions for a course
    async getActiveSessions(courseId) {
        if (!courseId) return [];

        try {
            // Try backend first
            const sessions = await DataService.getSessionsByCourse(courseId);
            if (sessions && sessions.length > 0) {
                return sessions.filter(s => s.status === 'active');
            }
        } catch (error) {
            console.log('Backend not available for getting active sessions, trying local storage:', error.message);
        }

        // Fallback to local storage
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            return sessions.filter(s =>
                s.course_id === courseId &&
                s.status === 'active'
            );
        }

        return [];
    },

    // Get sessions for a specific course
    async getSessionsByCourse(courseId) {
        if (!courseId) return [];

        try {
            // Try backend first
            return await DataService.getSessionsByCourse(courseId);
        } catch (error) {
            console.log('Backend not available for getting course sessions, trying local storage:', error.message);
        }

        // Fallback to local storage
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            return sessions.filter(s => s.course_id === courseId);
        }

        return [];
    },

    // Join a session
    async joinSession(sessionId, userId) {
        const session = await this.getSession(sessionId);

        if (!session) {
            throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND);
        }

        if (session.status !== 'active') {
            throw new Error(ERROR_MESSAGES.SESSION_NOT_ACTIVE);
        }

        // Check if user is already in the session
        if (session.participants && session.participants.includes(userId)) {
            return session;
        }

        try {
            // Try backend first
            const backendSession = await DataService.joinSession(sessionId, userId);
            if (backendSession) {
                // Update local storage
                backendSession.participants = backendSession.participants || [];
                if (!backendSession.participants.includes(userId)) {
                    backendSession.participants.push(userId);
                }
                this.storeSession(backendSession);
                return backendSession;
            }
        } catch (error) {
            console.log('Backend not available for joining session, using local storage:', error.message);
        }

        // Fallback: Add user to participants in local storage
        session.participants.push(userId);
        this.storeSession(session);

        return session;
    },

    // Leave a session
    async leaveSession(sessionId, userId) {
        const session = await this.getSession(sessionId);

        if (!session) {
            return;
        }

        try {
            // Try backend first
            const backendSession = await DataService.leaveSession(sessionId, userId);
            if (backendSession) {
                // Update local storage
                this.storeSession(backendSession);

                // If no participants left, end the session
                if (backendSession.participants && backendSession.participants.length === 0) {
                    backendSession.status = 'ended';
                    backendSession.ended_at = new Date().toISOString();
                    this.storeSession(backendSession);
                }

                return backendSession;
            }
        } catch (error) {
            console.log('Backend not available for leaving session, using local storage:', error.message);
        }

        // Fallback: Remove user from participants in local storage
        session.participants = session.participants.filter(p => p !== userId);

        // If no participants left, end the session
        if (session.participants.length === 0) {
            session.status = 'ended';
            session.ended_at = new Date().toISOString();
        }

        this.storeSession(session);

        return session;
    },

    // End a session (teacher only) - calling leave as teacher ends it for everyone
    async endSession(sessionId) {
        const session = await this.getSession(sessionId);

        if (!session) {
            throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND);
        }

        const user = AuthService.getCurrentUser();
        if (!user || (user.role !== 'teacher' && session.teacher_id !== user.id)) {
            throw new Error(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        try {
            // Leaving as teacher ends the session for everyone on the backend
            await DataService.leaveSession(sessionId, user.id);
        } catch (error) {
            console.log('Backend not available for ending session, using local storage:', error.message);
        }

        // Always update local storage too
        session.status = 'ended';
        session.ended_at = new Date().toISOString();
        session.participants = [];
        this.storeSession(session);

        return session;
    },

    // Validate session access for a student
    async validateSessionAccess(sessionId, userId) {
        const session = await this.getSession(sessionId);

        if (!session) {
            return { valid: false, error: ERROR_MESSAGES.SESSION_NOT_FOUND };
        }

        if (session.status !== 'active') {
            return { valid: false, error: ERROR_MESSAGES.SESSION_NOT_ACTIVE };
        }

        // Check if user is the teacher (always allowed)
        if (session.teacher_id === userId) {
            return { valid: true, session, isTeacher: true };
        }

        // Check if student is enrolled in the course
        try {
            const course = await DataService.getCourseById(session.course_id);
            if (!course) {
                return { valid: false, error: ERROR_MESSAGES.COURSE_NOT_FOUND };
            }

            const enrollments = await DataService.getEnrollmentsByStudent(userId); // use param, not re-fetch
            const isEnrolled = enrollments.some(e => e.course_id === course.id);

            if (!isEnrolled) {
                return { valid: false, error: ERROR_MESSAGES.NOT_ENROLLED_IN_COURSE };
            }

            // Check password if required
            if (session.requires_password) {
                return {
                    valid: true,
                    session,
                    requiresPassword: true,
                    isTeacher: false
                };
            }

            return {
                valid: true,
                session,
                requiresPassword: false,
                isTeacher: false
            };
        } catch (error) {
            console.log('Error validating enrollment, using local storage fallback:', error.message);
            // Fallback: Assume enrolled for local storage sessions
            if (session.requires_password) {
                return {
                    valid: true,
                    session,
                    requiresPassword: true,
                    isTeacher: false
                };
            }
            return {
                valid: true,
                session,
                requiresPassword: false,
                isTeacher: false
            };
        }
    },

    // Verify session password
    async verifySessionPassword(sessionId, password) {
        const session = await this.getSession(sessionId);

        if (!session) {
            throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND);
        }

        if (session.password !== password) {
            throw new Error(ERROR_MESSAGES.INVALID_PASSWORD);
        }

        return true;
    },

    // Get session participants
    async getSessionParticipants(sessionId) {
        const session = await this.getSession(sessionId);

        if (!session) {
            return [];
        }

        try {
            // Try backend first
            const participants = await DataService.getSessionParticipants(sessionId);
            if (participants && participants.length > 0) {
                return participants;
            }
        } catch (error) {
            console.log('Backend not available for getting participants, using local storage:', error.message);
        }

        // Fallback: Get participants from local storage
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const session = sessions.find(s => s.id === sessionId);
            if (session && session.participants) {
                // Try to get user details for each participant
                const participants = [];
                for (const userId of session.participants) {
                    try {
                        const user = await DataService.getUserById(userId);
                        if (user) {
                            participants.push(user);
                        }
                    } catch (error) {
                        // If we can't get user from backend, create a placeholder
                        participants.push({ id: userId, name: 'User ' + userId.substring(0, 8), email: userId });
                    }
                }
                return participants;
            }
        }

        return [];
    },

    // Clean up ended sessions
    async cleanupEndedSessions() {
        if (typeof window !== 'undefined') {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const now = new Date();
            const oneHour = 60 * 60 * 1000;

            const updatedSessions = sessions.filter(session => {
                // Keep active sessions
                if (session.status === 'active') {
                    // If session was created more than 1 hour ago and has no participants, end it
                    const createdDate = new Date(session.created_at);
                    if (session.participants.length === 0 && (now - createdDate) > oneHour) {
                        session.status = 'ended';
                        session.ended_at = now.toISOString();
                    }
                    return true;
                }
                // Keep recent ended sessions (for 24 hours)
                if (session.status === 'ended') {
                    const endedDate = new Date(session.ended_at);
                    const oneDay = 24 * 60 * 60 * 1000;
                    return (now - endedDate) < oneDay;
                }
                return true;
            });

            localStorage.setItem('sessions', JSON.stringify(updatedSessions));
        }
    }
};

export { SessionService };