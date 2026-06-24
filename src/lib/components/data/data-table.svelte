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
        searchPlaceholder = "Buscar",
        searchKeys = ["username"],
        cell,
    }: {
        items: T[];
        columns: Column[];
        searchPlaceholder?: string;
        searchKeys?: (keyof T)[];
        cell?: import("svelte").Snippet<
            [{ row: T; column: Column; value: any }]
        >;
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

<div class="table-container">
    <div class="search-bar">
        <input
            type="text"
            placeholder={searchPlaceholder}
            bind:value={searchQuery}
            aria-label="Filter items"
        />
        <button class="filter-btn" type="button" aria-label="Toggle filters">
            <FilterAlt size={18} />
        </button>
    </div>

    <div class="responsive-wrapper">
        <table class="custom-table">
            <thead>
                <tr>
                    {#each columns as col}
                        <th
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
    .table-container {
        width: 100%;
        height: 100%;
        background-color: var(--white);
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
        overflow: hidden;
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
    }

    .search-bar {
        display: flex;
        align-items: center;
        background-color: var(--primary-container-color);
        padding: 4px;
    }

    .search-bar input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 8px 12px;
        font-size: 0.95rem;
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
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius);
    }

    .filter-btn:hover {
        background-color: var(--primary-color);
        color: var(--primary-container-color);
    }

    .responsive-wrapper {
        width: 100%;
        overflow-x: auto;
    }

    .custom-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .custom-table th {
        color: var(--text-color);
        font-weight: 500;
        padding: 12px 16px;
        background-color: var(--white);
        border-bottom: 1px solid var(--border-color);
        text-transform: capitalize;
    }

    .custom-table td {
        padding: 14px 16px;
        color: var(--text-color);
        vertical-align: middle;
    }

    .custom-table tr:last-child td {
        border-bottom: none;
    }

    .custom-table tr:hover td {
        background-color: var(--white);
    }

    .empty-state {
        text-align: center !important;
        padding: 32px !important;
        color: var(--primary-color) !important;
        font-style: italic;
    }
</style>
