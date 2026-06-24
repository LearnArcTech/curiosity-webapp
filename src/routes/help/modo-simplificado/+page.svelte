<script lang="ts">
    import Switch from "$lib/components/basic/switch.svelte";

    let simplifiedMode = $state(false);
</script>

<h1>Modo Simplificado</h1>
<p class="description">
    Activa el modo simplificado para reducir la cantidad de elementos en
    pantalla y mostrar solo las acciones más importantes.
</p>

<div class="setting-row">
    <Switch bind:checked={simplifiedMode} id="simplified-mode" />
    <label for="simplified-mode">
        Modo simplificado {simplifiedMode ? "activado" : "desactivado"}
    </label>
</div>

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
    .setting-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    label {
        color: var(--text-color);
    }
</style>
