function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const brandLink = document.querySelector('.brand');
    const accountButton = document.querySelector('[data-account-button]');
    const accountDropdown = document.querySelector('[data-account-dropdown]');
    const accountName = document.querySelector('[data-account-name]');
    const accountAction = document.querySelector('[data-account-action]');

    const user = getCurrentUser();

    if (brandLink) {
        if (user?.role === 'teacher') {
            brandLink.href = 'dashboard-teacher.html';
        } else if (user?.role === 'student') {
            brandLink.href = 'dashboard-student.html';
        } else {
            brandLink.href = 'login.html';
        }
    }

    if (!accountButton || !accountDropdown) return;

    if (accountName) {
        accountName.textContent = user?.isGuest ? 'Visitante' : user?.name || user?.email || 'Visitante';
    }

    if (accountAction) {
        accountAction.textContent = user && !user.isGuest ? 'Cerrar sesión' : 'Iniciar sesión';
    }

    if (user && !user.isGuest && !accountDropdown.querySelector('[data-profile-link]')) {
        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html?view=edit';
        profileLink.className = 'account-profile-link';
        profileLink.dataset.profileLink = 'true';
        profileLink.setAttribute('role', 'menuitem');
        profileLink.textContent = 'Ver perfil';
        accountDropdown.insertBefore(profileLink, accountAction || null);
    }

    accountButton.addEventListener('click', () => {
        const isOpen = accountDropdown.hidden;
        accountDropdown.hidden = !isOpen;
        accountButton.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.account-menu')) {
            accountDropdown.hidden = true;
            accountButton.setAttribute('aria-expanded', 'false');
        }
    });

    if (accountAction) {
        accountAction.addEventListener('click', () => {
            if (user && !user.isGuest) {
                localStorage.removeItem('currentUser');
            }
            window.location.href = 'login.html';
        });
    }
});
