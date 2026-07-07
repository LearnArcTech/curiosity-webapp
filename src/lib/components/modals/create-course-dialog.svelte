<script lang="ts">
    import Dialog from "$lib/components/basic/dialog.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    let { open = $bindable(false), onCreateCourse } = $props<{
        open: boolean;
        onCreateCourse?: (name: string) => Promise<void>;
    }>();
    let name = $state("");
    let error = $state("");
    let loading = $state(false);
    function reset() {
        name = "";
        error = "";
        loading = false;
    }
    function cancel() {
        open = false;
        reset();
    }
    async function submit() {
        if (!name.trim()) {
            error = "Por facor ingrese el nombre del curso.";
            return;
        }
        loading = true;
        try {
            await onCreateCourse?.(name.trim());
            open = false;
            reset();
        } catch {
            error = "Algo salio mal. Por favor intente otra vez";
            loading = false;
        }
    }
</script>

<Dialog bind:open title="Crear un nuevo curso">
    {#snippet children()}
        <Input
            id="course-name"
            name="course-name"
            label="Nombre del curso"
            placeholder="e.g. Introduccion a biologia"
            bind:value={name}
            bind:error
        />
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
                    Crear curso
                </span>
                <span
                    class="btn-loader"
                    aria-hidden="true"
                    class:hidden-visually={!loading}
                >
                    <WaveLoader size={16} color="var(--text-color-light)" />
                </span>
                <span class="visually-hidden" role="status">
                    {loading ? "Creando curso, por favor espere." : ""}
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
