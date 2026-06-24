<script lang="ts">
    import { untrack } from "svelte";
    import type { FileRow } from "$lib/api";
    import { repository } from "$lib/api";
    import { getCachedBlob } from "$lib/offline-files";
    import { Close, Download } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    let {
        file,
        courseId,
        open = false,
        onClose,
    }: {
        file: FileRow | null;
        courseId: string;
        open: boolean;
        onClose: () => void;
    } = $props();

    let objectUrl = $state<string | null>(null);
    let textContent = $state<string | null>(null);
    let loading = $state(false);
    let errorMsg = $state("");
    let fromCache = $state(false);

    const isImage = $derived(file?.file_type?.startsWith("image/") ?? false);
    const isText = $derived(
        (file?.file_type?.startsWith("text/") ||
            file?.file_type === "application/json") ??
            false,
    );
    const isPdf = $derived(file?.file_type === "application/pdf");

    let requestId = 0;

    function resetView() {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null;
        textContent = null;
        errorMsg = "";
        fromCache = false;
    }

    async function loadPreview(targetFile: FileRow, cId: string) {
        const myRequestId = ++requestId;
        resetView();

        if (!targetFile.storage_path) return;

        loading = true;
        try {
            const cached = await getCachedBlob(cId, targetFile.id);
            const blob =
                cached ?? (await fetchRemoteBlob(targetFile.storage_path));
            if (myRequestId !== requestId) return;

            const isImg = targetFile.file_type?.startsWith("image/") ?? false;
            const isTxt =
                targetFile.file_type?.startsWith("text/") ||
                targetFile.file_type === "application/json";
            const isPdfFile = targetFile.file_type === "application/pdf";

            fromCache = !!cached;

            if (isTxt) {
                textContent = await blob.text();
            } else if (isImg || isPdfFile) {
                objectUrl = URL.createObjectURL(blob);
            }
        } catch (err: any) {
            if (myRequestId !== requestId) return;
            console.error("Preview load failure:", err);
            errorMsg = err.message || "No se pudo cargar la vista previa.";
        } finally {
            if (myRequestId === requestId) loading = false;
        }
    }

    async function fetchRemoteBlob(storagePath: string): Promise<Blob> {
        const url = await repository.getFileUrl(storagePath);
        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo descargar el archivo.");
        return await res.blob();
    }

    async function handleDownload() {
        if (!file) return;
        try {
            const cached = await getCachedBlob(courseId, file.id);
            const blob = cached ?? (await fetchRemoteBlob(file.storage_path));
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Download failure:", err);
            errorMsg = err.message || "No se pudo descargar el archivo.";
        }
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    $effect(() => {
        const shouldLoad = open && !!file;
        const f = file;
        const cId = courseId;

        untrack(() => {
            if (shouldLoad && f) {
                loadPreview(f, cId);
            } else {
                requestId++;
                resetView();
            }
        });
    });
</script>

{#if open && file}
    <div class="overlay" onclick={handleOverlayClick} role="presentation">
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-label={file.filename}
        >
            <div class="modal-header">
                <span class="modal-title" title={file.filename}
                    >{file.filename}</span
                >
                <button
                    class="close-btn"
                    type="button"
                    onclick={onClose}
                    aria-label="Cerrar"
                >
                    <Close size={18} />
                </button>
            </div>

            <div class="modal-body">
                {#if loading}
                    <WaveLoader size={40}></WaveLoader>
                    <p class="status-text">Cargando vista previa...</p>
                {:else if errorMsg}
                    <p class="status-text error">{errorMsg}</p>
                {:else if !file.storage_path}
                    <p class="status-text">
                        El archivo aún se está procesando.
                    </p>
                {:else if isImage && objectUrl}
                    <img
                        src={objectUrl}
                        alt={file.filename}
                        class="preview-image"
                    />
                {:else if isPdf && objectUrl}
                    <iframe
                        src={objectUrl}
                        title={file.filename}
                        class="preview-pdf"
                    ></iframe>
                {:else if isText && textContent !== null}
                    <pre class="preview-text">{textContent}</pre>
                {:else}
                    <p class="status-text">
                        La vista previa no está disponible para este tipo de
                        archivo.
                    </p>
                {/if}

                {#if fromCache && !loading && !errorMsg}
                    <span class="cache-tag">Mostrando copia descargada</span>
                {/if}
            </div>

            <div class="modal-footer">
                <VariantButton
                    variant="secondary-dark"
                    onclick={handleDownload}
                >
                    <Download size={16} />
                    Descargar
                </VariantButton>
            </div>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1.5rem;
    }

    .modal {
        background-color: var(--white);
        border-radius: var(--radius);
        width: 100%;
        max-width: 700px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1rem;
        background-color: var(--primary-container-color);
    }

    .modal-title {
        flex: 1;
        font-weight: 600;
        color: var(--primary-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: var(--radius);
    }

    .close-btn:hover {
        background-color: var(--primary-color);
        color: var(--primary-container-color);
    }

    .modal-body {
        flex: 1;
        overflow: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        min-height: 200px;
    }

    .status-text {
        color: var(--text-color);
        margin: auto;
        text-align: center;
    }

    .status-text.error {
        color: var(--error-color);
    }

    .preview-image {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
        border-radius: var(--radius);
    }

    .preview-pdf {
        width: 100%;
        height: 60vh;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
    }

    .preview-text {
        width: 100%;
        max-height: 60vh;
        overflow: auto;
        background-color: var(--neutral-surface-variant);
        padding: 0.75rem;
        border-radius: var(--radius);
        font-size: 0.82rem;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .cache-tag {
        font-size: 0.72rem;
        color: var(--secondary-color);
        font-style: italic;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border-color);
    }
</style>
