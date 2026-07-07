<script lang="ts">
    import type { Snippet } from "svelte";
    let {
        open = $bindable(false),
        title,
        maxWidth = "420px",
        children,
        footer,
        header,
    } = $props<{
        open: boolean;
        title: string;
        maxWidth?: string;
        children?: Snippet;
        footer?: Snippet;
        header?: Snippet;
    }>();
    let dialogEl = $state<HTMLDivElement | undefined>();
    let triggerEl: Element | null = null;
    $effect(() => {
        if (open) {
            triggerEl = document.activeElement;
            queueMicrotask(() => dialogEl?.focus());
        } else if (triggerEl instanceof HTMLElement) {
            triggerEl.focus();
            triggerEl = null;
        }
    });
    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) open = false;
    }
    function trapFocus(e: KeyboardEvent) {
        if (e.key !== "Tab" || !dialogEl) return;
        const focusable = dialogEl.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
</script>

<svelte:window
    onkeydown={(e) => {
        if (!open) return;
        if (e.key === "Escape") open = false;
        trapFocus(e);
    }}
/>
{#if open}
    <div class="overlay" onclick={handleOverlayClick} role="presentation">
        <div
            class="dialog"
            style:max-width={maxWidth}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            bind:this={dialogEl}
            tabindex="-1"
        >
            <div class="dialog-header">
                {#if header}
                    {@render header()}
                {:else}
                    <h2 id="dialog-title">{title}</h2>
                {/if}
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
        padding: 1rem;
    }
    .dialog {
        background: var(--background-color);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        width: 100%;
        max-width: 420px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 1.5rem;
        animation: scaleUp var(--motion-duration)
            cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @media (prefers-reduced-motion: reduce) {
        .dialog {
            animation: none;
        }
    }
    .dialog:focus-visible {
        outline: none;
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
        border-bottom: var(--border-width) solid var(--border-color);
    }
    .dialog-header h2 {
        font-size: calc(1.5rem * var(--font-scale));
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
