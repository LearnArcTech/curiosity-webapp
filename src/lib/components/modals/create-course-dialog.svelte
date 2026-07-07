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
            error = "Please enter a course name.";
            return;
        }
        loading = true;
        try {
            await onCreateCourse?.(name.trim());
            open = false;
            reset();
        } catch {
            error = "Something went wrong. Please try again.";
            loading = false;
        }
    }
</script>

<Dialog bind:open title="Create a new course">
    {#snippet children()}
        <Input
            id="course-name"
            name="course-name"
            label="Course name"
            placeholder="e.g. Introduction to Biology"
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
                    Create course
                </span>
                <span
                    class="btn-loader"
                    aria-hidden="true"
                    class:hidden-visually={!loading}
                >
                    <WaveLoader size={16} color="var(--text-color-light)" />
                </span>
                <span class="visually-hidden" role="status">
                    {loading ? "Creating course, please wait." : ""}
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
