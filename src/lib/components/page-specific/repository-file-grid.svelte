<script lang="ts">
    import DataGrid from "$lib/components/data/data-grid.svelte";
    import { Description } from "@material-symbols-svg/svelte";
    import type { FileRow } from "$lib/api";

    let {
        items,
        isTeacher,
        searchPlaceholder = "Buscar en repositorio...",
        formatBytes,
        onPreview,
        onDelete,
    }: {
        items: FileRow[];
        isTeacher: boolean;
        searchPlaceholder?: string;
        formatBytes: (bytes: number) => string;
        onPreview: (file: FileRow) => void;
        onDelete: (id: string) => void;
    } = $props();

    function extOf(filename: string): string {
        const m = filename.match(/\.([a-zA-Z0-9]+)$/);
        return m ? m[1].toUpperCase() : "ARCH";
    }
</script>

<DataGrid {items} {searchPlaceholder} searchKeys={["filename"]}>
    {#snippet card({ item })}
        <button type="button" class="file-card" onclick={() => onPreview(item)}>
            {#if isTeacher}
                <!-- svelte-ignore node_invalid_placement_ssr -->
                <button
                    class="delete-btn"
                    type="button"
                    title="Eliminar archivo"
                    onclick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
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
</DataGrid>

<style>
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
        font-size: calc(1rem * var(--font-scale));
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
        font-size: calc(0.5rem * var(--font-scale));
        font-weight: 700;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        padding: 1px 4px;
        border-radius: var(--radius);
    }

    .file-name {
        font-size: calc(0.8rem * var(--font-scale));
        font-weight: 500;
        color: var(--text-color);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .file-size {
        font-size: calc(0.7em * var(--font-scale));
        color: var(--border-color);
    }
</style>
