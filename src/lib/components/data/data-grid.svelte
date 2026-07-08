<script lang="ts" generics="T extends Record<string, any>">
    import { FilterAlt } from "@material-symbols-svg/svelte";
    let {
        items = [],
        searchPlaceholder = "Buscar",
        searchKeys = [] as (keyof T)[],
        card,
    }: {
        items: T[];
        searchPlaceholder?: string;
        searchKeys?: (keyof T)[];
        card?: import("svelte").Snippet<[{ item: T }]>;
    } = $props();
    let searchQuery = $state("");
    let filteredItems = $derived(
        items.filter((item) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return searchKeys.some((key) => {
                const val = item[key];
                return val ? String(val).toLowerCase().includes(query) : false;
            });
        }),
    );
</script>

<div class="grid-container">
    <div class="search-bar">
        <input
            type="text"
            placeholder={searchPlaceholder}
            bind:value={searchQuery}
            aria-label={searchPlaceholder}
        />
        <button class="filter-btn" type="button" aria-label="Alternar filtros">
            <FilterAlt size={18} />
        </button>
    </div>
    {#if filteredItems.length === 0}
        <div class="empty-state">No se encontraron resultados</div>
    {:else}
        <div class="responsive-grid">
            {#each filteredItems as item}
                <div class="grid-item-wrapper">
                    {#if card}
                        {@render card({ item })}
                    {:else}
                        <div class="default-card">
                            {#each Object.keys(item) as key}
                                <p><strong>{key}:</strong> {item[key]}</p>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .grid-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
        background-color: var(--white);
        border-radius: var(--radius);
        border: var(--border-width) solid var(--border-color);
        overflow: hidden;
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
    }
    .search-bar {
        display: flex;
        align-items: center;
        background-color: var(--primary-container-color);
        padding: 0.25rem;
        border-radius: var(--radius);
        margin-bottom: 1.5rem;
        flex-shrink: 0;
    }
    .search-bar input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
        color: var(--text-color);
        outline: none;
    }
    .search-bar input:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: -2px;
    }
    .search-bar input::placeholder {
        color: var(--primary-color);
    }
    .filter-btn {
        background: transparent;
        border: none;
        color: var(--primary-color);
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius);
    }
    .filter-btn:hover,
    .filter-btn:focus-visible {
        background-color: var(--primary-color);
        color: var(--primary-container-color);
    }
    .filter-btn:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }
    .responsive-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }
    .grid-item-wrapper {
        display: flex;
        flex-direction: column;
    }
    .default-card {
        padding: 1rem;
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--white);
    }
    .empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: var(--primary-color);
        font-style: italic;
        border-radius: var(--radius);
    }
</style>
