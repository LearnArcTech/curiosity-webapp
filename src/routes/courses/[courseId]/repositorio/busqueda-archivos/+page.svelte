<script lang="ts">
    import { page } from "$app/state";
    import {
        repository,
        reports,
        type RepositorySummary,
        type FileRow,
    } from "$lib/api";
    import DataGrid from "$lib/components/data/data-grid.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";
    import { Description } from "@material-symbols-svg/svelte";

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

    function extOf(filename: string): string {
        const m = filename.match(/\.([a-zA-Z0-9]+)$/);
        return m ? m[1].toUpperCase() : "ARCH";
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

{#snippet fileCard(item: FileRow, deleteHandler: (id: string) => void)}
    <button type="button" class="file-card" onclick={() => openPreview(item)}>
        {#if isTeacher}
            <!-- svelte-ignore node_invalid_placement_ssr -->
            <button
                class="delete-btn"
                type="button"
                title="Eliminar archivo"
                onclick={(e) => {
                    e.stopPropagation();
                    deleteHandler(item.id);
                }}
            >
                ×
            </button>
        {/if}
        <div class="file-icon">
            <Description size={35} />
            <span class="file-ext">{extOf(item.filename)}</span>
        </div>
        <span class="file-name" title={item.filename}>{item.filename}</span>
        <span class="file-size">{formatBytes(item.file_size)}</span>
    </button>
{/snippet}

<main>
    <div class="page-header">
        <h1 class="title">Búsqueda de archivos</h1>
        <div class="right-options-wrap">
            {#if summary}
                <div class="quota-widget">
                    <span class="quota-label">Uso de almacenamiento</span>
                    <div class="quota-bar">
                        <div
                            class="quota-fill"
                            style:width={`${Math.min(100, (summary.quota_used / summary.quota_total) * 100)}%`}
                        ></div>
                    </div>
                    <span class="quota-text">
                        {formatBytes(summary.quota_used)} / {formatBytes(
                            summary.quota_total,
                        )}
                    </span>
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

    {#if loading}
        <div class="loader-container">
            <WaveLoader size={28} />
            <p>Cargando archivos...</p>
        </div>
    {:else if errorMsg}
        <div class="error-container">
            <p>{errorMsg}</p>
            <VariantButton onclick={() => load(courseId)}
                >Reintentar</VariantButton
            >
        </div>
    {:else if summary}
        <DataGrid
            items={summary.files}
            searchPlaceholder="Buscar en repositorio..."
            searchKeys={["filename"]}
        >
            {#snippet card({ item })}
                {@render fileCard(item, handleDelete)}
            {/snippet}
        </DataGrid>

        {#if isTeacher && reportsList.length > 0}
            <div class="teacher-section">
                <DataGrid
                    items={reportsList}
                    searchPlaceholder="Buscar en reportes..."
                    searchKeys={["filename"]}
                >
                    {#snippet card({ item })}
                        {@render fileCard(item, handleDeleteReport)}
                    {/snippet}
                </DataGrid>
            </div>
        {/if}
    {/if}

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
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .title {
        color: var(--primary-color);
    }

    .teacher-section {
        border-top: 2px dashed var(--border-color);
    }

    .hidden-input {
        display: none;
    }

    .inline-error {
        color: var(--error-color);
        font-size: 0.85rem;
        margin: 0.25rem 0 0;
    }

    .loader-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-color);
        margin-top: 1rem;
    }

    .error-container {
        border-color: var(--error-container-color);
        color: var(--error-color);
    }

    .file-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--white);
        text-align: center;
        cursor: pointer;
        font-family: var(--font-body);
        width: 100%;
    }

    .file-card:hover {
        background-color: var(--primary-container-color);
    }

    .delete-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 50%;
        background-color: var(--error-container-color);
        color: var(--error-color);
        font-size: 1rem;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-icon {
        position: relative;
        width: 48px;
        height: 48px;
        color: var(--primary-color);
    }

    .file-ext {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.5rem;
        font-weight: 700;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        padding: 1px 4px;
        border-radius: var(--radius);
    }

    .file-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-color);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .file-size {
        font-size: 0.75rem;
        color: var(--border-color);
    }

    .quota-widget {
        align-self: flex-end;
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 260px;
        background-color: var(--primary-container-color);
        padding: 10px 14px;
        border-radius: var(--radius);
        margin-top: 0.5rem;
    }

    .quota-label {
        font-size: 0.78rem;
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
        font-size: 0.72rem;
        color: var(--primary-color);
    }

    .right-options-wrap {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
</style>
