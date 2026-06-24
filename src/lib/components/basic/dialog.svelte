<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        open = $bindable(false),
        title,
        children,
        footer,
    } = $props<{
        open: boolean;
        title: string;
        children?: Snippet;
        footer?: Snippet;
    }>();

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }
</script>

<svelte:window
    onkeydown={(e) => {
        if (e.key === "Escape") open = false;
    }}
/>

{#if open}
    <div class="overlay" onclick={handleOverlayClick} role="presentation">
        <div class="dialog" role="dialog" aria-modal="true" aria-label={title}>
            <div class="dialog-header">
                <h2>{title}</h2>
            </div>
            <div class="dialog-body">
                {@render children?.()}
            </div>
            {#if footer}
                <div class="dialog-footer">
                    {@render footer()}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .dialog {
        background: var(--white);
        border: 0.5px solid var(--border-color);
        border-radius: var(--radius);
        width: 100%;
        max-width: 420px;
        padding: 1.5rem;
        animation: scaleUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes scaleUp {
        from {
            transform: scale(0.92);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
        color: var(--text-color);
        border-bottom: 1px solid var(--border-color);
    }

    .dialog-header h2 {
        font-size: 2rem;
        font-weight: 500;
    }

    .dialog-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
    }
</style>
