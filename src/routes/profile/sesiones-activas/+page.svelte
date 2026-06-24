<script lang="ts">
    import { onMount } from "svelte";
    import DataTable from "$lib/components/data/data-table.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { devices, type DeviceRow } from "$lib/api";

    let rows = $state<DeviceRow[]>([]);
    let loading = $state(true);
    let revokingAll = $state(false);

    async function loadDevices() {
        loading = true;
        rows = await devices.list();
        loading = false;
    }

    async function revokeAllOthers() {
        revokingAll = true;
        try {
            const others = rows.filter((d) => !d.is_current);
            await Promise.all(others.map((d) => devices.revoke(d.id)));
            await loadDevices();
        } finally {
            revokingAll = false;
        }
    }

    onMount(loadDevices);

    const columns = [
        { key: "device_name", label: "Tipo de dispositivo" },
        { key: "last_seen", label: "Última sesión", align: "right" as const },
    ];

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString();
    }
</script>

<h1>Sesiones activas</h1>

{#if loading}
    <WaveLoader size={48} color="var(--primary-color)" />
{:else}
    <DataTable items={rows} {columns} searchKeys={["device_name"]}>
        {#snippet cell({ row, column, value })}
            {#if column.key === "device_name"}
                <span class="device-cell">
                    {row.device_name}
                    {#if row.is_current}
                        <span class="badge">Activa</span>
                    {/if}
                </span>
            {:else if column.key === "last_seen"}
                {formatDate(value)}
            {:else}
                {value}
            {/if}
        {/snippet}
    </DataTable>

    <VariantButton onclick={revokeAllOthers} disabled={revokingAll}>
        {revokingAll ? "Cerrando sesiones…" : "Cerrar todas las sesiones"}
    </VariantButton>
{/if}

<style>
    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1rem;
    }
    .device-cell {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    .badge {
        background: var(--primary-color);
        color: var(--text-color-light);
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius);
    }
</style>
