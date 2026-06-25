<script lang="ts">
    import type { Snippet } from "svelte";
    import Dialog from "$lib/components/basic/dialog.svelte"
    import VariantButton from "$lib/components/basic/variant-button.svelte"

    interface Props {
        open: boolean;
        title: string;
        content: Snippet
        onCancel: () => void;
        onAccept: () => void;
    }

    function handleExitDefault() {
        open = false;
    }

    let { 
        open = $bindable(),
        title = "Confirm",
        content,
        onCancel = handleExitDefault,
        onAccept 
    }: Props = $props();
</script>

<Dialog title={title} bind:open >
    {#snippet children()}
        <div class="dialog-body ">
            {@render content?.()}
        </div>
    {/snippet}

    {#snippet footer()}
    <VariantButton variant="secondary-dark" onclick={() => onAccept()}>Aceptar</VariantButton>
    <VariantButton variant="secondary-light" onclick={onCancel}>Cancelar</VariantButton>
    {/snippet}
</Dialog>

<style>
    .dialog-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: var(--text-color)
    }
</style>