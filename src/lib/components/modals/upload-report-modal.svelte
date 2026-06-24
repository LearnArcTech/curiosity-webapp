<script lang="ts">
    import Dialog from "$lib/components/basic/dialog.svelte";
    import { reports } from "$lib/api";
    import {
        Upload,
        Camera,
        ArrowLeft,
        WandStars,
        Check,
    } from "@material-symbols-svg/svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Tesseract from "tesseract.js";
    import * as XLSX from "xlsx";

    let {
        open = $bindable(false),
        courseId,
        onUploadSuccess,
    } = $props<{
        open: boolean;
        courseId: string;
        onUploadSuccess: () => void;
    }>();

    type ModalStep = "select" | "image-options" | "uploading";
    let currentStep = $state<ModalStep>("select");

    let selectedFile = $state<File | null>(null);
    let isImage = $state(false);
    let applyOcr = $state(true);
    let isDragOver = $state(false);
    let errorMessage = $state("");

    let fileInput: HTMLInputElement;
    let cameraInput: HTMLInputElement;

    function reset() {
        selectedFile = null;
        isImage = false;
        currentStep = "select";
        errorMessage = "";
    }

    $effect(() => {
        if (!open) reset();
    });

    function handleFileSelection(file: File, context: "file" | "camera") {
        selectedFile = file;
        isImage = file.type.startsWith("image/");

        if (isImage) {
            currentStep = "image-options";
        } else {
            uploadFileDirectly(file);
        }
    }

    function onFileDrop(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0], "file");
        }
    }

    function onFileSelected(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            handleFileSelection(target.files[0], "file");
        }
    }

    async function uploadFileDirectly(file: File) {
        currentStep = "uploading";
        errorMessage = "";
        try {
            if (isImage && applyOcr) {
                const { file_id: imageId } = await reports.upload(
                    courseId,
                    file,
                    file.name,
                );
                const worker = await Tesseract.createWorker("spa");
                const {
                    data: { text },
                } = await worker.recognize(file);
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
                const excelFilename =
                    file.name.replace(/\.[^/.]+$/, "") + "_procesado.xlsx";
                await reports.upload(courseId, excelBlob, excelFilename, true);
                await reports.markAsProcessed(imageId);
            } else {
                await reports.upload(courseId, file, file.name);
            }

            onUploadSuccess();
            open = false;
        } catch (err: any) {
            errorMessage = err.message || "Error al procesar la carga.";
            currentStep = isImage ? "image-options" : "select";
        }
    }
</script>

<input
    type="file"
    bind:this={fileInput}
    onchange={onFileSelected}
    accept="image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    style="display: none;"
/>

<input
    type="file"
    bind:this={cameraInput}
    onchange={onFileSelected}
    capture="environment"
    accept="image/*"
    style="display: none;"
/>

<Dialog
    bind:open
    title={currentStep === "image-options"
        ? "Configurar Reporte"
        : "Importar reporte"}
>
    {#if currentStep === "image-options"}
        <VariantButton onclick={reset}>
            <ArrowLeft size={26} />Volver
        </VariantButton>
    {/if}

    {#if currentStep === "select"}
        <div
            class="dropzone {isDragOver ? 'drag-active' : ''}"
            ondragover={(e) => {
                e.preventDefault();
                isDragOver = true;
            }}
            ondragleave={() => (isDragOver = false)}
            ondrop={onFileDrop}
            onclick={() => fileInput.click()}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && fileInput.click()}
        >
            <div class="dropzone-content">
                <Upload size={36} />
                <p>Arrastra un archivo aquí o da click para subir uno</p>
            </div>
        </div>

        <VariantButton onclick={() => cameraInput.click()}>
            <Camera size={18} />
            Usar cámara
        </VariantButton>
    {:else if currentStep === "image-options" && selectedFile}
        <div class="options-panel">
            <div class="file-preview-card">
                <div class="file-info">
                    <p class="file-name">{selectedFile.name}</p>
                    <p class="file-meta">
                        Imagen detectada - {(selectedFile.size / 1024).toFixed(
                            1,
                        )} KB
                    </p>
                </div>
            </div>

            <div class="ocr-toggle-box">
                <label class="toggle-container">
                    <input type="checkbox" bind:checked={applyOcr} />
                    <div class="custom-checkbox">
                        {#if applyOcr}<Check size={14} />{/if}
                    </div>
                    <div class="toggle-text">
                        <span class="toggle-title">
                            <WandStars size={16} />
                            Aplicar Reconocimiento OCR
                        </span>
                        <span class="toggle-desc"
                            >Extrae automáticamente las notas del documento y
                            genera un cuadro Excel sincronizado.</span
                        >
                    </div>
                </label>
            </div>

            {#if errorMessage}
                <p class="error-text">{errorMessage}</p>
            {/if}

            <VariantButton onclick={() => uploadFileDirectly(selectedFile!)}>
                Procesar e Importar
            </VariantButton>
        </div>
    {:else if currentStep === "uploading"}
        <div class="loading-state">
            <WaveLoader size={32} />
            <p>Subiendo archivo y estructurando registros...</p>
        </div>
    {/if}
</Dialog>

<style>
    /* Your existing CSS exactly as provided */
    .dropzone {
        width: 100%;
        background-color: var(--secondary-container-color);
        border: 2px dashed var(--secondary-color);
        border-radius: var(--radius);
        padding: 2.5rem 1.5rem;
        text-align: center;
        cursor: pointer;
    }

    .dropzone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .dropzone-content p {
        font-size: 1.15rem;
        font-weight: 500;
        color: var(--secondary-color);
        margin: 0;
        line-height: 1.4;
    }

    .options-panel {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        width: 100%;
    }

    .file-preview-card {
        background: var(--white);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 12px;
    }

    .file-name {
        font-weight: 500;
        color: var(--text-color);
        margin: 0;
        word-break: break-all;
    }

    .file-meta {
        font-size: 0.8rem;
        color: var(--text-color);
        margin: 4px 0 0 0;
    }

    .ocr-toggle-box {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 14px;
        background: var(--white);
    }

    .toggle-container {
        display: flex;
        gap: 12px;
        cursor: pointer;
    }

    .toggle-container input {
        display: none;
    }

    .custom-checkbox {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--white);
        flex-shrink: 0;
    }

    .toggle-container input:checked + .custom-checkbox {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }

    .toggle-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .toggle-title {
        font-weight: 600;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .toggle-desc {
        font-size: 0.8rem;
        color: var(--text-color);
        line-height: 1.3;
    }

    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        gap: 12px;
        color: var(--text-color);
    }

    .error-text {
        color: var(--error-color);
        font-size: 0.85rem;
        margin: 0;
    }
</style>
