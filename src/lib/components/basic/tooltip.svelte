<script>
    /**
     * @typedef {Object} TooltipProps
     * @property {string} text - The message to display inside the tooltip
     * @property {import('svelte').Snippet} [children] - The element that triggers the tooltip
     */
    /** @type {TooltipProps} */
    let { text, children } = $props();
    let isVisible = $state(false);
    const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div
    class="tooltip-wrapper"
    onmouseenter={() => (isVisible = true)}
    onmouseleave={() => (isVisible = false)}
    onfocus={() => (isVisible = true)}
    onblur={() => (isVisible = false)}
    onclick={(e) => {
        e.stopPropagation();
        isVisible = !isVisible;
    }}
    role="button"
    tabindex="0"
    aria-describedby={isVisible ? tooltipId : undefined}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            isVisible = !isVisible;
        }
    }}
>
    {@render children?.()}
    {#if isVisible && text}
        <div class="tooltip-box" id={tooltipId} role="tooltip">
            {text}
        </div>
    {/if}
</div>

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        cursor: pointer;
    }
    .tooltip-wrapper:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
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
        border: var(--border-width) solid var(--border-color);
        pointer-events: none;
    }
</style>
