<script lang="ts" generics="T">
    import type { Snippet } from "svelte";
    import VariantButton from "./variant-button.svelte";
    import { KeyboardArrowDown } from "@material-symbols-svg/svelte";
    interface Props<T> {
        items?: T[] | null;
        itemKey?: (item: T) => string | number;
        itemLabel?: (item: T) => string;
        isActive?: (item: T) => boolean;
        onItemClick?: (item: T) => void;
        background?: string;
        header?: Snippet;
        footer?: Snippet;
        children?: Snippet;
        breakpoint?: string;
    }
    let {
        items,
        itemKey,
        itemLabel,
        isActive,
        onItemClick,
        background = "var(--primary-container-color)",
        header,
        footer,
        children,
        breakpoint = "770px",
    }: Props<T> = $props();
    let mobileOpen = $state(false);
    let isMobileLayout = $state(false);

    $effect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint})`);

        const updateLayout = (e: MediaQueryListEvent | MediaQueryList) => {
            isMobileLayout = e.matches;
            if (!e.matches) mobileOpen = false;
        };

        updateLayout(mql);
        mql.addEventListener("change", updateLayout);

        return () => mql.removeEventListener("change", updateLayout);
    });
</script>

<aside class="sidebar" style:background class:is-mobile-layout={isMobileLayout}>
    <div class="sidebar-header-row">
        {#if header}
            <div class="sidebar-header">
                {@render header()}
            </div>
        {/if}
        <button
            type="button"
            class="mobile-toggle"
            class:is-open={mobileOpen}
            aria-expanded={mobileOpen}
            aria-controls="sidebar-collapsible"
            aria-label={mobileOpen ? "Contraer menú" : "Expandir menú"}
            onclick={() => (mobileOpen = !mobileOpen)}
        >
            <KeyboardArrowDown />
        </button>
    </div>
    <div
        id="sidebar-collapsible"
        class="collapsible"
        class:is-collapsed={!mobileOpen}
    >
        <div class="items-wrapper">
            {#if children}
                {@render children()}
            {:else if itemKey && onItemClick && itemLabel}
                {#each items ?? [] as item (itemKey(item))}
                    <VariantButton
                        data-key={itemKey(item)}
                        aria-current={isActive?.(item) ? "page" : undefined}
                        onclick={() => onItemClick(item)}
                    >
                        {itemLabel(item)}
                    </VariantButton>
                {/each}
            {/if}
        </div>
        {#if footer}
            <div class="sidebar-footer">
                {@render footer()}
            </div>
        {/if}
    </div>
</aside>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--primary-container-color);
        height: 100%;
        width: 100%;
        border-right: var(--border-width) solid var(--border-color);
    }
    .sidebar-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }
    .sidebar-header {
        user-select: none;
        flex: 1;
    }
    .mobile-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0.25rem;
        color: inherit;
        cursor: pointer;
        flex-shrink: 0;
    }
    .mobile-toggle:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }
    .mobile-toggle :global(svg) {
        transition: transform var(--motion-duration);
    }
    .mobile-toggle.is-open :global(svg) {
        transform: rotate(180deg);
    }
    .collapsible {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        overflow: hidden;
    }
    .items-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
    }
    .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .sidebar.is-mobile-layout {
        border-right: none;
        border-bottom: var(--border-width) solid var(--border-color);
        height: auto;
    }
    .sidebar.is-mobile-layout .mobile-toggle {
        display: flex;
    }
    .sidebar.is-mobile-layout .collapsible {
        flex: none;
        max-height: 50vh;
        overflow-y: auto;
    }
    .sidebar.is-mobile-layout .items-wrapper {
        flex: none;
    }
    .sidebar.is-mobile-layout .collapsible.is-collapsed {
        gap: 0;
        height: 0;
        max-height: 0;
    }
</style>
