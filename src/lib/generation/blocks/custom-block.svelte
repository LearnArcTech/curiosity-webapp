<script lang="ts">
    import type { CustomBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        block: CustomBlockSpec;
    }
    const { block }: Props = $props();

    const themeVars = `
        <style>
            :root {
                --primary-color: #2e628c;
                --primary-container-color: #cee5ff;
                --secondary-color: #0a6b5a;
                --secondary-container-color: #a1f2dc;
                --text-color: #000000;
                --border-color: #72777f;
                --error-color: #ba1a1a;
                --neutral-surface: #ffffff;
                --neutral-surface-variant: #d5dbdc;
                --font-display: system-ui, sans-serif;
                --font-body: system-ui, sans-serif;
                --radius: 2px;
                body {
                    font-family: var(--font-body);
                    margin: 0;
                    padding: 12px;
                    box-sizing: border-box;
                    background: transparent;
                }
            }
        </style>
    `;

    const injectedHtml = block.html.includes("</head>")
        ? block.html.replace("</head>", `${themeVars}</head>`)
        : themeVars + block.html;

    const height = block.height ?? 300;
</script>

<div class="custom-wrap">
    {#if block.title}
        <p class="custom-label">✦ {block.title}</p>
    {/if}
    <iframe
        srcdoc={injectedHtml}
        sandbox="allow-scripts"
        width="100%"
        {height}
        scrolling="auto"
        title={block.title ?? "Ejemplo interactivo"}
        frameborder="0"
        class="custom-frame"
    ></iframe>
</div>

<style>
    .custom-wrap {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        overflow: hidden;
    }
    .custom-label {
        margin: 0;
        padding: 6px 10px;
        font-family: var(--font-body);
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-color);
        background: var(--primary-container-color);
        border-bottom: 1px solid var(--border-color);
    }
    .custom-frame {
        display: block;
        border: none;
    }
</style>
