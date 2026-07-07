<script lang="ts">
    const { isAuthenticated = false } = $props();
</script>

<footer class="footer">
    <div class="copyright">© 2026 Curiosity</div>
    <div class="footer-links">
        {#if isAuthenticated}
            <a href="/help/accesibilidad">Configuración de Accesibilidad</a>
            <a href="/help/guias-y-tutoriales">Centro de Ayuda</a>
        {/if}
        <a href="/meta/Privacy">Política de Privacidad</a>
        <a href="/meta/TOS">Términos de Servicio</a>
    </div>
</footer>

<style>
    .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 2rem;
        background: var(--header-surface);
        border-top: 1px solid var(--soft-border-color);
        font-size: 0.9rem;
        color: color-mix(in srgb, var(--text-color) 72%, transparent);
        user-select: none;
        backdrop-filter: blur(14px);
    }

    .footer-links {
        display: flex;
        gap: 1rem;
        text-decoration: none;
        color: inherit;
    }

    .footer-links a {
        transition: color 0.2s ease;
    }

    .footer-links a:hover {
        color: var(--primary-color);
    }

    @media (max-width: 768px) {
        .footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
        }

        .footer-links {
            flex-wrap: wrap;
            gap: 0.5rem;
        }
    }
</style>
