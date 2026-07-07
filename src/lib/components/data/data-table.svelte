<script lang="ts" generics="T extends Record<string, any>">
    import { FilterAlt } from "@material-symbols-svg/svelte";

    interface Column {
        key: string;
        label: string;
        align?: "left" | "center" | "right";
        width?: string;
    }

    let {
        items = [],
        columns = [],
        caption = "Tabla de datos",
        searchPlaceholder = "Buscar",
        searchLabel = "Buscar en la tabla",
        searchKeys = ["username"],
        cell,
    }: {
        items: T[];
        columns: Column[];
        caption?: string;
        searchPlaceholder?: string;
        searchLabel?: string;
        searchKeys?: (keyof T)[];
        cell?: import("svelte").Snippet<
            [{ row: T; column: Column; value: any }]
        >;
    } = $props();

    let searchQuery = $state("");
    let filtersOpen = $state(false);

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

    // Announced to screen reader users whenever the filtered set changes.
    let resultsMessage = $derived(
        searchQuery
            ? `${filteredItems.length} ${filteredItems.length === 1 ? "resultado encontrado" : "resultados encontrados"}`
            : "",
    );

    function toggleFilters() {
        filtersOpen = !filtersOpen;
    }
</script>

<div class="table-container">
    <div class="search-bar">
        <label class="visually-hidden" for="table-search">{searchLabel}</label>
        <input
            id="table-search"
            type="text"
            placeholder={searchPlaceholder}
            bind:value={searchQuery}
        />
        <button
            class="filter-btn"
            type="button"
            aria-pressed={filtersOpen}
            aria-label="Alternar filtros"
            onclick={toggleFilters}
        >
            <FilterAlt size={18} />
        </button>
    </div>

    <!-- Visually hidden live region: announces result count changes without
         needing focus, so screen reader users know the table updated. -->
    <div class="visually-hidden" aria-live="polite" role="status">
        {resultsMessage}
    </div>

    <div class="responsive-wrapper">
        <table class="custom-table">
            <caption class="visually-hidden">{caption}</caption>
            <thead>
                <tr>
                    {#each columns as col}
                        <th
                            scope="col"
                            style:text-align={col.align ?? "left"}
                            style:width={col.width ?? "auto"}
                        >
                            {col.label}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#if filteredItems.length === 0}
                    <tr>
                        <td colspan={columns.length} class="empty-state">
                            No se encontraron resultados
                        </td>
                    </tr>
                {:else}
                    {#each filteredItems as row}
                        <tr>
                            {#each columns as col}
                                <td style:text-align={col.align ?? "left"}>
                                    {#if cell}
                                        {@render cell({
                                            row,
                                            column: col,
                                            value: row[col.key],
                                        })}
                                    {:else}
                                        {row[col.key] ?? ""}
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    /* Standard visually-hidden pattern: keeps content in the accessibility
       tree and available to screen readers, removed from visual flow. */
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .table-container {
        width: 100%;
        height: 100%;
        background-color: var(--background-color);
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
    }

    .search-bar input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.5rem 0.75rem;
        font-family: var(--font-body);
        font-size: calc(0.95rem * var(--font-scale));
        color: var(--text-color);
        outline: none;
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
        transition:
            background-color var(--motion-duration) ease,
            color var(--motion-duration) ease;
    }

    .filter-btn:hover {
        background-color: var(--primary-color);
        color: var(--primary-container-color);
    }

    .filter-btn:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }

    .filter-btn[aria-pressed="true"] {
        background-color: var(--primary-color);
        color: var(--white);
    }

    .responsive-wrapper {
        width: 100%;
        overflow-x: auto;
    }

    .custom-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-body);
        font-size: calc(0.9rem * var(--font-scale));
    }

    .custom-table th {
        color: var(--text-color);
        font-weight: 500;
        padding: calc(0.75rem * var(--font-scale)) 1rem;
        background-color: var(--background-color);
        border-bottom: var(--border-width) solid var(--border-color);
    }

    .custom-table td {
        padding: calc(0.875rem * var(--font-scale)) 1rem;
        color: var(--text-color);
        vertical-align: middle;
        border-bottom: var(--border-width) solid transparent;
    }

    .custom-table tr:last-child td {
        border-bottom: none;
    }

    .custom-table tr:hover td {
        background-color: var(--neutral-surface-variant);
    }

    .empty-state {
        text-align: center !important;
        padding: 2rem !important;
        color: var(--primary-color) !important;
        font-style: italic;
    }
</style>
