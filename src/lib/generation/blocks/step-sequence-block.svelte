<script lang="ts">
    import { ChevronLeft, ChevronRight } from "@material-symbols-svg/svelte";
    import type { StepSequenceBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        block: StepSequenceBlockSpec;
    }
    const { block }: Props = $props();

    let current = $state(0);
    const total = block.steps.length;

    function next() {
        if (current < total - 1) current++;
    }
    function prev() {
        if (current > 0) current--;
    }

    let activeStep = $derived(block.steps[current]);
</script>

<div class="ex-steps">
    {#if block.title}
        <p class="ex-steps-title">{block.title}</p>
    {/if}

    {#if activeStep}
        <div class="ex-step-card">
            <p class="ex-step-heading">
                Paso {current + 1} de {total}:
                <strong>{activeStep.title}</strong>
            </p>
            <p class="ex-step-content">{activeStep.content}</p>
        </div>
    {/if}

    <div class="ex-steps-nav">
        <button
            type="button"
            onclick={prev}
            disabled={current === 0}
            aria-label="Paso anterior"
        >
            <ChevronLeft size={18} />
        </button>
        <div class="dots">
            {#each block.steps as _, i (i)}
                <span class="dot" class:active={i === current}></span>
            {/each}
        </div>
        <button
            type="button"
            onclick={next}
            disabled={current === total - 1}
            aria-label="Paso siguiente"
        >
            <ChevronRight size={18} />
        </button>
    </div>
</div>

<style>
    .ex-steps {
        display: flex;
        flex-direction: column;
        gap: 9px;
    }
    .ex-steps-title {
        margin: 0;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.92rem;
        color: var(--text-color);
    }
    .ex-step-card {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--neutral-surface-variant);
        padding: 12px 14px;
        min-height: 64px;
    }
    .ex-step-heading {
        margin: 0 0 6px 0;
        font-family: var(--font-body);
        font-size: 0.78rem;
        color: var(--primary-color);
    }
    .ex-step-content {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.9rem;
        line-height: 1.55;
        color: var(--text-color);
        white-space: pre-wrap;
    }
    .ex-steps-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
    }
    .ex-steps-nav button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background-color: var(--neutral-surface);
        color: var(--primary-color);
        cursor: pointer;
        transition: opacity 0.15s;
    }
    .ex-steps-nav button:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .dots {
        display: flex;
        gap: 6px;
    }
    .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--border-color);
        opacity: 0.5;
    }
    .dot.active {
        background-color: var(--primary-color);
        opacity: 1;
    }
</style>
