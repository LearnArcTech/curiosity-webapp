<script lang="ts">
    import { onMount } from "svelte";
    import DataTable from "$lib/components/data/data-table.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import { devices, type DeviceRow } from "$lib/api";

    let rows = $state<DeviceRow[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let revokingAll = $state(false);
    let revokeError = $state("");

    async function loadDevices() {
        loading = true;
        errorMsg = "";
        try {
            rows = await devices.list();
        } catch (err: any) {
            errorMsg =
                err?.message || "No se pudieron cargar los dispositivos.";
        } finally {
            loading = false;
        }
    }

    async function revokeAllOthers() {
        revokingAll = true;
        revokeError = "";
        try {
            const others = rows.filter((d) => !d.is_current);
            await Promise.all(others.map((d) => devices.revoke(d.id)));
            await loadDevices();
        } catch (err: any) {
            revokeError =
                err?.message || "No se pudieron cerrar las demás sesiones.";
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

<main>
    <h1>Sesiones activas</h1>

    <PageStatus
        {loading}
        error={errorMsg}
        loadingMessage="Cargando dispositivos..."
        onRetry={loadDevices}
    >
        {#snippet children()}
            <div class="content">
                <div class="table-wrap">
                    <DataTable
                        items={rows}
                        {columns}
                        searchKeys={["device_name"]}
                    >
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
                </div>

                {#if revokeError}
                    <p class="inline-error">{revokeError}</p>
                {/if}

                <VariantButton onclick={revokeAllOthers} disabled={revokingAll}>
                    {revokingAll
                        ? "Cerrando sesiones…"
                        : "Cerrar todas las sesiones"}
                </VariantButton>
            </div>
        {/snippet}
    </PageStatus>
</main>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1rem;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .table-wrap {
        flex: 1;
        min-height: 0;
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

    .inline-error {
        color: var(--error-color);
        font-size: 0.85rem;
        margin: 0;
    }
</style>
