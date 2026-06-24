<script lang="ts">
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    let textSize = $state("16");
    let contrastLevel = $state<"seguir" | "alto" | "extremo">("seguir");

    const contrastOptions: { key: typeof contrastLevel; label: string }[] = [
        { key: "seguir", label: "Seguir" },
        { key: "alto", label: "Alto" },
        { key: "extremo", label: "Extremo" },
    ];
</script>

<main>
    <h1>Accesibilidad</h1>

    <div class="field">
        <Input
            id="text-size"
            name="text-size"
            type="number"
            label="Tamaño de texto"
            bind:value={textSize}
            min="10"
            max="32"
        />
    </div>

    <div class="field">
        <span class="field-label">Nivel de contraste</span>
        <div class="contrast-options">
            {#each contrastOptions as option}
                <VariantButton
                    variant={contrastLevel === option.key
                        ? "primary-dark"
                        : "primary-light"}
                    onclick={() => (contrastLevel = option.key)}
                >
                    {option.label}
                </VariantButton>
            {/each}
        </div>
    </div>
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
    .contrast-options {
        display: flex;
        gap: 0.5rem;
    }
    .contrast-options :global(.base-button) {
        text-align: center;
        padding: 0.6rem 1.2rem;
    }
</style>
