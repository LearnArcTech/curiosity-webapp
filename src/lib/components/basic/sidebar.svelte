<script lang="ts" generics="T">
    import type { Snippet } from "svelte";
    import VariantButton from "./variant-button.svelte";
    import { KeyboardArrowDown } from "@material-symbols-svg/svelte";

    interface Props<T> {
        items: T[] | null;
        itemKey: (item: T) => string | number;
        itemLabel: (item: T) => string;
        isActive?: (item: T) => boolean;
        onItemClick: (item: T) => void;
        header?: Snippet;
        footer?: Snippet;
    }
    let {
        items,
        itemKey,
        itemLabel,
        isActive,
        onItemClick,
        header,
        footer,
    }: Props<T> = $props();

    let mobileOpen = $state(false);
</script>

<aside class="sidebar">
    <div class="sidebar-header-row">
        {#if header}
            <div class="sidebar-header">
                {@render header()}
            </div>
        {/if}
        <button
            type="button"
            class="mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-collapsible"
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
            {#each items ?? [] as item (itemKey(item))}
                <VariantButton
                    data-key={itemKey(item)}
                    aria-current={isActive?.(item) ? "page" : undefined}
                    onclick={() => onItemClick(item)}
                >
                    {itemLabel(item)}
                </VariantButton>
            {/each}
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
        border-right: 1px solid var(--border-color);
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

    @media (max-width: 770px) {
        .sidebar {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            height: auto;
        }

        .mobile-toggle {
            display: flex;
        }

        .collapsible {
            flex: none;
            max-height: 50vh;
            overflow-y: auto;
        }

        .items-wrapper {
            flex: none;
        }

        .collapsible.is-collapsed {
            gap: 0;
            height: 0;
            max-height: 0;
        }
    }
</style>
