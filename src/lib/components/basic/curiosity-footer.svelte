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
        padding: 1rem 2rem;
        background-color: var(--neutral-surface-variant);
        border-top: var(--border-width) solid var(--border-color);
        font-size: 0.9rem;
        user-select: none;
    }
    .footer-links {
        display: flex;
        gap: 1rem;
    }
    .footer-links a {
        color: var(--text-color);
        text-decoration: none;
    }
    .footer-links a:hover,
    .footer-links a:focus-visible {
        text-decoration: underline;
    }
    .footer-links a:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
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
