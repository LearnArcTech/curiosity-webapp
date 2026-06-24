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

    async function submit() {
        if (!code.trim()) {
            error = "Please enter a course code.";
            return;
        }
        loading = true;
        try {
            await onEnroll?.(code);
            open = false;
            code = "";
            error = "";
        } catch {
            error = "Something went wrong. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<Dialog bind:open title="Enroll in a course">
    {#snippet children()}
        <Input
            id="course-code"
            name="course-code"
            label="Course code"
            placeholder="e.g. 1042"
            bind:value={code}
            bind:error
        />
        <p class="hint">Ask your teacher for the course code.</p>
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
                        : 1}; transition: opacity 0.15s ease;">Enroll</span
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
    .hint {
        font-size: 13px;
        color: var(--text-color);
    }

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
