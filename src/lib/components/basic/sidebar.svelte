<script lang="ts" generics="T">
    import type { Snippet } from "svelte";
    import VariantButton from "./variant-button.svelte";

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
</script>

<aside class="sidebar">
    {#if header}
        <div class="sidebar-header">
            {@render header()}
        </div>
    {/if}

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
</aside>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--primary-container-color);
        height: 100%;
        border-right: 1px solid var(--border-color);
        width: 250px;
    }
    .sidebar-header {
        user-select: none;
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
</style>
