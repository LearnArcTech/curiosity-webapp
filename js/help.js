import { AuthService } from './services.js';

const menú = [
    ['tutorials', 'Tutoriales'],
    ['guides', 'Guias'],
    ['accessibility', 'Accesibilidad'],
    ['simple-mode', 'Modo simplificado']
];

function currentView() {
    return new URLSearchParams(location.search).get('view') || 'tutorials';
}

function renderMenu(view) {
    document.getElementById('help-menu').innerHTML = menú.map(([key, label]) => `
        <a href="help.html?view=${key}" class="${view === key ? 'active' : ''}">${label}</a>
    `).join('');
}

function tutorials() {
    return `
        <h2>Tutoriales</h2>
        <section class="content-grid">
            ${[
                ['Como entrar a una reunion', 'Aprende a revisar audio, chat y materiales antes de clase.'],
                ['Como revisar tus notas', 'Ubica historial, ranking y logros sin perderte.'],
                ['Como publicar reportes', 'Flujo docente para importar y exportar evidencias.']
            ].map(item => `
                <article class="report-card">
                    <div style="height:112px;background:linear-gradient(135deg,#CFE6FA,#9EF0D1);border:1px solid var(--curiosity-border)"></div>
                    <strong>${item[0]}</strong>
                    <span class="muted">${item[1]}</span>
                    <button class="ghost-button" data-message="Tutorial abierto en modo demo.">Ver tutorial</button>
                </article>
            `).join('')}
        </section>
    `;
}

function guides() {
    return `
        <h2>Guias</h2>
        <section class="content-grid">
            ${['Baja conectividad', 'Actividades interactivas', 'Organizacion de archivos'].map(title => `
                <article class="file-card">
                    <span class="file-icon"></span>
                    <strong>${title}</strong>
                    <span class="muted">Guía ligera disponible offline.</span>
                    <button class="ghost-button" data-message="Guía marcada como disponible offline.">Guardar offline</button>
                </article>
            `).join('')}
        </section>
    `;
}

function accessibility() {
    return `
        <h2>Accesibilidad</h2>
        <section class="panel">
            <h3>Tamano de texto</h3>
            <div class="button-row">
                <button class="chip-button" data-class="text-small">Pequeno</button>
                <button class="chip-button" data-class="text-medium">Mediano</button>
                <button class="chip-button" data-class="text-large">Grande</button>
            </div>
            <h3 style="margin-top:18px">Nivel de contraste</h3>
            <div class="button-row">
                <button class="chip-button" data-contrast="normal">Normal</button>
                <button class="chip-button" data-contrast="high">Alto</button>
                <button class="chip-button" data-contrast="reader">Lector de pantalla</button>
            </div>
            <p class="muted" style="margin-top:14px">Todos los controles principales usan etiquetas ARIA y textos claros para navegación asistida.</p>
        </section>
    `;
}

function simpleMode() {
    return `
        <h2>Modo Simplificado</h2>
        <section class="panel">
            <p>Habilitar modo simplificado cambiara la interfaz de reuniones para ser más fácil de utilizar. Esto ocultara funciones menos usadas.</p>
            <label><input type="checkbox" id="simple-mode-toggle"> Activar modo simplificado</label>
            <div class="notice" style="margin-top:14px" id="simple-mode-note" hidden>Modo simplificado activo: se priorizan audio, chat, materiales y actividades.</div>
        </section>
    `;
}

function bindActions() {
    document.querySelectorAll('[data-message]').forEach(button => {
        button.addEventListener('click', () => alert(button.dataset.message));
    });
    document.querySelectorAll('[data-class]').forEach(button => {
        button.addEventListener('click', () => {
            document.body.classList.remove('text-small', 'text-medium', 'text-large');
            document.body.classList.add(button.dataset.class);
        });
    });
    document.querySelectorAll('[data-contrast]').forEach(button => {
        button.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast', button.dataset.contrast !== 'normal');
        });
    });
    const toggle = document.getElementById('simple-mode-toggle');
    if (toggle) {
        toggle.addEventListener('change', () => {
            document.getElementById('simple-mode-note').hidden = !toggle.checked;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = AuthService.getCurrentUser();
    document.querySelector('[data-dashboard-link]').href = user?.role === 'teacher' ? 'dashboard-teacher.html' : 'dashboard-student.html';
    const view = currentView();
    renderMenu(view);
    const views = { tutorials, guides, accessibility, 'simple-mode': simpleMode };
    document.getElementById('help-root').innerHTML = (views[view] || tutorials)();
    bindActions();
});
