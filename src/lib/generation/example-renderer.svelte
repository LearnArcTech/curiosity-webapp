<script lang="ts">
    import type { ExampleSpec } from "$lib/generation/sharedTypes";
    import HeadingBlock from "./blocks/heading-block.svelte";
    import TextBlock from "./blocks/text-block.svelte";
    import CalloutBlock from "./blocks/callout-block.svelte";
    import DividerBlock from "./blocks/divider-block.svelte";
    import StepSequenceBlock from "./blocks/step-sequence-block.svelte";
    import MatrixMultiplicationWidget from "./widgets/matrix-multiplication-widget.svelte";
    import MatrixArithmeticWidget from "./widgets/matrix-arithmetic-widget.svelte";
    import DeterminantWidget from "./widgets/determinant-widget.svelte";
    import GaussianEliminationWidget from "./widgets/gaussian-elimination-widget.svelte";
    import MatrixInverseWidget from "./widgets/matrix-inverse-widget.svelte";
    import VectorOperationsWidget from "./widgets/vector-operations-widget.svelte";
    import LinearTransformWidget from "./widgets/linear-transform-widget.svelte";
    import LUDecompositionWidget from "./widgets/lu-decomposition-widget.svelte";
    import EigenvalueWidget from "./widgets/eigenvalue-widget.svelte";
    import CustomBlock from "./blocks/custom-block.svelte";

    interface Props {
        spec: ExampleSpec;
    }
    const { spec }: Props = $props();
</script>

<div class="example-renderer">
    <header class="example-header">
        <p class="example-title">{spec.title}</p>
        {#if spec.description}
            <p class="example-description">{spec.description}</p>
        {/if}
    </header>
    <div class="example-blocks">
        {#each spec.blocks as block, i (i)}
            {#if block.type === "heading"}
                <HeadingBlock {block} />
            {:else if block.type === "text"}
                <TextBlock {block} />
            {:else if block.type === "callout"}
                <CalloutBlock {block} />
            {:else if block.type === "divider"}
                <DividerBlock />
            {:else if block.type === "step-sequence"}
                <StepSequenceBlock {block} />
            {:else if block.type === "matrix-multiplication"}
                <MatrixMultiplicationWidget config={block} />
            {:else if block.type === "matrix-arithmetic"}
                <MatrixArithmeticWidget config={block} />
            {:else if block.type === "determinant"}
                <DeterminantWidget config={block} />
            {:else if block.type === "gaussian-elimination"}
                <GaussianEliminationWidget config={block} />
            {:else if block.type === "matrix-inverse"}
                <MatrixInverseWidget config={block} />
            {:else if block.type === "vector-operations"}
                <VectorOperationsWidget config={block} />
            {:else if block.type === "linear-transform"}
                <LinearTransformWidget config={block} />
            {:else if block.type === "lu-decomposition"}
                <LUDecompositionWidget config={block} />
            {:else if block.type === "eigenvalue"}
                <EigenvalueWidget config={block} />
            {:else if block.type === "custom"}
                <CustomBlock {block} />
            {/if}
        {/each}
    </div>
</div>

<style>
    .example-renderer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }
    .example-header {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .example-title {
        margin: 0;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--text-color);
    }
    .example-description {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.82rem;
        color: var(--text-color);
        opacity: 0.85;
    }
    .example-blocks {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
</style>
