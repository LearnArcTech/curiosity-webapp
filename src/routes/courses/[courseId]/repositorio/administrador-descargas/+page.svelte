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
    import DataTable from "$lib/components/data/data-table.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import FilePreviewModal from "$lib/components/modals/file-preview-modal.svelte";

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

{#snippet tableCell(row: any, column: any)}
    {#if column.key === "filename"}
        <button
            type="button"
            class="filename-cell"
            onclick={() => openPreview(row)}
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
                    onclick={() => startDownload(row)}
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
                    onclick={() => removeDownload(row)}
                >
                    Quitar
                </VariantButton>
            {/if}
        </div>
    {/if}
{/snippet}

<main>
    <div class="header-wrap">
        <h1 class="title">Administrador de descargas</h1>

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
    </div>

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
        <DataTable
            items={summary.files}
            columns={[
                { key: "filename", label: "Archivo" },
                {
                    key: "status",
                    label: "Estado",
                    align: "right",
                    width: "240px",
                },
            ]}
            searchPlaceholder="Buscar en repositorio..."
            searchKeys={["filename"]}
        >
            {#snippet cell({ row, column })}
                {@render tableCell(row, column)}
            {/snippet}
        </DataTable>

        {#if isTeacher && reportsList.length > 0}
            <div class="teacher-section">
                <DataTable
                    items={reportsList}
                    columns={[
                        { key: "filename", label: "Archivo de Reporte" },
                        {
                            key: "status",
                            label: "Estado",
                            align: "right",
                            width: "240px",
                        },
                    ]}
                    searchPlaceholder="Buscar en reportes..."
                    searchKeys={["filename"]}
                >
                    {#snippet cell({ row, column })}
                        {@render tableCell(row, column)}
                    {/snippet}
                </DataTable>
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

    .title {
        color: var(--primary-color);
    }

    .teacher-section {
        border-top: 2px dashed var(--border-color);
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
    }

    .filesize-text {
        font-size: 0.72rem;
        color: var(--border-color);
    }

    .status-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
    }

    .status-text {
        font-size: 0.82rem;
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

    .header-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
