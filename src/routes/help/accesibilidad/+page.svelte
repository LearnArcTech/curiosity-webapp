<script lang="ts">
    import { invalidate } from "$app/navigation";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { preferences } from "$lib/api";
    import type { Contrast, FontSize } from "$lib/api/types";

    const fontSizeOptions: { key: FontSize; label: string }[] = [
        { key: "small", label: "Pequeño" },
        { key: "medium", label: "Mediano" },
        { key: "large", label: "Grande" },
    ];

    const contrastOptions: { key: Contrast; label: string }[] = [
        { key: "normal", label: "Normal" },
        { key: "high", label: "Alto" },
        { key: "max", label: "Máximo" },
    ];

    let { data } = $props();

    let fontSize = $state<FontSize>("medium");
    let contrastLevel = $state<Contrast>("normal");
    let errorMsg = $state("");

    $effect(() => {
        fontSize = data.prefs?.font_size ?? "medium";
        contrastLevel = data.prefs?.contrast ?? "normal";
        errorMsg = data.prefs ? "" : "No se pudieron cargar tus preferencias.";
    });

    let saving = $state(false);

    async function saveAccessibility(
        opts: Parameters<typeof preferences.setAccessibility>[0],
    ) {
        saving = true;
        errorMsg = "";
        try {
            await preferences.setAccessibility(opts);
            await invalidate("app:preferences");
        } catch (err) {
            errorMsg = "No se pudo guardar el cambio.";
            console.error(err);
        } finally {
            saving = false;
        }
    }

    function selectFontSize(key: FontSize) {
        fontSize = key;
        saveAccessibility({ font_size: key });
    }

    function selectContrast(key: Contrast) {
        contrastLevel = key;
        saveAccessibility({ contrast: key });
    }
</script>

<main>
    <h1>Accesibilidad</h1>

    {#if errorMsg}
        <p class="error" role="alert">{errorMsg}</p>
    {/if}

    <div class="field">
        <span class="field-label">Tamaño de texto</span>
        <div class="option-group">
            {#each fontSizeOptions as option}
                <VariantButton
                    variant={fontSize === option.key
                        ? "primary-dark"
                        : "primary-light"}
                    disabled={saving || !data.prefs}
                    onclick={() => selectFontSize(option.key)}
                >
                    {option.label}
                </VariantButton>
            {/each}
        </div>
    </div>

    <div class="field">
        <span class="field-label">Nivel de contraste</span>
        <div class="option-group">
            {#each contrastOptions as option}
                <VariantButton
                    variant={contrastLevel === option.key
                        ? "primary-dark"
                        : "primary-light"}
                    disabled={saving || !data.prefs}
                    onclick={() => selectContrast(option.key)}
                >
                    {option.label}
                </VariantButton>
            {/each}
        </div>
    </div>

    {#if saving}
        <p class="saving-indicator">Guardando...</p>
    {/if}
</main>

<style>
    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
    }
    .field {
        max-width: 20rem;
        margin-bottom: 1.5rem;
    }
    .field-label {
        display: block;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    .option-group {
        display: flex;
        gap: 0.5rem;
    }
    .option-group :global(.base-button) {
        text-align: center;
        padding: 0.6rem 1.2rem;
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
