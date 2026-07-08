<script lang="ts">
    import { page } from "$app/state";
    import {
        repository,
        reports,
        type RepositorySummary,
        type FileRow,
    } from "$lib/api";
    import {
        cacheFile,
        removeCachedFile,
        listCachedIds,
    } from "$lib/offline-files";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";
    import RepositoryFileTable from "$lib/components/page-specific/repository-file-table.svelte";

    let { data } = $props();
    let isTeacher = $derived(data?.user?.role === "teacher");

    let courseId = $derived(page.params.courseId ?? "");

    let summary = $state<RepositorySummary | null>(null);
    let reportsList = $state<FileRow[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    let selectedFile = $state<FileRow | null>(null);
    let previewOpen = $state(false);

    type OfflineStatus = "idle" | "downloading" | "downloaded";
    let offlineState = $state<
        Record<string, { status: OfflineStatus; progress: number }>
    >({});
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

    async function syncOfflineState(cId: string, files: FileRow[]) {
        const downloadedIds = await listCachedIds(cId);
        const next: Record<
            string,
            { status: OfflineStatus; progress: number }
        > = {};
        for (const f of files) {
            const existing = offlineState[f.id];
            next[f.id] =
                existing?.status === "downloading"
                    ? existing
                    : downloadedIds.has(f.id)
                      ? { status: "downloaded", progress: 100 }
                      : { status: "idle", progress: 0 };
        }
        offlineState = next;
    }

    async function load(cId: string) {
        loading = true;
        errorMsg = "";
        try {
            summary = await repository.list(cId);

            if (isTeacher) {
                reportsList = await reports.list(cId);
            }

            await syncOfflineState(cId, [...summary.files, ...reportsList]);
        } catch (err: any) {
            console.error("Repository load failure:", err);
            errorMsg = err.message || "No se pudo cargar el repositorio.";
        } finally {
            loading = false;
        }
    }

    async function startDownload(file: FileRow) {
        const cId = courseId;
        if (!cId || !file.storage_path) return;
        if (offlineState[file.id]?.status !== "idle") return;

        offlineState = {
            ...offlineState,
            [file.id]: { status: "downloading", progress: 0 },
        };

        try {
            const url = await repository.getFileUrl(file.storage_path);
            const res = await fetch(url);
            if (!res.ok || !res.body) {
                throw new Error("No se pudo descargar el archivo.");
            }

            const total =
                file.file_size ||
                Number(res.headers.get("content-length")) ||
                0;
            const reader = res.body.getReader();
            const chunks: Uint8Array<ArrayBuffer>[] = [];
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const copy = new Uint8Array(new ArrayBuffer(value.byteLength));
                copy.set(value);
                chunks.push(copy);
                received += value.length;
                offlineState = {
                    ...offlineState,
                    [file.id]: {
                        status: "downloading",
                        progress: total
                            ? Math.min(99, (received / total) * 100)
                            : 0,
                    },
                };
            }

            const blob = new Blob(chunks, {
                type: file.file_type || "application/octet-stream",
            });
            await cacheFile(cId, file.id, blob, file.file_type);

            offlineState = {
                ...offlineState,
                [file.id]: { status: "downloaded", progress: 100 },
            };
        } catch (err: any) {
            console.error("Download failure:", err);
            errorMsg = err.message || "No se pudo descargar el archivo.";
            offlineState = {
                ...offlineState,
                [file.id]: { status: "idle", progress: 0 },
            };
        }
    }

    async function removeDownload(file: FileRow) {
        const cId = courseId;
        if (!cId) return;
        try {
            await removeCachedFile(cId, file.id);
            offlineState = {
                ...offlineState,
                [file.id]: { status: "idle", progress: 0 },
            };
        } catch (err: any) {
            console.error("Remove download failure:", err);
            errorMsg = err.message || "No se pudo quitar la descarga.";
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
    <div class="header-wrap">
        <h1 class="title">Administrador de descargas</h1>

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
    </div>

    <div class="content-area">
        <PageStatus
            {loading}
            error={errorMsg}
            loadingMessage="Cargando archivos..."
            onRetry={() => load(courseId)}
        >
            {#snippet children()}
                {#if summary}
                    <RepositoryFileTable
                        items={summary.files}
                        fileColumnLabel="Archivo"
                        searchPlaceholder="Buscar en repositorio..."
                        {offlineState}
                        {formatBytes}
                        onPreview={openPreview}
                        onDownload={startDownload}
                        onRemove={removeDownload}
                    />

                    {#if isTeacher && reportsList.length > 0}
                        <div class="teacher-section">
                            <RepositoryFileTable
                                items={reportsList}
                                fileColumnLabel="Archivo de Reporte"
                                searchPlaceholder="Buscar en reportes..."
                                {offlineState}
                                {formatBytes}
                                onPreview={openPreview}
                                onDownload={startDownload}
                                onRemove={removeDownload}
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

    .title {
        color: var(--primary-color);
    }

    .header-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
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
</style>
