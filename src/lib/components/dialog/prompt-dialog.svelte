<script lang="ts">
    import Dialog from "$lib/components/basic/dialog.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Input from "$lib/components/basic/input.svelte";

    interface Props {
        open: boolean;
        title?: string;
        message?: string;
        placeholder?: string;
        defaultValue?: string;
        onCancel?: () => void;
        onAccept: (value: string) => void;
    }

    let {
        open = $bindable(),
        title = "Ingresar",
        message = "",
        placeholder = "",
        defaultValue = "",
        onCancel = () => {
            open = false;
        },
        onAccept,
    }: Props = $props();

    let inputValue = $state("");

    $effect(() => {
        if (open) inputValue = defaultValue;
    });

    function handleAccept() {
        onAccept(inputValue);
        open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") handleAccept();
    }
</script>

<Dialog {title} bind:open>
    {#snippet children()}
        <div class="dialog-body">
            {#if message}
                <p class="message">{message}</p>
            {/if}
            <Input
                id="prompt-input"
                name="prompt-input"
                bind:value={inputValue}
                {placeholder}
                onkeydown={handleKeydown}
                autofocus
            />
        </div>
    {/snippet}
    {#snippet footer()}
        <VariantButton variant="secondary-dark" onclick={handleAccept}>
            Aceptar
        </VariantButton>
        <VariantButton variant="secondary-light" onclick={onCancel}>
            Cancelar
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

    .message {
        font-size: 0.95rem;
    }
</style>
