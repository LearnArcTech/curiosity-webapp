<script lang="ts">
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    let restarted = $state(false);
    function restartOnboarding() {
        restarted = true;
        setTimeout(() => {
            restarted = false;
        }, 1500);
    }
</script>

<h1>Onboarding</h1>
<p class="description">
    Vuelve a recorrer la guía de bienvenida que viste al crear tu cuenta. Te
    mostraremos cómo configurar tu rol, tu primer curso y los conceptos básicos
    de la plataforma.
</p>

<VariantButton onclick={restartOnboarding} disabled={restarted}>
    {restarted ? "Reiniciando..." : "Reiniciar onboarding"}
</VariantButton>

<style>
    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1rem;
    }
    .description {
        color: var(--text-color);
        max-width: 40rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
</style>
