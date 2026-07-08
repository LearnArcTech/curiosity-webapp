<script lang="ts">
    import DataTable from "$lib/components/data/data-table.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import type { FileRow } from "$lib/api";

    type OfflineStatus = "idle" | "downloading" | "downloaded";

    let {
        items,
        fileColumnLabel = "Archivo",
        searchPlaceholder = "Buscar en repositorio...",
        offlineState,
        formatBytes,
        onPreview,
        onDownload,
        onRemove,
    }: {
        items: FileRow[];
        fileColumnLabel?: string;
        searchPlaceholder?: string;
        offlineState: Record<
            string,
            { status: OfflineStatus; progress: number }
        >;
        formatBytes: (bytes: number) => string;
        onPreview: (file: FileRow) => void;
        onDownload: (file: FileRow) => void;
        onRemove: (file: FileRow) => void;
    } = $props();

    const columns = [
        { key: "filename", label: fileColumnLabel },
        {
            key: "status",
            label: "Estado",
            align: "right" as const,
            width: "240px",
        },
    ];
</script>

<DataTable {items} {columns} {searchPlaceholder} searchKeys={["filename"]}>
    {#snippet cell({ row, column })}
        {#if column.key === "filename"}
            <button
                type="button"
                class="filename-cell"
                onclick={() => onPreview(row)}
            >
                <span class="filename-text" title={row.filename}
                    >{row.filename}</span
                >
                <span class="filesize-text">{formatBytes(row.file_size)}</span>
            </button>
        {:else}
            {@const s = offlineState[row.id]}
            <div class="status-cell">
                {#if !s || s.status === "idle"}
                    <span class="status-text muted">Sin descargar</span>
                    <VariantButton
                        variant="secondary-dark"
                        onclick={() => onDownload(row)}
                    >
                        Descargar
                    </VariantButton>
                {:else if s.status === "downloading"}
                    <span class="status-text">Preparando...</span>
                    <div class="progress-track">
                        <div
                            class="progress-fill"
                            style:width={`${s.progress}%`}
                        ></div>
                    </div>
                {:else}
                    <span class="status-text success">100%</span>
                    <VariantButton
                        variant="secondary-light"
                        onclick={() => onRemove(row)}
                    >
                        Quitar
                    </VariantButton>
                {/if}
            </div>
        {/if}
    {/snippet}
</DataTable>

<style>
    .filename-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        font-family: var(--font-body);
        width: 100%;
    }

    .filename-cell:hover .filename-text {
        text-decoration: underline;
    }

    .filename-text {
        font-weight: 500;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 320px;
        font-size: calc(0.8rem * var(--font-scale));
    }

    .filesize-text {
        font-size: calc(0.8rem * var(--font-scale));
        color: var(--border-color);
    }

    .status-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
    }

    .status-text {
        font-size: calc(0.8rem * var(--font-scale));
        font-weight: 600;
        color: var(--primary-color);
        white-space: nowrap;
    }

    .status-text.muted {
        color: var(--border-color);
        font-weight: 500;
    }

    .status-text.success {
        color: var(--secondary-color);
    }

    .progress-track {
        width: 100px;
        height: 6px;
        border-radius: var(--radius);
        background-color: var(--primary-container-color);
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background-color: var(--primary-color);
        transition: width 0.25s ease;
    }
</style>
