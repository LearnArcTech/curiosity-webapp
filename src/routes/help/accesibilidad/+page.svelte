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

    const FONT_SCALE: Record<FontSize, number> = {
        small: 0.875,
        medium: 1,
        large: 1.25,
    };

    const CONTRAST_VARS: Record<Contrast, Record<string, string>> = {
        normal: {
            "--text-color": "#000000",
            "--border-color": "#72777f",
            "--neutral-surface-variant": "#d5dbdc",
            "--border-width": "1px",
            "--primary-color": "#2e628c",
            "--primary-container-color": "#cee5ff",
            "--secondary-color": "#0a6b5a",
            "--secondary-container-color": "#a1f2dc",
            "--background-color": "#ffffff",
            "--error-color": "#ba1a1a",
        },
        high: {
            "--text-color": "#000000",
            "--border-color": "#3b3b3b",
            "--neutral-surface-variant": "#b8bfc1",
            "--border-width": "1.5px",
            "--primary-color": "#1c4a6e",
            "--primary-container-color": "#cee5ff",
            "--secondary-color": "#06503f",
            "--secondary-container-color": "#a1f2dc",
            "--background-color": "#ffffff",
            "--error-color": "#ba1a1a",
        },
        max: {
            "--text-color": "#000000",
            "--background-color": "#ffffff",
            "--border-color": "#000000",
            "--neutral-surface-variant": "#ffffff",
            "--border-width": "2px",
            "--primary-color": "#0b3a5c",
            "--primary-container-color": "#ffffff",
            "--secondary-color": "#003d31",
            "--secondary-container-color": "#ffffff",
            "--error-color": "#8c0000",
        },
    };

    function buildPreviewStyle(fontSize: FontSize, contrast: Contrast): string {
        const vars = {
            ...CONTRAST_VARS[contrast],
            "--font-scale": String(FONT_SCALE[fontSize]),
        };
        return Object.entries(vars)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ");
    }

    let { data } = $props();

    let pendingFontSize = $state<FontSize>(data.prefs?.font_size ?? "medium");
    let pendingContrast = $state<Contrast>(data.prefs?.contrast ?? "normal");
    let errorMsg = $state("");
    let saving = $state(false);

    $effect(() => {
        pendingFontSize = data.prefs?.font_size ?? "medium";
        pendingContrast = data.prefs?.contrast ?? "normal";
        errorMsg = data.prefs ? "" : "No se pudieron cargar tus preferencias.";
    });

    let hasChanges = $derived(
        !!data.prefs &&
            (pendingFontSize !== data.prefs.font_size ||
                pendingContrast !== data.prefs.contrast),
    );

    let previewStyle = $derived(
        buildPreviewStyle(pendingFontSize, pendingContrast),
    );

    function selectFontSize(key: FontSize) {
        pendingFontSize = key;
    }

    function selectContrast(key: Contrast) {
        pendingContrast = key;
    }

    async function saveAccessibility() {
        saving = true;
        errorMsg = "";
        try {
            await preferences.setAccessibility({
                font_size: pendingFontSize,
                contrast: pendingContrast,
            });
            await invalidate("app:preferences");
        } catch (err) {
            errorMsg = "No se pudo guardar el cambio.";
            console.error(err);
        } finally {
            saving = false;
        }
    }
</script>

