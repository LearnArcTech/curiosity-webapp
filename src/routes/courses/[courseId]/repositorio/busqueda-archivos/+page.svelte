<script lang="ts">
    import { page } from "$app/state";
    import {
        repository,
        reports,
        type RepositorySummary,
        type FileRow,
    } from "$lib/api";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";
    import RepositoryFileGrid from "$lib/components/page-specific/repository-file-grid.svelte";

    let { data } = $props();

    let userRole = $derived(data.user.role);
    let isTeacher = $derived(userRole === "teacher");

    let courseId = $derived(page.params.courseId ?? "");

    let summary = $state<RepositorySummary | null>(null);
    let reportsList = $state<FileRow[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let uploading = $state(false);
    let uploadError = $state("");

    let selectedFile = $state<FileRow | null>(null);
    let previewOpen = $state(false);

    let fileInput: HTMLInputElement | null = $state(null);
    let unsubscribe: (() => void) | null = null;

    function formatBytes(bytes: number): string {
        if (bytes <= 0) return "0 B";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0;
        let val = bytes;
        while (val >= 1024 && i < units.length - 1) {
            val /= 1024;
            i++;
        }
        return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    async function load(cId: string) {
        loading = true;
        errorMsg = "";
        try {
            summary = await repository.list(cId);
            if (isTeacher) {
                reportsList = await reports.list(cId);
            }
        } catch (err: any) {
            console.error("Repository load failure:", err);
            errorMsg = err.message || "No se pudo cargar el repositorio.";
        } finally {
            loading = false;
        }
    }

    function triggerUpload() {
        uploadError = "";
        fileInput?.click();
    }

    async function handleFileSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = "";
        if (!file || !courseId) return;

        if (summary && file.size > summary.quota_remaining) {
            uploadError =
                "No hay suficiente espacio en el repositorio del curso.";
            return;
        }

        uploading = true;
        uploadError = "";
        try {
            await repository.add(courseId, file);
            await load(courseId);
        } catch (err: any) {
            console.error("Upload failure:", err);
            uploadError = err.message || "No se pudo subir el archivo.";
        } finally {
            uploading = false;
        }
    }

    async function handleDelete(fileId: string) {
        try {
            await repository.remove(fileId);
            await load(courseId);
        } catch (err: any) {
            console.error("Delete failure:", err);
            errorMsg = err.message || "No se pudo eliminar el archivo.";
        }
    }

    async function handleDeleteReport(fileId: string) {
        try {
            await reports.remove(fileId);
            await load(courseId);
        } catch (err: any) {
            console.error("Delete failure:", err);
            errorMsg = err.message || "No se pudo eliminar el archivo.";
        }
    }

    function openPreview(file: FileRow) {
        selectedFile = file;
        previewOpen = true;
    }

    function closePreview() {
        previewOpen = false;
    }

    $effect(() => {
        const cId = page.params.courseId;
        if (!cId) return;
        load(cId);
        unsubscribe?.();
        unsubscribe = repository.subscribe(cId, () => load(cId));
        return () => {
            unsubscribe?.();
            unsubscribe = null;
        };
    });
</script>

<main>
    <div class="page-header">
        <h1 class="title">Búsqueda de archivos</h1>
        <div class="right-options-wrap">
            {#if summary}
                <div class="quota-widget">
                    <div class="quota-info">
                        <span class="quota-label">Uso de almacenamiento</span>
                        <span class="quota-text">
                            {formatBytes(summary.quota_used)} / {formatBytes(
                                summary.quota_total,
                            )}
                        </span>
                    </div>
                    <div class="quota-bar">
                        <div
                            class="quota-fill"
                            style:width={`${Math.min(100, (summary.quota_used / summary.quota_total) * 100)}%`}
                        ></div>
                    </div>
                </div>
            {:else}
                <WaveLoader size={20} />
            {/if}

            {#if isTeacher}
                <VariantButton onclick={triggerUpload} disabled={uploading}>
                    {uploading ? "Subiendo..." : "Subir archivo"}
                </VariantButton>
                <input
                    bind:this={fileInput}
                    type="file"
                    class="hidden-input"
                    onchange={handleFileSelected}
                />
            {/if}
        </div>
    </div>

    {#if uploadError}
        <p class="inline-error">{uploadError}</p>
    {/if}

    <div class="content-area">
        <PageStatus
            {loading}
            error={errorMsg}
            loadingMessage="Cargando archivos..."
            onRetry={() => load(courseId)}
        >
            {#snippet children()}
                {#if summary}
                    <RepositoryFileGrid
                        items={summary.files}
                        {isTeacher}
                        searchPlaceholder="Buscar en repositorio..."
                        {formatBytes}
                        onPreview={openPreview}
                        onDelete={handleDelete}
                    />

                    {#if isTeacher && reportsList.length > 0}
                        <div class="teacher-section">
                            <RepositoryFileGrid
                                items={reportsList}
                                {isTeacher}
                                searchPlaceholder="Buscar en reportes..."
                                {formatBytes}
                                onPreview={openPreview}
                                onDelete={handleDeleteReport}
                            />
                        </div>
                    {/if}
                {/if}
            {/snippet}
        </PageStatus>
    </div>

    <FilePreviewModal
        file={selectedFile}
        {courseId}
        open={previewOpen}
        onClose={closePreview}
    />
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        flex-shrink: 0;
    }

    .title {
        color: var(--primary-color);
    }

    .content-area {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        margin-top: 1rem;
    }

    .teacher-section {
        border-top: 2px dashed var(--border-color);
        margin-top: 1rem;
        padding-top: 1rem;
    }

    .hidden-input {
        display: none;
    }

    .inline-error {
        color: var(--error-color);
        font-size: 0.85rem;
        margin: 0.25rem 0 0;
    }

    .quota-widget {
        align-self: flex-end;
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 360px;
        background-color: var(--primary-container-color);
        padding: 5px 20px;
        border-radius: var(--radius);
    }

    .quota-label {
        font-size: calc(0.8rem * var(--font-scale));
        font-weight: 600;
        color: var(--primary-color);
    }

    .quota-bar {
        width: 100%;
        height: 8px;
        border-radius: var(--radius);
        background-color: var(--white);
        overflow: hidden;
    }

    .quota-fill {
        height: 100%;
        background-color: var(--primary-color);
        transition: width 0.3s ease;
    }

    .quota-text {
        font-size: calc(0.8rem * var(--font-scale));
        color: var(--primary-color);
    }

    .right-options-wrap {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
</style>
