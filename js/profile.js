import { AuthService, ApiClient } from './services.js';
import { ROUTES } from './config.js';

const menú = [
    ['password', 'Cambiar contraseña'],
    ['sessions', 'Sesiones activas'],
    ['edit', 'Editar perfil'],
    ['security', 'Seguridad']
];

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

function currentView() {
    return new URLSearchParams(location.search).get('view') || 'edit';
}

function shouldShowError() {
    return new URLSearchParams(location.search).get('error') === 'true';
}

function initials(name) {
    const parts = String(name || 'Emma Lucia').trim().split(/\s+/);
    return (parts[0]?.[0] || 'E') + (parts[1]?.[0] || 'L');
}

function errorBanner(code = '1005') {
    return `
        <aside class="profile-alert" role="alert">
            <strong>Uh Oh!</strong>
            <span>Hubo un error guardando tus cambios, pero no te preocupes, lo resolveremos pronto (${code})</span>
        </aside>
    `;
}

function renderMenu(view) {
    document.getElementById('profile-menu').innerHTML = menú.map(([key, label]) => `
        <a href="profile.html?view=${key}" class="${view === key ? 'active' : ''}">${label}</a>
    `).join('');
}

function renderPassword() {
    return `
        ${shouldShowError() ? errorBanner('1002') : ''}
        <h2>Cambiar contraseña</h2>
        <section class="profile-form-panel">
            <input class="profile-input" type="password" placeholder="Nueva contraseña" aria-label="Nueva contraseña">
            <input class="profile-input" type="password" placeholder="Confirmar nueva contraseña" aria-label="Confirmar nueva contraseña">
            <div class="profile-inline-actions">
                <button class="app-button" data-message="Contraseña actualizada localmente.">Confirmar</button>
                <span class="muted">Último cambio: 02/13/2026 17:43:20</span>
                <a class="ghost-button" href="profile.html?view=password&error=true">Ver estado error</a>
            </div>
        </section>
    `;
}

function renderSessions(sessions = null) {
    const rows = sessions?.length
        ? sessions.map(session => [session.device, session.status, session.last_seen || session.lastSeen])
        : [
        ['Laptop Windows', 'Activa', '2026-06-17 10:45'],
        ['Android Chrome', 'Reciente', '2026-06-16 18:22'],
        ['Tablet compartida', 'Cerrada', '2026-06-12 08:30'],
        ['Firefox Desktop', 'Cerrada', '2026-06-05 16:10']
    ];
    return `
        <div class="workspace-toolbar profile-toolbar">
            <h2>Sesiones activas</h2>
            <button class="danger-button" data-message="Todas las sesiones externas fueron cerradas.">Cerrar todas las sesiones</button>
        </div>
        <section class="profile-table-shell">
            <div class="profile-search-row">
                <input class="profile-input" id="session-search" placeholder="Buscar" aria-label="Buscar sesiones">
                <button class="ghost-button" aria-label="Filtrar sesiones">Filtrar</button>
            </div>
            <table class="app-table">
                <thead><tr><th>Tipo de dispositivo</th><th>Estado</th><th>Último acceso</th></tr></thead>
                <tbody id="session-table-body">
                    ${rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('')}
                </tbody>
            </table>
        </section>
    `;
}

function renderEdit(user) {
    const name = user.name || 'Emma Lucia';
    const email = user.email || 'emm.lu@gmail.com';
    return `
        ${shouldShowError() ? errorBanner('1005') : ''}
        <h2>Editar perfil</h2>
        <section class="profile-form-panel edit-profile-panel">
            <label>Nombre de usuario</label>
            <input class="profile-input wide" id="profile-edit-name" value="${escapeHtml(name)}">
            <label>E-Mail</label>
            <input class="profile-input wide" id="profile-edit-email" value="${escapeHtml(email)}">
            <label>Foto de perfil</label>
            <div class="profile-photo-row">
                <div class="profile-avatar generated-avatar large">${escapeHtml(initials(name))}</div>
                <button class="app-button teal" data-message="Foto de perfil actualizada en modo demo.">Subir foto</button>
            </div>
            <div class="profile-inline-actions">
                <button class="app-button" id="save-profile-btn" data-message="Perfil actualizado localmente.">Confirmar cambios</button>
                <a class="ghost-button" href="profile.html?view=edit&error=true">Ver estado error</a>
            </div>
        </section>
    `;
}

