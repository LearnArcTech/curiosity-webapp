// onboarding.js - Consolidated onboarding flow
import { AuthService, CourseService, DataService } from './services.js';
import { ROUTES } from './config.js';

// Generate a UUID for username if skipped
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Current step in the onboarding flow
let currentStep = null;
let selectedRole = null;

// ============================================================================
// INITIALIZATION & STEP MANAGEMENT
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    const user = AuthService.getCurrentUser();

    // Determine which step to show
    if (!user.role) {
        // No role set - show role selection
        showStep('role');
    } else if (!user.name) {
        // Role set but no name - show name input
        showStep('name');
    } else if (user.role === 'teacher') {
        // Both role and name set for teacher - show course creation
        showStep('course');
    } else {
        // Fully onboarded - redirect to dashboard
        window.location.href = ROUTES.DASHBOARD_STUDENT;
    }
});

/**
 * Show a specific onboarding step
 */
function showStep(step) {
    // Hide all sections
    document.getElementById('role-section').style.display = 'none';
    document.getElementById('name-section').style.display = 'none';
    document.getElementById('course-section').style.display = 'none';

    currentStep = step;

    // Show the requested section
    switch (step) {
        case 'role':
            document.getElementById('role-section').style.display = 'block';
            setupRoleSelection();
            break;
        case 'name':
            document.getElementById('name-section').style.display = 'block';
            setupNameInput();
            break;
        case 'course':
            document.getElementById('course-section').style.display = 'block';
            setupCourseInput();
            break;
    }
}

// ============================================================================
// ROLE SELECTION STEP
// ============================================================================

function setupRoleSelection() {
    const studentBtn = document.querySelector('button[data-role="student"]');
    const teacherBtn = document.querySelector('button[data-role="teacher"]');
    const continueBtn = document.getElementById('role-continue-btn');

    if (studentBtn) {
        studentBtn.addEventListener('click', () => {
            selectRole('student', studentBtn, teacherBtn);
        });
    }

    if (teacherBtn) {
        teacherBtn.addEventListener('click', () => {
            selectRole('teacher', teacherBtn, studentBtn);
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!selectedRole) return;

            try {
                const user = AuthService.getCurrentUser();
                if (user) {
                    // Update user role in localStorage
                    user.role = selectedRole;
                    localStorage.setItem('currentUser', JSON.stringify(user));

                    // Update in database via API
                    await DataService.updateUser(user.id, { role: selectedRole });

                    // Move to name step
                    showStep('name');
                } else {
                    alert('Error: User not found');
                }
            } catch (error) {
                console.error('Error during role selection:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
}

function selectRole(role, selectedBtn, otherBtn) {
    selectedRole = role;

    // Visual feedback
    selectedBtn.style.borderColor = 'var(--primary-color)';
    selectedBtn.style.borderWidth = '3px';
    otherBtn.style.borderColor = 'var(--border-color)';
    otherBtn.style.borderWidth = '2px';

    // Enable continue button
    const continueBtn = document.getElementById('role-continue-btn');
    if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.style.opacity = '1';
        continueBtn.style.cursor = 'pointer';
    }
}

// ============================================================================
// NAME INPUT STEP
// ============================================================================

function setupNameInput() {
    const nameForm = document.getElementById('name-form');
    const skipBtn = document.getElementById('skip-name-btn');

    if (nameForm) {
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name-input').value.trim();
            await saveName(name);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            // Generate UUID for name when skipped
            const uuid = generateUUID();
            await saveName(uuid);
        });
    }
}

async function saveName(name) {
    try {
        const user = AuthService.getCurrentUser();
        if (user) {
            // Update user name in localStorage
            user.name = name;
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Update in database via API
            await DataService.updateUser(user.id, { name: name });

            // Determine next step
            if (user.role === 'teacher') {
                showStep('course');
            } else {
                // Student is fully onboarded
                window.location.href = ROUTES.DASHBOARD_STUDENT;
            }
        } else {
            alert('Error: User not found');
        }
    } catch (error) {
        console.error('Error saving name:', error);
        alert('An error occurred. Please try again.');
    }
}

// ============================================================================
// COURSE CREATION STEP (Teachers Only)
// ============================================================================

function setupCourseInput() {
    const courseForm = document.getElementById('course-form');
    const skipBtn = document.getElementById('skip-course-btn');

    if (courseForm) {
        courseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const courseName = document.getElementById('course-name').value.trim();

            if (courseName) {
                try {
                    await CourseService.createCourse({ name: courseName });
                    alert('Course created successfully!');
                    window.location.href = ROUTES.DASHBOARD_TEACHER;
                } catch (error) {
                    console.error('Error creating course:', error);
                    alert(error.message || 'Failed to create course. Please try again.');
                }
            } else {
                alert('Please enter a course name');
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            window.location.href = ROUTES.DASHBOARD_TEACHER;
        });
    }
}
