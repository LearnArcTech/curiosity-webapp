<script lang="ts">
    import type { TextBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        block: TextBlockSpec;
    }
    const { block }: Props = $props();
</script>

<p class="ex-text">{block.text}</p>

<style>
    .ex-text {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.92rem;
        line-height: 1.6;
        color: var(--text-color);
        white-space: pre-wrap;
    }
</style>
