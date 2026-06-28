<script lang="ts">
    import { ChevronLeft, ChevronRight } from "@material-symbols-svg/svelte";
    import type { GaussianEliminationBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: GaussianEliminationBlockSpec;
    }
    const { config }: Props = $props();

    interface GStep {
        matrix: number[][];
        desc: string;
        pivotRow?: number;
        targetRow?: number;
        phase: "init" | "elim" | "back" | "done";
        solution?: (number | null)[];
    }

    function r6(x: number): number {
        return Math.round(x * 1e6) / 1e6;
    }
    function fmt(n: number): string {
        if (!Number.isFinite(n)) return "?";
        if (Math.abs(n) < 1e-8) return "0";
        if (Number.isInteger(n)) return String(n);
        return (Math.round(n * 1000) / 1000).toString();
    }

    function buildInitMatrix(): number[][] {
        const { rows, cols, values } = config.augmented;
        return Array.from({ length: rows }, (_, i) =>
            Array.from({ length: cols }, (_, j) => values?.[i]?.[j] ?? 0),
        );
    }

    function computeAllSteps(init: number[][]): GStep[] {
        const steps: GStep[] = [];
        const n = init.length;
        const aug = init.length;
        const m = init.map((row) => row.map(r6));

        steps.push({
            matrix: m.map((r) => [...r]),
            desc: "Matriz aumentada inicial [A|b]",
            phase: "init",
        });

        // Forward elimination
        for (let k = 0; k < n; k++) {
            // Partial pivot
            let maxRow = k;
            for (let i = k + 1; i < n; i++) {
                if (Math.abs(m[i][k]) > Math.abs(m[maxRow][k])) maxRow = i;
            }
            if (maxRow !== k) {
                [m[k], m[maxRow]] = [m[maxRow], m[k]];
                steps.push({
                    matrix: m.map((r) => [...r]),
                    desc: `Pivoteo: F${k + 1} ↔ F${maxRow + 1}`,
                    pivotRow: k,
                    targetRow: maxRow,
                    phase: "elim",
                });
            }

            if (Math.abs(m[k][k]) < 1e-10) continue;

            for (let i = k + 1; i < n; i++) {
                if (Math.abs(m[i][k]) < 1e-10) continue;
                const factor = r6(m[i][k] / m[k][k]);
                for (let j = 0; j < m[0].length; j++)
                    m[i][j] = r6(m[i][j] - factor * m[k][j]);
                const sign = factor > 0 ? "−" : "+";
                const absF = fmt(Math.abs(factor));
                steps.push({
                    matrix: m.map((r) => [...r]),
                    desc: `F${i + 1} ← F${i + 1} ${sign} ${absF !== "1" ? absF + "·" : ""}F${k + 1}`,
                    pivotRow: k,
                    targetRow: i,
                    phase: "elim",
                });
            }
        }

        // Check singular
        for (let i = 0; i < n; i++) {
            if (Math.abs(m[i][i]) < 1e-10) {
                steps.push({
                    matrix: m.map((r) => [...r]),
                    desc: "Sistema sin solución única (matriz singular)",
                    phase: "done",
                });
                return steps;
            }
        }

        // Back substitution
        const x: number[] = new Array(n).fill(0);
        const xPartial: (number | null)[] = new Array(n).fill(null);
        for (let i = n - 1; i >= 0; i--) {
            let val = m[i][m[0].length - 1];
            for (let j = i + 1; j < n; j++) val -= m[i][j] * x[j];
            x[i] = r6(val / m[i][i]);
            xPartial[i] = x[i];
            steps.push({
                matrix: m.map((r) => [...r]),
                desc: `Sustitución hacia atrás: x${i + 1} = ${fmt(x[i])}`,
                pivotRow: i,
                phase: "back",
                solution: [...xPartial],
            });
        }

        steps.push({
            matrix: m.map((r) => [...r]),
            desc:
                "Solución: " +
                x.map((v, i) => `x${i + 1} = ${fmt(v)}`).join(", "),
            phase: "done",
            solution: [...x],
        });

        return steps;
    }

    const initMatrix = buildInitMatrix();
    const allSteps = computeAllSteps(initMatrix);
    const n = initMatrix.length;
    const augCols = initMatrix[0]?.length ?? 0;

    let step = $state(0);
    const cur = $derived(allSteps[step]);
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="matrix-area">
        <div class="aug-wrap">
            {#each cur.matrix as row, i (i)}
                <div
                    class="aug-row"
                    class:pivot={cur.pivotRow === i}
                    class:target={cur.targetRow === i}
                >
                    {#each row as val, j (j)}
                        {#if j === augCols - 1}
                            <span class="sep">|</span>
                        {/if}
                        <div class="aug-cell">{fmt(val)}</div>
                    {/each}
                </div>
            {/each}
        </div>

        {#if cur.solution}
            <div class="sol-wrap">
                <p class="sol-title">Solución</p>
                {#each cur.solution as val, i (i)}
                    <div class="sol-row">
                        <span class="sol-var">x<sub>{i + 1}</sub></span>
                        <span class="sol-eq">=</span>
                        <span class="sol-val"
                            >{val !== null ? fmt(val) : "?"}</span
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <div class="desc-box" class:done={cur.phase === "done"}>
        {#if cur.pivotRow !== undefined}
            <span class="phase-tag" class:back={cur.phase === "back"}>
                {cur.phase === "back" ? "Sustitución" : "Eliminación"}
            </span>
        {/if}
        {cur.desc}
    </div>

    <div class="nav-row">
        <button
            class="icon-btn"
            onclick={() => (step = Math.max(0, step - 1))}
            disabled={step === 0}
        >
            <ChevronLeft size={16} />
        </button>
        <span class="step-count">Paso {step + 1} / {allSteps.length}</span>
        <button
            class="icon-btn"
            onclick={() => (step = Math.min(allSteps.length - 1, step + 1))}
            disabled={step === allSteps.length - 1}
        >
            <ChevronRight size={16} />
        </button>
    </div>
</div>

<style>
    .widget {
        display: flex;
        flex-direction: column;
        gap: 11px;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface);
    }
    .title {
        margin: 0;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-color);
    }
    .matrix-area {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
        justify-content: center;
    }
    .aug-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-family: var(--font-body);
        font-size: 0.84rem;
    }
    .aug-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: var(--radius);
        transition: background 0.15s;
    }
    .aug-row.pivot {
        background: var(--primary-container-color);
    }
    .aug-row.target {
        background: var(--secondary-container-color);
    }
    .aug-cell {
        width: 3em;
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--text-color);
    }
    .sep {
        color: var(--border-color);
        font-weight: 700;
        margin: 0 2px;
    }
    .sol-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 12px;
        background: var(--secondary-container-color);
        border-radius: var(--radius);
        min-width: 80px;
    }
    .sol-title {
        margin: 0 0 4px 0;
        font-family: var(--font-body);
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--secondary-color);
    }
    .sol-row {
        display: flex;
        align-items: baseline;
        gap: 5px;
        font-family: var(--font-body);
        font-size: 0.84rem;
    }
    .sol-var {
        color: var(--primary-color);
        font-weight: 600;
        min-width: 1.5em;
    }
    .sol-eq {
        color: var(--text-color);
        opacity: 0.6;
    }
    .sol-val {
        font-weight: 700;
        color: var(--secondary-color);
    }
    .desc-box {
        background: var(--neutral-surface-variant);
        border-radius: var(--radius);
        padding: 8px 11px;
        font-family: var(--font-body);
        font-size: 0.83rem;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .desc-box.done {
        background: var(--primary-container-color);
        color: var(--primary-color);
        font-weight: 600;
    }
    .phase-tag {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: var(--primary-color);
        color: var(--white);
        padding: 2px 6px;
        border-radius: var(--radius);
        flex-shrink: 0;
    }
    .phase-tag.back {
        background: var(--secondary-color);
    }
    .nav-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background: var(--neutral-surface);
        color: var(--primary-color);
        cursor: pointer;
    }
    .icon-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .step-count {
        font-family: var(--font-body);
        font-size: 0.74rem;
        color: var(--text-color);
        opacity: 0.8;
        min-width: 80px;
        text-align: center;
    }
</style>