<main>
    <h1>Accesibilidad</h1>
    {#if errorMsg}
        <p class="error" role="alert">{errorMsg}</p>
    {/if}

    <div class="layout">
        <div class="controls">
            <div class="field">
                <span class="field-label">Tamaño de texto</span>
                <div class="option-group">
                    {#each fontSizeOptions as option}
                        <VariantButton
                            variant={pendingFontSize === option.key
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
                            variant={pendingContrast === option.key
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

            <VariantButton
                variant="primary-dark"
                disabled={saving || !data.prefs || !hasChanges}
                onclick={saveAccessibility}
            >
                {saving ? "Guardando..." : "Guardar cambios"}
            </VariantButton>

            {#if hasChanges && !saving}
                <p class="unsaved-note">Tienes cambios sin guardar.</p>
            {/if}
        </div>

        <div class="demo-panel" style={previewStyle}>
            <div class="demo-panel-inner">
                <span class="demo-tag">Vista previa</span>
                <h2 class="demo-heading">Así se vería tu curso</h2>
                <p class="demo-text">
                    Este es un ejemplo de texto normal, para que veas cómo
                    cambian el tamaño de fuente y el contraste antes de guardar.
                </p>

                <div class="demo-card">
                    <div class="demo-card-header">
                        <span class="demo-badge">Activa</span>
                        <span class="demo-muted">Actualizado hoy</span>
                    </div>
                    <p class="demo-card-text">
                        Tarjeta de ejemplo con borde y texto secundario.
                    </p>
                    <label class="demo-checkbox-row">
                        <input type="checkbox" checked />
                        <span>Opción de ejemplo</span>
                    </label>
                </div>

                <div class="demo-buttons">
                    <VariantButton variant="primary-dark"
                        >Acción principal</VariantButton
                    >
                    <VariantButton variant="primary-light"
                        >Acción secundaria</VariantButton
                    >
                </div>

                <p class="demo-error">Ejemplo de mensaje de error</p>
            </div>
        </div>
    </div>
</main>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        flex-shrink: 0;
    }

    .error {
        color: var(--error-color, #d32f2f);
        margin-bottom: 1rem;
        flex-shrink: 0;
    }

    .layout {
        flex: 1;
        min-height: 0;
        display: flex;
        gap: 2rem;
    }

    .controls {
        width: 20rem;
        flex-shrink: 0;
        overflow-y: auto;
    }

    .field {
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
        flex-wrap: wrap;
    }

    .option-group :global(.base-button) {
        text-align: center;
        padding: 0.6rem 1.2rem;
    }

    .unsaved-note {
        color: var(--text-color);
        opacity: 0.6;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }

    .demo-panel {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        background-color: var(--background-color);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        transition:
            background-color 0.2s ease,
            border-color 0.2s ease;
    }

    .demo-panel-inner {
        padding: 2rem;
        font-family: var(--font-body);
        color: var(--text-color);
    }

    .demo-tag {
        display: inline-block;
        font-size: calc(0.75rem * var(--font-scale));
        font-weight: 600;
        text-transform: uppercase;
        color: var(--primary-color);
        background-color: var(--primary-container-color);
        padding: 4px 10px;
        border-radius: var(--radius);
        margin-bottom: 1rem;
    }

    .demo-heading {
        font-family: var(--font-display);
        font-size: calc(1.5rem * var(--font-scale));
        margin: 0 0 0.75rem;
        color: var(--text-color);
    }

    .demo-text {
        font-size: calc(1rem * var(--font-scale));
        line-height: 1.5;
        margin: 0 0 1.5rem;
    }

    .demo-card {
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 1.5rem;
        background-color: var(--neutral-surface, var(--background-color));
    }

    .demo-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .demo-badge {
        font-size: calc(0.7rem * var(--font-scale));
        font-weight: 700;
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
        padding: 2px 8px;
        border-radius: var(--radius);
    }

    .demo-muted {
        font-size: calc(0.8rem * var(--font-scale));
        opacity: 0.7;
    }

    .demo-card-text {
        font-size: calc(0.9rem * var(--font-scale));
        margin: 0 0 0.75rem;
    }

    .demo-checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: calc(0.9rem * var(--font-scale));
        cursor: pointer;
    }

    .demo-checkbox-row input[type="checkbox"] {
        cursor: pointer;
        width: 1rem;
        height: 1rem;
        accent-color: var(--primary-color);
    }

    .demo-buttons {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .demo-error {
        font-size: calc(0.85rem * var(--font-scale));
        color: var(--error-color);
        background-color: var(--error-container-color);
        padding: 8px 12px;
        border-radius: var(--radius);
        margin: 0;
    }

    @media (max-width: 850px) {
        .layout {
            display: flex;
            flex-direction: column;
        }

        .controls {
            width: 100%;
            overflow-y: visible;
        }
    }
</style>
