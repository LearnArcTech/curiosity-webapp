<script lang="ts">
    import Card from "$lib/components/basic/card.svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { marked } from "marked";
    import sanitizeHtml from "sanitize-html";
    import { helpContent } from "$lib/assets/help-assets";

    import {
        School,
        Login,
        Category,
        DocumentScanner,
        MeetingRoom,
        Widgets,
    } from "@material-symbols-svg/svelte/w400";

    const tutorials = [
        { id: "t1", title: "Cómo crear un curso", icon: School },
        { id: "t2", title: "Cómo iniciar sesión", icon: Login },
        { id: "t3", title: "Tipos de sesiones", icon: Category },
    ];
    const guides = [
        {
            id: "g1",
            title: "Utilizando el escáner de notas",
            icon: DocumentScanner,
        },
        {
            id: "g2",
            title: "Manual de salones para estudiantes",
            icon: MeetingRoom,
        },
        { id: "g3", title: "Tipo de uso de widgets dinámicos", icon: Widgets },
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
    h2 {
        color: var(--text-color);
        font-size: 1.4rem;
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
    }
    :global(.tile) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.5rem;
    }

    :global(.tile) span {
        color: var(--text-color);
        font-size: 0.85rem;
    }

    .help-article {
        color: var(--text-color);
        line-height: 1.6;
        overflow-y: auto;
        max-height: 60vh;
    }
    .help-article :global(h1) {
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
    }
    .help-article :global(h2) {
        font-size: 1.2rem;
        margin: 1rem 0 0.5rem;
    }
    .help-article :global(p) {
        margin-bottom: 0.75rem;
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
</style>
