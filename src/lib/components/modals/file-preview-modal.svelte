<script lang="ts">
    import { untrack } from "svelte";
    import type { FileRow } from "$lib/api";
    import { repository } from "$lib/api";
    import { getCachedBlob } from "$lib/offline-files";
    import { Close, Download } from "@material-symbols-svg/svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    import { tryParseExampleSpec } from "$lib/generation/utils";
    import type { ExampleSpec } from "$lib/generation/sharedTypes";
    import ExampleRenderer from "$lib/generation/example-renderer.svelte";

    let {
        file,
        courseId,
        open = $bindable(false),
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

    let parsedSpec = $state<ExampleSpec | null>(null);
    let viewMode = $state<"rendered" | "raw">("rendered");

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
        parsedSpec = null;
        viewMode = "rendered";
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
                if (
                    targetFile.file_type === "application/json" ||
                    targetFile.filename.toLowerCase().endsWith(".json")
                ) {
                    parsedSpec = tryParseExampleSpec(textContent);
                }
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

{#if file}
    <Dialog title={file.filename} bind:open maxWidth="700px">
        {#snippet header()}
            <h2 id="dialog-title" class="modal-title" title={file.filename}>
                {file.filename}
            </h2>
            <button
                class="close-btn"
                type="button"
                onclick={onClose}
                aria-label="Cerrar"
            >
                <Close size={18} />
            </button>
        {/snippet}
        {#snippet children()}
            <div class="modal-body">
                {#if loading}
                    <div role="status">
                        <WaveLoader size={40}></WaveLoader>
                        <p class="status-text">Cargando vista previa...</p>
                    </div>
                {:else if errorMsg}
                    <p class="status-text error" role="alert">{errorMsg}</p>
                {:else if !file.storage_path}
                    <p class="status-text">
                        El archivo aún se está procesando.
                    </p>
                {:else}
                    {#if parsedSpec}
                        <div class="view-toggle" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={viewMode === "rendered"}
                                class:active={viewMode === "rendered"}
                                onclick={() => (viewMode = "rendered")}
                            >
                                Vista previa
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={viewMode === "raw"}
                                class:active={viewMode === "raw"}
                                onclick={() => (viewMode = "raw")}
                            >
                                JSON
                            </button>
                        </div>
                    {/if}

                    {#if parsedSpec && viewMode === "rendered"}
                        <div class="example-preview-wrap">
                            <ExampleRenderer spec={parsedSpec} />
                        </div>
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
                {/if}

                {#if fromCache && !loading && !errorMsg}
                    <span class="cache-tag">Mostrando copia descargada</span>
                {/if}
            </div>
        {/snippet}
        {#snippet footer()}
            <VariantButton variant="secondary-dark" onclick={handleDownload}>
                <Download size={16} />
                Descargar
            </VariantButton>
        {/snippet}
    </Dialog>
{/if}

<style>
    .modal-title {
        flex: 1;
        font-size: calc(1rem * var(--font-scale));
        font-weight: 600;
        color: var(--primary-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        border-radius: var(--radius);
        transition: background-color var(--motion-duration);
    }

    .close-btn:hover {
        background-color: var(--primary-color);
        color: var(--primary-container-color);
    }

    .close-btn:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }

    .modal-body {
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
        font-size: calc(1rem * var(--font-scale));
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
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
    }

    .preview-text {
        width: 100%;
        max-height: 60vh;
        overflow: auto;
        background-color: var(--neutral-surface-variant);
        padding: 0.75rem;
        border-radius: var(--radius);
        font-size: calc(0.82rem * var(--font-scale));
        white-space: pre-wrap;
        word-break: break-word;
    }

    .cache-tag {
        font-size: calc(0.72rem * var(--font-scale));
        color: var(--secondary-color);
        font-style: italic;
    }

    .view-toggle {
        display: flex;
        gap: 2px;
        background-color: var(--neutral-surface-variant);
        border-radius: var(--radius);
        padding: 3px;
        align-self: flex-start;
    }

    .view-toggle button {
        border: none;
        background: transparent;
        padding: 0.3rem 0.75rem;
        font-size: calc(0.78rem * var(--font-scale));
        font-family: var(--font-body);
        color: var(--text-color);
        opacity: 0.65;
        border-radius: calc(var(--radius) - 2px);
        cursor: pointer;
        transition:
            background-color var(--motion-duration),
            opacity var(--motion-duration);
    }

    .view-toggle button:hover {
        opacity: 0.9;
    }

    .view-toggle button:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }

    .view-toggle button.active {
        background-color: var(--background-color);
        opacity: 1;
        font-weight: 600;
    }

    .example-preview-wrap {
        width: 100%;
        max-height: 60vh;
        overflow-y: auto;
        padding: 0.25rem 0.1rem;
    }
</style>
