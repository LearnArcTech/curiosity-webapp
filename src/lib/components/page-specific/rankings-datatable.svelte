<script lang="ts">
    import DataTable from "$lib/components/data/data-table.svelte";
    import Avatar from "$lib/components/basic/avatar.svelte";

    let {
        items,
        scoreKey,
        scoreLabel = "Puntaje",
    }: {
        items: any[];
        scoreKey: string;
        scoreLabel?: string;
    } = $props();

    let columns = $derived([
        {
            key: "profile",
            label: "Perfil",
            width: "80px",
            align: "center" as const,
        },
        { key: "username", label: "Nombre" },
        {
            key: scoreKey,
            label: scoreLabel,
            align: "right" as const,
            width: "120px",
        },
    ]);
</script>

<DataTable
    {items}
    {columns}
    searchKeys={["username"]}
    searchPlaceholder="Buscar estudiante..."
>
    {#snippet cell({ column, value, row })}
        {#if column.key === "profile"}
            <div class="avatar-cell">
                <Avatar userId={row.user_id} name={row.username} size={26} />
            </div>
        {:else}
            <span
                class={column.key === scoreKey ? "score-bold" : "text-regular"}
            >
                {value}
            </span>
        {/if}
    {/snippet}
</DataTable>

<style>
    .avatar-cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .text-regular {
        font-weight: 500;
        color: var(--text-color);
    }

    .score-bold {
        font-family: monospace;
        font-weight: 700;
        color: var(--text-color);
        font-size: calc(1rem * var(--font-scale));
    }
</style>
