<script lang="ts">
    import { repository, type FileRow, type Role } from "$lib/api";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { CloudUpload, Delete } from "@material-symbols-svg/svelte";
    import { untrack } from "svelte";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import AlertDialog from "$lib/components/dialog/alert-dialog.svelte";

    interface Props {
        courseId: string;
        userRole: Role | null;
    }
    const { courseId, userRole }: Props = $props();

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
                class="up-btn"
                onclick={() => inputEl?.click()}
                disabled={uploading}
            >
                {#if uploading}
                    <WaveLoader size={13} />
                {:else}
                    <CloudUpload size={15} /> Subir
                {/if}
            </button>
            <input
                type="file"
                bind:this={inputEl}
                onchange={onUpload}
                style="display:none"
            />
        {:else}
            <span class="readonly-tag">Solo lectura</span>
        {/if}
    </div>

    <div class="quota">
        <div class="track">
            <div class="fill" style="width:{pct}%" class:warn={pct > 80}></div>
        </div>
        <span class="qlabel">{fmtSize(quotaUsed)} / {fmtSize(quotaTotal)}</span>
    </div>

    <div class="file-list">
        {#if loading}
            <div class="center"><WaveLoader size={20} /></div>
        {:else if errorMsg}
            <p class="msg err">{errorMsg}</p>
        {:else if files.length === 0}
            <p class="msg">
                {userRole === "teacher"
                    ? "No hay archivos. Sube el primero."
                    : "El docente no ha subido archivos aún."}
            </p>
        {:else}
            {#each files as f (f.id)}
                <div class="file-row">
                    <span class="ficon">{icon(f.file_type)}</span>
                    <div class="finfo">
                        <span class="fname" title={f.filename}
                            >{f.filename}</span
                        >
                        <span class="fmeta">{fmtSize(f.file_size)}</span>
                    </div>
                    {#if userRole === "teacher"}
                        <button
                            class="del"
                            onclick={() => del(f.id, f.filename)}
                            title="Eliminar"
                        >
                            <Delete size={15} />
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
    .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 13px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        flex-shrink: 0;
    }

    .title {
        flex: 1;
        font-family: var(--font-display);
        font-size: 0.78rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.75);
        text-transform: uppercase;
    }

    .up-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius);
        padding: 5px 10px;
        font-size: 0.76rem;
        font-family: var(--font-body);
        cursor: pointer;
        transition: background-color 0.13s;
    }
    .up-btn:hover:not(:disabled) {
        background-color: #3a7ab0;
    }
    .up-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .readonly-tag {
        font-size: 0.68rem;
        color: rgba(255, 255, 255, 0.3);
        background-color: rgba(255, 255, 255, 0.08);
        padding: 3px 7px;
        border-radius: var(--radius);
    }

    .quota {
        padding: 7px 13px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
    }

    .track {
        height: 3px;
        background-color: rgba(255, 255, 255, 0.11);
        border-radius: 2px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background-color: var(--primary-color);
        border-radius: 2px;
        transition: width 0.35s ease;
    }
    .fill.warn {
        background-color: #e67e22;
    }

    .qlabel {
        font-size: 0.67rem;
        color: rgba(255, 255, 255, 0.32);
    }

    .file-list {
        flex: 1;
        overflow-y: auto;
        padding: 7px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    }

    .center {
        display: flex;
        justify-content: center;
        padding: 22px;
    }

    .msg {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.3);
        text-align: center;
        padding: 18px 10px;
        margin: 0;
    }
    .msg.err {
        color: var(--error-color);
    }

    .file-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 9px;
        background-color: rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
        transition: background-color 0.12s;
    }
    .file-row:hover {
        background-color: rgba(255, 255, 255, 0.09);
    }

    .ficon {
        font-size: 1rem;
        flex-shrink: 0;
    }

    .finfo {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .fname {
        font-size: 0.79rem;
        color: rgba(255, 255, 255, 0.84);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fmeta {
        font-size: 0.67rem;
        color: rgba(255, 255, 255, 0.33);
    }

    .del {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.26);
        cursor: pointer;
        padding: 3px;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        transition:
            color 0.12s,
            background-color 0.12s;
    }
    .del:hover {
        color: var(--error-color);
        background-color: rgba(186, 26, 26, 0.14);
    }
</style>
