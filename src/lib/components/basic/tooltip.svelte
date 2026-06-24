<script>
    /**
     * @typedef {Object} TooltipProps
     * @property {string} text - The message to display inside the tooltip
     * @property {import('svelte').Snippet} [children] - The element that triggers the tooltip
     */

    /** @type {TooltipProps} */
    let { text, children } = $props();

    let isVisible = $state(false);
</script>

<div
    class="tooltip-wrapper"
    onmouseenter={() => (isVisible = true)}
    onmouseleave={() => (isVisible = false)}
    onclick={(e) => {
        e.stopPropagation();
        isVisible = !isVisible;
    }}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === "Enter" && (isVisible = !isVisible)}
>
    {@render children?.()}

    {#if isVisible && text}
        <div class="tooltip-box">
            {text}
        </div>
    {/if}
</div>

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        cursor: pointer;
        outline: none;
    }

    .tooltip-box {
        position: absolute;
        bottom: 110%;
        right: 0;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius);
        font-size: 0.875rem;
        white-space: nowrap;
        z-index: 50;
        border: 1px solid var(--border-color);
        pointer-events: none;
    }
</style>
