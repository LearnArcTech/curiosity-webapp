<script lang="ts">
    import type { HeadingBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        block: HeadingBlockSpec;
    }
    const { block }: Props = $props();
</script>

{#if block.level === 1}
    <h2 class="ex-heading level-1">{block.text}</h2>
{:else if block.level === 3}
    <h4 class="ex-heading level-3">{block.text}</h4>
{:else}
    <h3 class="ex-heading level-2">{block.text}</h3>
{/if}

<style>
    .ex-heading {
        margin: 0;
        font-family: var(--font-display);
        color: var(--text-color);
        line-height: 1.3;
    }
    .level-1 {
        font-size: 1.25rem;
        font-weight: 700;
    }
    .level-2 {
        font-size: 1.05rem;
        font-weight: 700;
    }
    .level-3 {
        font-size: 0.92rem;
        font-weight: 600;
    }
</style>
