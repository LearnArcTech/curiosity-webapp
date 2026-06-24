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

    async function submit() {
        if (!name.trim()) {
            error = "Please enter a course name.";
            return;
        }
        loading = true;
        try {
            await onCreateCourse?.(name.trim());
            open = false;
            name = "";
            error = "";
        } catch {
            error = "Something went wrong. Please try again.";
        } finally {
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
            onclick={() => (open = false)}
            disabled={loading}
        >
            Cancel
        </VariantButton>
        <VariantButton onclick={submit} disabled={loading}>
            <span class="btn-content">
                <span
                    style="opacity: {loading
                        ? 0
                        : 1}; transition: opacity 0.15s ease;"
                    >Create course</span
                >
                <span
                    class="btn-loader"
                    style="opacity: {loading
                        ? 1
                        : 0}; transition: opacity 0.15s ease;"
                >
                    <WaveLoader size={16} color="var(--text-color-light)" />
                </span>
            </span>
        </VariantButton>
    {/snippet}
</Dialog>

<style>
    .btn-content {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .btn-loader {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
