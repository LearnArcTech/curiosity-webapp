<script lang="ts">
    import { page } from "$app/state";
    import type { FileRow } from "$lib/api";
    import { reports, repository } from "$lib/api";
    import DataTable from "$lib/components/data/data-table.svelte";
    import UploadReportModal from "$lib/components/modals/upload-report-modal.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";
    import Tesseract from "tesseract.js";
    import * as XLSX from "xlsx";
    import {
        LabProfile,
        SearchCheck2,
        CloudAlert,
        Schedule,
        Delete,
        Visibility,
        Upload,
        Download,
    } from "@material-symbols-svg/svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    let reportsList = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let isUploadModalOpen = $state(false);
    let courseId = $derived(page.params.courseId);

    let isPreviewOpen = $state(false);
    let selectedFile = $state<FileRow | null>(null);
    let processingId = $state<string | null>(null);

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

    async function loadReports() {
        const courseId = page.params.courseId;
        if (!courseId) return;
        try {
            reportsList = await reports.list(courseId);
        } catch (err: any) {
            console.error("Failed to compile reports dashboard:", err);
            errorMsg = err.message || "Error al recuperar listado de reportes.";
        } finally {
            loading = false;
        }
    }

    async function handleFileClick(file: FileRow) {
        if (file.filename.toLowerCase().endsWith(".xlsx")) {
            try {
                const url = await repository.getFileUrl(
                    file.storage_path,
                    true,
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = file.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (err: any) {
                alert("Error al descargar el Excel: " + err.message);
            }
        } else {
            selectedFile = file;
            isPreviewOpen = true;
        }
    }

    $effect(() => {
        if (page.params.courseId) {
            loadReports();
        }
    });

    async function handleRunOcr(
        fileId: string,
        filename: string,
        storagePath: string,
    ) {
        if (processingId) return;
        if (!courseId) return;
        processingId = fileId;
        try {
            const imageUrl = await repository.getFileUrl(storagePath);
            const worker = await Tesseract.createWorker("spa");
            const {
                data: { text },
            } = await worker.recognize(imageUrl);
            await worker.terminate();

            const rowData = [["Contenido Extraído (OCR)"], [text]];
            const worksheet = XLSX.utils.aoa_to_sheet(rowData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });
            const excelBlob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const excelName =
                filename.replace(/\.\w+$/, "") + "_procesado.xlsx";

            await reports.upload(courseId, excelBlob, excelName);
            await reports.markAsProcessed(fileId);

            await loadReports();
        } catch (err: any) {
            alert("No se pudo completar el procesamiento OCR: " + err.message);
        } finally {
            processingId = null;
        }
    }

    async function handleDeleteReport(fileId: string) {
        if (
            !confirm(
                "¿Está seguro de que desea eliminar permanentemente este reporte?",
            )
        )
            return;
        if (processingId) return;

        processingId = fileId;
        try {
            await reports.remove(fileId);
            reportsList = reportsList.filter((item) => item.id !== fileId);
        } catch (err: any) {
            alert("Error al eliminar reporte: " + err.message);
        } finally {
            processingId = null;
        }
    }

    function refreshDataList() {
        if (page.params.courseId) {
            loadReports();
        }
    }
</script>

<div class="reports-page">
    <div class="page-header">
        <h1 class="title">Reportes</h1>

        <VariantButton onclick={() => (isUploadModalOpen = true)}>
            <Upload size={18} />
            Subir Reporte
        </VariantButton>
    </div>

    {#if loading}
        <div class="state-container loading-wrapper">
            <WaveLoader size={28} />
            <p>Cargando archivos del repositorio de reportes...</p>
        </div>
    {:else if errorMsg}
        <div class="state-container error-wrapper">
            <CloudAlert size={32} />
            <p>{errorMsg}</p>
            <VariantButton class="retry-btn" onclick={loadReports}
                >Reintentar consulta</VariantButton
            >
        </div>
    {:else}
        <DataTable
            items={reportsList}
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
                                onclick={() => handleFileClick(row)}
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
                                        handleRunOcr(
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
                                onclick={() => handleDeleteReport(row.id)}
                            >
                                <Delete size={16} />
                            </VariantButton>
                        {/if}
                    </div>
                {/if}
            {/snippet}
        </DataTable>
    {/if}

    {#if courseId}
        <UploadReportModal
            bind:open={isUploadModalOpen}
            {courseId}
            onUploadSuccess={refreshDataList}
        />

        <FilePreviewModal
            open={isPreviewOpen}
            file={selectedFile}
            {courseId}
            onClose={() => {
                isPreviewOpen = false;
                selectedFile = null;
            }}
        />
    {/if}
</div>

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

    .reports-page {
        width: 100%;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
    }

    .state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 32px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-color);
    }

    .error-wrapper {
        border-color: var(--error-container-color);
        color: var(--error-color);
    }

    .file-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 380px;
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
        font-size: 0.85rem;
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
        font-size: 0.8rem;
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
