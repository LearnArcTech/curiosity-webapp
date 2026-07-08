<script lang="ts">
    import type { FileRow } from "$lib/api";
    import DataTable from "$lib/components/data/data-table.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import {
        LabProfile,
        SearchCheck2,
        Schedule,
        Delete,
        Visibility,
        Download,
    } from "@material-symbols-svg/svelte";

    let {
        items,
        processingId = null,
        onFileClick,
        onRunOcr,
        onDeleteRequest,
    }: {
        items: any[];
        processingId?: string | null;
        onFileClick: (file: FileRow) => void;
        onRunOcr: (
            fileId: string,
            filename: string,
            storagePath: string,
        ) => void;
        onDeleteRequest: (fileId: string) => void;
    } = $props();

    const columns = [
        { key: "filename", label: "Documento / Reporte" },
        { key: "file_size", label: "Tamaño", width: "120px" },
        { key: "uploaded_at", label: "Fecha de Subida", width: "160px" },
        {
            key: "ocr_processed",
            label: "Procesamiento OCR",
            width: "150px",
            align: "center" as const,
        },
        {
            key: "actions",
            label: "Acciones",
            width: "160px",
            align: "right" as const,
        },
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
</script>

<DataTable
    {items}
    {columns}
    searchKeys={["filename"]}
    searchPlaceholder="Buscar por nombre de archivo..."
>
    {#snippet cell({ column, row, value })}
        {#if column.key === "filename"}
            <div class="file-name-cell">
                <LabProfile size={18} />
                <span class="filename-text" title={value}>{value}</span>
            </div>
        {:else if column.key === "file_size"}
            <span class="monospace-text">{formatBytes(value)}</span>
        {:else if column.key === "uploaded_at"}
            <span class="date-text">{formatDate(value)}</span>
        {:else if column.key === "ocr_processed"}
            {#if value}
                <div class="badge success-badge">
                    <SearchCheck2 size={14} />
                    <span>Completado</span>
                </div>
            {:else}
                <div class="badge pending-badge">
                    <Schedule size={14} />
                    <span>Pendiente</span>
                </div>
            {/if}
        {:else}
            <div class="actions-cell">
                {#if processingId === row.id}
                    <WaveLoader size={16} />
                {:else}
                    <VariantButton
                        title={row.filename.endsWith(".xlsx")
                            ? "Descargar Excel"
                            : "Ver archivo"}
                        onclick={() => onFileClick(row)}
                    >
                        {#if row.filename.endsWith(".xlsx")}
                            <Download size={16} />
                        {:else}
                            <Visibility size={16} />
                        {/if}
                    </VariantButton>
                    {#if !row.ocr_processed && !row.filename.endsWith(".xlsx")}
                        <VariantButton
                            title="Procesar con OCR"
                            onclick={() =>
                                onRunOcr(
                                    row.id,
                                    row.filename,
                                    row.storage_path,
                                )}
                        >
                            <Visibility size={16} />
                        </VariantButton>
                    {/if}

                    <VariantButton
                        title="Eliminar Reporte"
                        onclick={() => onDeleteRequest(row.id)}
                    >
                        <Delete size={16} />
                    </VariantButton>
                {/if}
            </div>
        {/if}
    {/snippet}
</DataTable>

<style>
    .file-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 380px;
        padding: 4px;
        border-radius: var(--radius);
        transition: background-color 0.2s ease;
    }

    .file-name-cell:hover {
        background-color: var(--secondary-container-color);
        color: var(--primary-color);
    }

    .filename-text {
        font-weight: 500;
        color: var(--text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .monospace-text {
        font-family: monospace;
        color: var(--text-color);
        font-size: calc(1rem * var(--font-scale));
    }

    .date-text {
        color: var(--text-color);
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: calc(0.8rem * var(--font-scale));
        font-weight: 500;
    }

    .success-badge {
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .pending-badge {
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .actions-cell {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
    }
</style>
