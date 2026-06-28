<script lang="ts">
    import type { Snippet } from "svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    interface Props {
        open: boolean;
        title?: string;
        content: Snippet;
        onClose?: () => void;
    }

    let {
        open = $bindable(),
        title = "Aviso",
        content,
        onClose = () => {
            open = false;
        },
    }: Props = $props();
</script>

<Dialog {title} bind:open>
    {#snippet children()}
        <div class="dialog-body">
            {@render content?.()}
        </div>
    {/snippet}
    {#snippet footer()}
        <VariantButton variant="secondary-dark" onclick={onClose}>
            Aceptar
        </VariantButton>
    {/snippet}
</Dialog>

<style>
    .dialog-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: var(--text-color);
    }
</style>
