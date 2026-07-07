<script lang="ts">
    import Dialog from "$lib/components/basic/dialog.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    let { open = $bindable(false), onEnroll } = $props<{
        open: boolean;
        onEnroll?: (code: string) => Promise<void>;
    }>();
    let code = $state("");
    let error = $state("");
    let loading = $state(false);
    function reset() {
        code = "";
        error = "";
        loading = false;
    }
    function cancel() {
        open = false;
        reset();
    }
    async function submit() {
        if (!code.trim()) {
            error = "Por favor ingrese el codigo del curso.";
            return;
        }
        loading = true;
        try {
            await onEnroll?.(code);
            open = false;
            reset();
        } catch {
            error = "Algo salio mal. Por favor intente otra vez.";
            loading = false;
        }
    }
</script>

<Dialog bind:open title="Enroll in a course">
    {#snippet children()}
        <Input
            id="course-code"
            name="course-code"
            label="Codigo del curso"
            placeholder="e.g. 1042-3424-2345"
            bind:value={code}
            bind:error
            aria-describedby="course-code-hint"
        />
        <p class="hint" id="course-code-hint">
            Preguntale a tu profesor por el codigo del curso
        </p>
    {/snippet}
    {#snippet footer()}
        <VariantButton
            variant="secondary-light"
            onclick={cancel}
            disabled={loading}
        >
            Cancel
        </VariantButton>
        <VariantButton onclick={submit} disabled={loading} aria-busy={loading}>
            <span class="btn-content">
                <span class="btn-label" class:hidden-visually={loading}>
                    Matriculate
                </span>
                <span
                    class="btn-loader"
                    aria-hidden="true"
                    class:hidden-visually={!loading}
                >
                    <WaveLoader size={16} color="var(--text-color-light)" />
                </span>
                <span class="visually-hidden" role="status">
                    {loading ? "Matriculandote. Por favor espere." : ""}
                </span>
            </span>
        </VariantButton>
    {/snippet}
</Dialog>

<style>
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    .hint {
        font-size: calc(0.8125rem * var(--font-scale));
        color: var(--text-color);
    }
    .btn-content {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    .btn-label,
    .btn-loader {
        transition: opacity var(--motion-duration) ease;
    }
    .hidden-visually {
        opacity: 0;
    }
    .btn-loader {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
