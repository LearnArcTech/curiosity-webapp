<script lang="ts">
    import { Info, Lightbulb, Warning } from "@material-symbols-svg/svelte";
    import type { CalloutBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        block: CalloutBlockSpec;
    }
    const { block }: Props = $props();

    const variant = block.variant ?? "info";
</script>

<div
    class="ex-callout"
    class:tip={variant === "tip"}
    class:warning={variant === "warning"}
>
    <span class="icon">
        {#if variant === "tip"}
            <Lightbulb size={18} />
        {:else if variant === "warning"}
            <Warning size={18} />
        {:else}
            <Info size={18} />
        {/if}
    </span>
    <p>{block.text}</p>
</div>

<style>
    .ex-callout {
        display: flex;
        gap: 9px;
        align-items: flex-start;
        padding: 10px 12px;
        border-radius: var(--radius);
        border: 1px solid var(--primary-color);
        background-color: var(--primary-container-color);
        color: var(--text-color);
    }
    .ex-callout.tip {
        border-color: var(--secondary-color);
        background-color: var(--secondary-container-color);
    }
    .ex-callout.warning {
        border-color: var(--error-color);
        background-color: var(--error-container-color);
    }
    .icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        margin-top: 1px;
        color: var(--primary-color);
    }
    .ex-callout.tip .icon {
        color: var(--secondary-color);
    }
    .ex-callout.warning .icon {
        color: var(--error-color);
    }
    p {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.88rem;
        line-height: 1.55;
    }
</style>
