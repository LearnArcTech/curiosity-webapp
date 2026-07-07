<script>
    /**
     * @typedef {"primary-dark" | "secondary-dark" | "primary-light" | "secondary-light"} ButtonVariant
     */
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children] - The content inside the button
     * @property {ButtonVariant} [variant="primary-light"] - The visual style of the button
     */
    /** * @type {Props & import('svelte/elements').HTMLButtonAttributes}
     */
    let { children, variant = "primary-dark", ...rest } = $props();
</script>

<button class="base-button {variant}" {...rest}>
    {@render children?.()}
</button>

<style>
    .base-button {
        padding: 0.8rem 1.5rem;
        border-radius: var(--radius);
        font-size: 1rem;
        cursor: pointer;
        text-align: left;
        user-select: none;
        border: var(--border-width) solid transparent;
        transition:
            padding var(--motion-duration) ease,
            font-size var(--motion-duration) ease,
            transform var(--motion-duration) ease;
    }
    .base-button:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }
    .base-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .primary-dark {
        background-color: var(--primary-color);
        color: var(--text-color-light);
    }
    .primary-light {
        background-color: var(--white);
        color: var(--primary-color);
        border-color: var(--primary-color);
    }
    .secondary-dark {
        background-color: var(--secondary-color);
        color: var(--text-color-light);
    }
    .secondary-light {
        background-color: var(--white);
        color: var(--secondary-color);
        border-color: var(--secondary-color);
    }
    :global(html[data-contrast="max"]) .primary-dark,
    :global(html[data-contrast="max"]) .secondary-dark {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: -1px;
    }
</style>