function renderSecurity() {
    return `
        ${shouldShowError() ? errorBanner('1003') : ''}
        <h2>Seguridad</h2>
        <section class="security-stack">
            <article class="security-card">
                <h3>Verificacion por correo</h3>
                <p>Recibe un correo de confirmacion para acciones sensibles.</p>
                <label class="profile-switch"><input type="checkbox"><span></span> Deshabilitado</label>
            </article>
            <article class="security-card">
                <h3>Autenticacion 2FA</h3>
                <p>Anade una capa extra de seguridad a tu cuenta.</p>
                <label class="profile-switch"><input type="checkbox"><span></span> Deshabilitado</label>
            </article>
        </section>
        <p class="muted profile-helper">Para ver las sesiones activas, da click <a href="profile.html?view=sessions">aquí</a></p>
    `;
}

function bindActions() {
    document.querySelectorAll('[data-message]').forEach(button => {
        button.addEventListener('click', () => alert(button.dataset.message));
    });

    const search = document.getElementById('session-search');
    if (search) {
        search.addEventListener('input', () => {
            const query = search.value.trim().toLowerCase();
            document.querySelectorAll('#session-table-body tr').forEach(row => {
                row.hidden = !row.textContent.toLowerCase().includes(query);
            });
        });
    }

    document.querySelectorAll('.profile-switch input').forEach(input => {
        input.addEventListener('change', () => {
            const label = input.closest('.profile-switch');
            const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            if (textNode) textNode.textContent = input.checked ? ' Habilitado' : ' Deshabilitado';
        });
    });

    document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('profile-edit-name')?.value.trim();
        const email = document.getElementById('profile-edit-email')?.value.trim();
        if (!name || !email) return;
        try {
            const response = await ApiClient.patch('/api/users/me', { name, email });
            if (response?.user) {
                localStorage.setItem('currentUser', JSON.stringify(response.user));
                document.getElementById('profile-name').textContent = response.user.name;
                document.getElementById('profile-avatar').textContent = initials(response.user.name);
            }
        } catch (error) {
            console.warn('Perfil no pudo sincronizarse con backend:', error.message);
        }
    });

    document.querySelector('.danger-button')?.addEventListener('click', async () => {
        try {
            await ApiClient.delete('/api/users/me/sessions');
        } catch (error) {
            console.warn('No se pudieron cerrar sesiones en backend:', error.message);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthService.isAuthenticated()) {
        window.location.href = ROUTES.LOGIN;
        return;
    }

    let profileData = null;
    try {
        profileData = await ApiClient.get('/api/users/me');
        if (profileData?.user) {
            localStorage.setItem('currentUser', JSON.stringify(profileData.user));
        }
    } catch (error) {
        console.warn('Perfil desde backend no disponible:', error.message);
    }

    const user = profileData?.user || AuthService.getCurrentUser();
    const view = currentView();
    const displayName = user.name || 'Emma Lucia';
    document.querySelector('[data-dashboard-link]').href = user.role === 'teacher' ? 'dashboard-teacher.html' : 'dashboard-student.html';
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-avatar').textContent = initials(displayName);
    renderMenu(view);

    const views = {
        password: renderPassword,
        sessions: () => renderSessions(profileData?.sessions),
        edit: () => renderEdit(user),
        security: renderSecurity
    };
    document.getElementById('profile-root').innerHTML = (views[view] || views.edit)();
    bindActions();
});
