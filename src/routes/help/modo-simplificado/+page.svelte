<script lang="ts">
    import Switch from "$lib/components/basic/switch.svelte";
    import { invalidateAll } from "$app/navigation";
    import { preferences } from "$lib/api";

    let simplifiedMode = $state(false);
    let loading = $state(true);
    let saving = $state(false);
    let errorMsg = $state("");
    let loaded = false;

    $effect(() => {
        (async () => {
            try {
                const prefs = await preferences.get();
                simplifiedMode = prefs.simple_mode ?? false;
            } catch (err) {
                errorMsg = "No se pudo cargar tu preferencia.";
                console.error(err);
            } finally {
                loading = false;
                loaded = true;
            }
        })();
    });

    $effect(() => {
        const value = simplifiedMode;
        if (!loaded) return;

        (async () => {
            saving = true;
            errorMsg = "";
            try {
                await preferences.setAccessibility({ simple_mode: value });
                await invalidateAll();
            } catch (err) {
                errorMsg = "No se pudo guardar el cambio.";
                console.error(err);
            } finally {
                saving = false;
            }
        })();
    });
</script>

<h1>Modo Simplificado</h1>
<p class="description">
    Activa el modo simplificado para ocultar y desactivar elementos innecesarios
    en la pantalla. <br /> Esta opcion tambien elimina varias animaciones en Curisoity.
</p>

{#if errorMsg}
    <p class="error" role="alert">{errorMsg}</p>
{/if}

<div class="setting-row">
    <Switch
        bind:checked={simplifiedMode}
        id="simplified-mode"
        disabled={loading}
    />
    <label for="simplified-mode">
        Modo simplificado {simplifiedMode ? "activado" : "desactivado"}
    </label>
</div>

{#if saving}
    <p class="saving-indicator">Guardando...</p>
{/if}

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
    .error {
        color: var(--error-color, #d32f2f);
        margin-bottom: 1rem;
    }
    .saving-indicator {
        color: var(--text-color);
        opacity: 0.6;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }
</style>
