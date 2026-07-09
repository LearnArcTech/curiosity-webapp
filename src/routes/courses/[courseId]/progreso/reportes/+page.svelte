<script lang="ts">
    import { page } from "$app/state";
    import type { FileRow } from "$lib/api";
    import { reports, repository } from "$lib/api";
    import UploadReportModal from "$lib/components/modals/upload-report-modal.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import AlertDialog from "$lib/components/dialog/alert-dialog.svelte";
    import ReportsDataTable from "$lib/components/page-specific/reports-datagrid.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import Tesseract from "tesseract.js";
    import * as XLSX from "xlsx";
    import { Upload } from "@material-symbols-svg/svelte";

    let reportsList = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let isUploadModalOpen = $state(false);
    let courseId = $derived(page.params.courseId);

    let isPreviewOpen = $state(false);
    let selectedFile = $state<FileRow | null>(null);
    let processingId = $state<string | null>(null);
    let alertMsg = $state("");
    let alertOpen = $state(false);
    let pendingDeleteId = $state<string | null>(null);
    let deleteDialogOpen = $derived(pendingDeleteId !== null);

    async function loadReports() {
        const courseId = page.params.courseId;
        if (!courseId) return;
        loading = true;
        errorMsg = "";
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
                const response = await fetch(url);
                if (!response.ok) throw new Error("No se pudo descargar el archivo");
                const blob = await response.blob();

                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = file.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (err: any) {
                alertMsg = "Error al descargar el Excel: " + err.message;
                alertOpen = true;
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
            alertMsg =
                "No se pudo completar el procesamiento OCR: " + err.message;
            alertOpen = true;
        } finally {
            processingId = null;
        }
    }

    async function handleDeleteConfirm() {
        if (!pendingDeleteId || processingId) return;
        processingId = pendingDeleteId;
        pendingDeleteId = null;
        try {
            await reports.remove(processingId);
            reportsList = reportsList.filter(
                (item) => item.id !== processingId,
            );
        } catch (err: any) {
            alertMsg = "Error al eliminar reporte: " + err.message;
            alertOpen = true;
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

<main>
    <div class="page-header">
        <h1 class="title">Reportes</h1>
        <VariantButton onclick={() => (isUploadModalOpen = true)}>
            <Upload size={18} />
            Subir Reporte
        </VariantButton>
    </div>

    <PageStatus
        {loading}
        error={errorMsg}
        loadingMessage="Cargando archivos del repositorio de reportes..."
        onRetry={loadReports}
    >
        {#snippet children()}
            <ReportsDataTable
                items={reportsList}
                {processingId}
                onFileClick={handleFileClick}
                onRunOcr={handleRunOcr}
                onDeleteRequest={(id) => (pendingDeleteId = id)}
            />
        {/snippet}
    </PageStatus>

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

    <ConfirmDialog
        title="Eliminar reporte"
        open={deleteDialogOpen}
        onAccept={handleDeleteConfirm}
        onCancel={() => (pendingDeleteId = null)}
    >
        {#snippet content()}
            <p>
                ¿Estás seguro de que deseas eliminar este elemento? Esta acción
                no se puede deshacer.
            </p>
        {/snippet}
    </ConfirmDialog>

    <AlertDialog
        bind:open={alertOpen}
        title="Error"
        onClose={() => (alertOpen = false)}
    >
        {#snippet content()}
            <p>{alertMsg}</p>
        {/snippet}
    </AlertDialog>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .title {
        color: var(--primary-color);
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
        flex-shrink: 0;
    }
</style>
