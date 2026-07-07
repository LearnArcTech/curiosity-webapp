<script lang="ts">
    import Card from "$lib/components/basic/card.svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { marked } from "marked";
    import sanitizeHtml from "sanitize-html";
    import { helpContent } from "$lib/assets/help-assets";

    import {
        School,
        Sensors,
        Quiz,
        Category,
        FolderOpen,
        Widgets,
    } from "@material-symbols-svg/svelte/w400";

    const tutorials = [
        { id: "t1", title: "Cómo crear un curso", icon: School },
        { id: "t2", title: "Cómo iniciar una sesión en vivo", icon: Sensors },
        { id: "t3", title: "Cómo crear un Quiz", icon: Quiz },
    ];
    const guides = [
        { id: "g1", title: "Distribución del menú del curso", icon: Category },
        { id: "g2", title: "Uso del repositorio de archivos", icon: FolderOpen },
        { id: "g3", title: "Uso de widgets dinámicos", icon: Widgets },
    ];

    let dialogOpen = $state(false);
    let dialogTitle = $state("");
    let dialogHtml = $state("");

    const sanitizeOptions: sanitizeHtml.IOptions = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            "img",
            "h1",
            "h2",
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ["src", "alt", "title"],
        },
    };

    function openArticle(item: { id: string; title: string }) {
        const raw = helpContent[item.id];
        if (!raw) return;

        const parsedHtml = marked.parse(raw, { async: false }) as string;
        dialogHtml = sanitizeHtml(parsedHtml, sanitizeOptions);
        dialogTitle = item.title;
        dialogOpen = true;
    }
</script>

<section>
    <h2>Tutoriales</h2>
    <div class="grid">
        {#each tutorials as item (item.id)}
            <button
                type="button"
                class="tile-trigger"
                onclick={() => openArticle(item)}
            >
                <Card class="tile">
                    <div class="icon-wrap">
                        <item.icon size={32} />
                    </div>
                    <span>{item.title}</span>
                </Card>
            </button>
        {/each}
    </div>
</section>
<section>
    <h2>Guías</h2>
    <div class="grid">
        {#each guides as item (item.id)}
            <button
                type="button"
                class="tile-trigger"
                onclick={() => openArticle(item)}
            >
                <Card class="tile">
                    <div class="icon-wrap">
                        <item.icon size={32} />
                    </div>
                    <span>{item.title}</span>
                </Card>
            </button>
        {/each}
    </div>
</section>

<Dialog bind:open={dialogOpen} title={dialogTitle}>
    <div class="help-article">
        {@html dialogHtml}
    </div>
    {#snippet footer()}
        <VariantButton onclick={() => (dialogOpen = false)}>
            Cerrar
        </VariantButton>
    {/snippet}
</Dialog>

<style>
    :global([role="dialog"]) {
        max-width: 500px !important; 
        width: 90vw !important;
    }
    h2 {
        color: var(--text-color);
        font-size: calc(1.5rem * var(--font-scale));
        margin-bottom: 1rem;
    }
    section {
        margin-bottom: 2rem;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
    }
    .tile-trigger {
        all: unset;
        display: block;
        cursor: pointer;
        width: 100%;
        height: 100%;
    }
    :global(.tile) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        text-align: center;
        gap: 1rem;
        padding: 1.5rem 1rem;
        height: 100%;
        box-sizing: border-box;
    }
    :global(.tile) span {
        color: var(--text-color, #000000);
        font-size: calc(0.9rem * var(--font-scale));
        font-family: "DM Sans", sans-serif;
        line-height: 1.4;
    }
    :global(.tile) .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        margin-bottom: 0.5rem;
        color: var(--secondary-color);
    }
    .help-article {
        color: var(--text-color);
        line-height: 1.6;
        overflow-y: auto;
        max-height: 60vh;
    }
    .help-article :global(h1) {
        font-size: calc(1.5rem * var(--font-scale));
        margin-bottom: 0.75rem;
    }
    .help-article :global(h2) {
        font-size: calc(1.2rem * var(--font-scale));
        margin: 1rem 0 0.5rem;
    }
    .help-article :global(img) {
        max-width: 100%;
        border-radius: var(--radius);
    }
    .help-article :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 0.75rem;
    }
    .help-article :global(th),
    .help-article :global(td) {
        border: 1px solid var(--border-color);
        padding: 0.4rem 0.6rem;
        text-align: left;
    }
    .help-article :global(ol) {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin-bottom: 1rem;
    }
    .help-article :global(ul) {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-bottom: 1rem;
    }
    .help-article :global(li) {
        margin-bottom: 0.5rem;
        line-height: 1.5;
    }
    .help-article :global(p) {
        margin-bottom: 1rem;
        line-height: 1.5;
    }
    .help-article :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1rem;
    }
    .help-article :global(th) {
        background-color: var(--primary-container-color); /* Fondo claro */
        text-align: center;        /* Texto centrado */
        color: #295579;            /* Azul principal de Curiosity */
        font-weight: bold;
    }
    .help-article :global(tbody td:first-child) {
        background-color: var(--primary-container-color);
        text-align: center;
    }
</style>
