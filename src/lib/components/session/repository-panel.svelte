<script lang="ts">
    import { repository, type FileRow, type Role } from "$lib/api";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { CloudUpload, Delete, Send } from "@material-symbols-svg/svelte";
    import { untrack } from "svelte";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import AlertDialog from "$lib/components/dialog/alert-dialog.svelte";
    import type { ExampleSpec } from "$lib/generation/sharedTypes";
    import { tryParseExampleSpec } from "$lib/generation/utils";

    interface Props {
        courseId: string;
        userRole: Role | null;
        onSendExample?: (spec: ExampleSpec) => void;
    }
    const { courseId, userRole, onSendExample }: Props = $props();

    let files = $state<FileRow[]>([]);
    let quotaUsed = $state(0);
    let quotaTotal = $state(1);
    let loading = $state(true);
    let uploading = $state(false);
    let errorMsg = $state<string | null>(null);
    let inputEl: HTMLInputElement | undefined = $state(undefined);

    let alertMsg = $state("");
    let alertOpen = $state(false);
    let confirmDeleteOpen = $state(false);
    let pendingDeleteId = $state("");
    let pendingDeleteName = $state("");

    let sendingId = $state<string | null>(null);

    function isExampleFile(f: FileRow) {
        return (
            f.file_type === "application/json" ||
            f.filename.toLowerCase().endsWith(".json")
        );
    }

    const pct = $derived(
        quotaTotal > 0 ? Math.min(100, (quotaUsed / quotaTotal) * 100) : 0,
    );

    $effect(() => {
        if (!courseId) return;
        const currentCourseId = courseId;
        let unsubscribe: (() => void) | undefined;
        untrack(() => {
            load();

            unsubscribe = repository.subscribe(currentCourseId, () => {
                load();
            });
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    });

    async function load() {
        if (files.length === 0) loading = true;
        errorMsg = null;
        try {
            const s = await repository.list(courseId);
            files = s.files;
            quotaUsed = s.quota_used;
            quotaTotal = s.quota_total;
        } catch (e: any) {
            errorMsg = e.message ?? "Error al cargar el repositorio.";
        } finally {
            loading = false;
        }
    }

    async function onUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        uploading = true;
        try {
            await repository.add(courseId, file);
            await load();
        } catch (err: any) {
            alertMsg = "Error al subir: " + err.message;
            alertOpen = true;
        } finally {
            uploading = false;
            if (inputEl) inputEl.value = "";
        }
    }

    function del(id: string, name: string) {
        pendingDeleteId = id;
        pendingDeleteName = name;
        confirmDeleteOpen = true;
    }

    async function sendToStage(f: FileRow) {
        if (!onSendExample || sendingId) return;
        if (!f.storage_path) {
            alertMsg = `"${f.filename}" todavía no tiene un archivo asociado.`;
            alertOpen = true;
            return;
        }

        sendingId = f.id;
        try {
            const url = await repository.getFileUrl(f.storage_path);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`fetch ${res.status}`);
            const text = await res.text();

            const spec = tryParseExampleSpec(text);
            if (!spec) {
                try {
                    JSON.parse(text);
                    alertMsg = `"${f.filename}" no tiene el formato de ejemplo esperado.`;
                } catch {
                    alertMsg = `"${f.filename}" no es un JSON válido.`;
                }
                alertOpen = true;
                return;
            }

            onSendExample(spec);
        } catch (e: any) {
            alertMsg = "Error al enviar el ejemplo: " + e.message;
            alertOpen = true;
        } finally {
            sendingId = null;
        }
    }

    async function handleDeleteConfirm() {
        confirmDeleteOpen = false;
        try {
            await repository.remove(pendingDeleteId);
            await load();
        } catch (e: any) {
            alertMsg = "Error: " + e.message;
            alertOpen = true;
        }
    }

    function fmtSize(b: number) {
        if (b < 1024) return `${b} B`;
        if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1024 ** 2).toFixed(1)} MB`;
    }

    function icon(type: string | null) {
        if (!type) return "📄";
        if (type.startsWith("image/")) return "🖼️";
        if (type === "application/pdf") return "📕";
        if (
            type.includes("sheet") ||
            type.includes("excel") ||
            type === "text/csv"
        )
            return "📊";
        if (type.includes("presenta") || type.includes("powerpoint"))
            return "📑";
        if (type.includes("word") || type.includes("document")) return "📝";
        if (type.startsWith("video/")) return "🎬";
        if (type.startsWith("audio/")) return "🎵";
        if (type.includes("zip") || type.includes("compress")) return "🗜️";
        return "📄";
    }
</script>

<div class="panel">
    <div class="header">
        <span class="title">Repositorio</span>
        {#if userRole === "teacher"}
            <button
                type="button"
                class="up-btn"
                onclick={() => inputEl?.click()}
                disabled={uploading}
                aria-busy={uploading}
            >
                {#if uploading}
                    <WaveLoader size={13} />
                    <span class="visually-hidden">Subiendo archivo...</span>
                {:else}
                    <CloudUpload size={15} aria-hidden="true" /> Subir
                {/if}
            </button>
            <label class="visually-hidden" for="repo-file-input"
                >Subir archivo</label
            >
            <input
                type="file"
                id="repo-file-input"
                bind:this={inputEl}
                onchange={onUpload}
                class="visually-hidden"
            />
        {:else}
            <span class="readonly-tag">Solo lectura</span>
        {/if}
    </div>

    <div class="quota">
        <div
            class="track"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Espacio de almacenamiento usado"
        >
            <div class="fill" style="width:{pct}%" class:warn={pct > 80}></div>
        </div>
        <span class="qlabel">
            {fmtSize(quotaUsed)} / {fmtSize(quotaTotal)}
            {#if pct > 80}(casi lleno){/if}
        </span>
    </div>

    <div class="file-list">
        {#if loading}
            <div class="center" role="status">
                <WaveLoader size={20} />
                <span class="visually-hidden">Cargando archivos...</span>
            </div>
        {:else if errorMsg}
            <p class="msg err" role="alert">{errorMsg}</p>
        {:else if files.length === 0}
            <p class="msg">
                {userRole === "teacher"
                    ? "No hay archivos. Sube el primero."
                    : "El docente no ha subido archivos aún."}
            </p>
        {:else}
            {#each files as f (f.id)}
                <div class="file-row">
                    <span class="ficon" aria-hidden="true"
                        >{icon(f.file_type)}</span
                    >
                    <div class="finfo">
                        <span class="fname" title={f.filename}
                            >{f.filename}</span
                        >
                        <span class="fmeta">{fmtSize(f.file_size)}</span>
                    </div>
                    {#if userRole === "teacher"}
                        <button
                            type="button"
                            class="del"
                            onclick={() => del(f.id, f.filename)}
                            aria-label="Eliminar {f.filename}"
                        >
                            <Delete size={15} aria-hidden="true" />
                        </button>
                    {/if}
                    {#if onSendExample && userRole === "teacher" && isExampleFile(f)}
                        <button
                            type="button"
                            class="send"
                            onclick={() => sendToStage(f)}
                            disabled={sendingId === f.id}
                            aria-label="Enviar {f.filename} a la sesión"
                            aria-busy={sendingId === f.id}
                        >
                            {#if sendingId === f.id}
                                <WaveLoader size={13} />
                            {:else}
                                <Send size={15} aria-hidden="true" />
                            {/if}
                        </button>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    <ConfirmDialog
        bind:open={confirmDeleteOpen}
        title="Eliminar archivo"
        onAccept={handleDeleteConfirm}
        onCancel={() => (confirmDeleteOpen = false)}
    >
        {#snippet content()}
            <p>¿Eliminar "<strong>{pendingDeleteName}</strong>"?</p>
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
</div>

<style>
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--background-color-dark);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 0.8rem;
        border-bottom: var(--border-width) solid var(--border-color);
        flex-shrink: 0;
    }

    .title {
        flex: 1;
        font-family: var(--font-display);
        font-size: calc(0.78rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
        text-transform: uppercase;
    }

    .up-btn {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        border: none;
        border-radius: var(--radius);
        padding: 0.3rem 0.625rem;
        font-size: calc(0.76rem * var(--font-scale));
        font-family: var(--font-body);
        cursor: pointer;
        transition: filter var(--motion-duration);
    }
    .up-btn:hover:not(:disabled) {
        filter: brightness(1.15);
    }
    .up-btn:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
    }
    .up-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .readonly-tag {
        font-size: calc(0.68rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.6;
        background-color: var(--neutral-surface-variant);
        padding: 0.2rem 0.44rem;
        border-radius: var(--radius);
    }

    .quota {
        padding: 0.44rem 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        border-bottom: var(--border-width) solid var(--border-color);
        flex-shrink: 0;
    }

    .track {
        height: 0.1875rem;
        background-color: var(--neutral-surface-variant);
        border-radius: 2px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background-color: var(--primary-color);
        border-radius: 2px;
        transition: width var(--motion-duration) ease;
    }
    .fill.warn {
        background-color: var(--error-color);
    }

    .qlabel {
        font-size: calc(0.67rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.55;
    }

    .file-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.44rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: var(--text-color-light) transparent;
    }

    .center {
        display: flex;
        justify-content: center;
        padding: 1.4rem;
    }

    .msg {
        font-size: calc(0.78rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.5;
        text-align: center;
        padding: 1.1rem 0.625rem;
        margin: 0;
    }
    .msg.err {
        color: var(--error-color);
        opacity: 1;
    }

    .file-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.44rem 0.56rem;
        background-color: var(--neutral-surface-variant);
        border-radius: var(--radius);
        transition: filter var(--motion-duration);
    }
    .file-row:hover {
        filter: brightness(1.1);
    }

    .ficon {
        font-size: calc(1rem * var(--font-scale));
        flex-shrink: 0;
    }

    .finfo {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.0625rem;
    }

    .fname {
        font-size: calc(0.79rem * var(--font-scale));
        color: var(--text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fmeta {
        font-size: calc(0.67rem * var(--font-scale));
        color: var(--text-color);
        opacity: 0.55;
    }

    .del,
    .send {
        background: none;
        border: none;
        color: var(--text-color);
        opacity: 0.5;
        cursor: pointer;
        padding: 0.2rem;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        transition:
            color var(--motion-duration),
            opacity var(--motion-duration),
            background-color var(--motion-duration);
    }
    .del:hover {
        color: var(--error-color);
        opacity: 1;
        background-color: var(--error-container-color);
    }
    .del:focus-visible,
    .send:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
        opacity: 1;
    }
    .send:hover:not(:disabled) {
        color: var(--primary-color);
        opacity: 1;
        background-color: var(--primary-container-color);
    }
    .send:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
</style>
