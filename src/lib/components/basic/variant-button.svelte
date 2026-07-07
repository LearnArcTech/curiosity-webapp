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
        min-height: 3rem;
        padding: 0.85rem 1.35rem;
        border-radius: 14px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid transparent;
        transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
    }

    .base-button:hover {
        transform: translateY(-1px);
    }

    .base-button:active {
        transform: translateY(0);
    }

    .primary-dark {
        background-color: var(--primary-color);
        color: var(--text-color-light);
        box-shadow: 0 14px 28px color-mix(in srgb, var(--primary-color) 26%, transparent);
    }

    .primary-dark:hover {
        background-color: color-mix(in srgb, var(--primary-color) 88%, black);
    }

    .primary-light {
        background-color: var(--button-light-bg);
        color: var(--primary-color);
        border-color: var(--button-light-border);
    }

    .primary-light:hover {
        background-color: var(--button-light-hover-bg);
        border-color: color-mix(in srgb, var(--primary-color) 52%, white);
    }

    .secondary-dark {
        background-color: var(--secondary-color);
        color: var(--text-color-light);
        box-shadow: 0 14px 28px color-mix(in srgb, var(--secondary-color) 22%, transparent);
    }

    .secondary-light {
        background-color: color-mix(in srgb, var(--secondary-container-color) 35%, white);
        color: var(--secondary-color);
        border-color: color-mix(in srgb, var(--secondary-color) 28%, white);
    }
</style>
