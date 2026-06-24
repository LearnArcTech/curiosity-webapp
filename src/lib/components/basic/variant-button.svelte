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
        transition:
            padding 0.2s ease,
            font-size 0.2s ease,
            transform 0.2s ease;
    }

    .primary-dark {
        background-color: var(--primary-color);
        color: var(--text-color-light);
    }

    .primary-light {
        background-color: var(--white);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
    }

    .secondary-dark {
        background-color: var(--secondary-color);
        color: var(--text-color-light);
    }

    .secondary-light {
        background-color: var(--white);
        color: var(--secondary-color);
        border: 1px solid var(--secondary-color);
    }
</style>
