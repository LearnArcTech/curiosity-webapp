<script lang="ts">
    import {
        ChevronLeft,
        ChevronRight,
        Shuffle,
        Refresh,
    } from "@material-symbols-svg/svelte";
    import type { LUDecompositionBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: LUDecompositionBlockSpec;
    }
    const { config }: Props = $props();

    const editable = config.editable ?? true;

    function r6(x: number): number {
        return Math.round(x * 1e6) / 1e6;
    }
    function safe(v: unknown): number {
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    function fmt(n: number): string {
        if (!Number.isFinite(n)) return "?";
        if (Math.abs(n) < 1e-8) return "0";
        if (Number.isInteger(n)) return String(n);
        for (let q = 2; q <= 12; q++) {
            const p = Math.round(n * q);
            if (Math.abs(p / q - n) < 1e-8) return `${p}/${q}`;
        }
        return (Math.round(n * 1000) / 1000).toString();
    }
    function buildMat(n: number, seed?: number[][]): number[][] {
        return Array.from({ length: n }, (_, i) =>
            Array.from(
                { length: n },
                (_, j) => seed?.[i]?.[j] ?? (i === j ? 2 : 1),
            ),
        );
    }
    function identity(n: number): number[][] {
        return Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
        );
    }
    function zeroMat(n: number): number[][] {
        return Array.from({ length: n }, () => new Array(n).fill(0));
    }

    let size = $state<2 | 3>(config.matrix?.rows === 3 ? 3 : 2);
    let M = $state(buildMat(size, config.matrix?.values));
    let step = $state(0);

    function setSize(n: 2 | 3) {
        size = n;
        M = buildMat(n, M);
        step = 0;
    }
    function randomize() {
        let tries = 0;
        do {
            M = buildMat(size).map((r) =>
                r.map(() => Math.floor(Math.random() * 7) - 1),
            );
            tries++;
        } while (Math.abs(computeDet()) < 0.5 && tries < 20);
        step = 0;
    }
    function reset() {
        M = buildMat(size, config.matrix?.values);
        step = 0;
    }

    function computeDet(): number {
        const n = size;
        if (n === 2)
            return (
                safe(M[0][0]) * safe(M[1][1]) - safe(M[0][1]) * safe(M[1][0])
            );
        return (
            safe(M[0][0]) *
                (safe(M[1][1]) * safe(M[2][2]) -
                    safe(M[1][2]) * safe(M[2][1])) -
            safe(M[0][1]) *
                (safe(M[1][0]) * safe(M[2][2]) -
                    safe(M[1][2]) * safe(M[2][0])) +
            safe(M[0][2]) *
                (safe(M[1][0]) * safe(M[2][1]) - safe(M[1][1]) * safe(M[2][0]))
        );
    }

    interface LUStep {
        L: number[][];
        U: number[][];
        desc: string;
        col: number;
    }

    // Doolittle LU without pivoting (show note if singular)
    function luSteps(A: number[][]): { steps: LUStep[]; singular: boolean } {
        const n = A.length;
        const L = identity(n);
        const U = A.map((r) => r.map(safe));
        const steps: LUStep[] = [];
        let singular = false;

        steps.push({
            L: L.map((r) => [...r]),
            U: U.map((r) => [...r]),
            desc: "Inicializar L = I, U = A",
            col: -1,
        });

        for (let k = 0; k < n; k++) {
            if (Math.abs(U[k][k]) < 1e-10) {
                singular = true;
                break;
            }
            for (let i = k + 1; i < n; i++) {
                const factor = r6(U[i][k] / U[k][k]);
                L[i][k] = factor;
                for (let j = k; j < n; j++)
                    U[i][j] = r6(U[i][j] - factor * U[k][j]);
            }
            steps.push({
                L: L.map((r) => [...r]),
                U: U.map((r) => [...r]),
                desc: `Columna ${k + 1}: calcular L[:,${k + 1}] y U[${k + 1},:]`,
                col: k,
            });
        }

        return { steps, singular };
    }

    // Multiply two n×n matrices
    function matMul(X: number[][], Y: number[][]): number[][] {
        const n = X.length;
        return Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) =>
                r6(
                    X[i].reduce(
                        (s, _, k) => s + safe(X[i][k]) * safe(Y[k][j]),
                        0,
                    ),
                ),
            ),
        );
    }

    const luResult = $derived.by(() => luSteps(M));
    const allSteps = $derived(luResult.steps);
    const singular = $derived(luResult.singular);
    const curStep = $derived(allSteps[step] ?? allSteps[0]);
    const verify = $derived(matMul(curStep.L, curStep.U));

    const maxStep = $derived(allSteps.length - 1);
    $effect(() => {
        if (step > maxStep) step = maxStep;
    });
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="top-row">
        <div class="size-toggle">
            <button class:active={size === 2} onclick={() => setSize(2)}
                >2 × 2</button
            >
            <button class:active={size === 3} onclick={() => setSize(3)}
                >3 × 3</button
            >
        </div>
        {#if editable}
            <span class="spacer"></span>
            <button class="text-btn" onclick={randomize}
                ><Shuffle size={14} /> Aleatorizar</button
            >
            <button class="text-btn" onclick={reset}
                ><Refresh size={14} /> Reiniciar</button
            >
        {/if}
    </div>

    <div class="matrices-row">
        <!-- A input -->
        <div class="mx-panel">
            <p class="mx-label">A (entrada)</p>
            <div
                class="grid"
                style="grid-template-columns: repeat({size}, 2.8em)"
            >
                {#each M as row, i (i)}
                    {#each row as _, j (j)}
                        <input
                            class="cell"
                            type="number"
                            disabled={!editable}
                            bind:value={M[i][j]}
                        />
                    {/each}
                {/each}
            </div>
        </div>

        <span class="eq-sym">=</span>

        {#if singular}
            <div class="singular-msg">
                Requiere pivoteo — el algoritmo básico no aplica directamente.
            </div>
        {:else}
            <!-- L -->
            <div class="mx-panel">
                <p class="mx-label">L (triangular inferior)</p>
                <div
                    class="grid"
                    style="grid-template-columns: repeat({size}, 2.8em)"
                >
                    {#each curStep.L.flat() as v, k (k)}
                        {@const i = Math.floor(k / size)}
                        {@const j = k % size}
                        <div
                            class="cell static"
                            class:hl-diag={i === j}
                            class:hl-factor={curStep.col >= 0 &&
                                j === curStep.col &&
                                i > curStep.col}
                            class:zero={j > i}
                        >
                            {j > i ? "0" : fmt(v)}
                        </div>
                    {/each}
                </div>
            </div>

            <span class="eq-sym">·</span>

            <!-- U -->
            <div class="mx-panel">
                <p class="mx-label">U (triangular superior)</p>
                <div
                    class="grid"
                    style="grid-template-columns: repeat({size}, 2.8em)"
                >
                    {#each curStep.U.flat() as v, k (k)}
                        {@const i = Math.floor(k / size)}
                        {@const j = k % size}
                        <div
                            class="cell static"
                            class:hl-pivot={curStep.col >= 0 &&
                                i === curStep.col &&
                                j >= curStep.col}
                            class:zero={j < i}
                        >
                            {j < i ? "0" : fmt(v)}
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Verify -->
            {#if step === maxStep}
                <div class="verify">
                    <p class="mx-label">L·U =</p>
                    <div
                        class="grid"
                        style="grid-template-columns: repeat({size}, 2.8em)"
                    >
                        {#each verify.flat() as v, k (k)}
                            <div class="cell static verify-cell">{fmt(v)}</div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>

    {#if !singular}
        <div class="desc-box">{curStep.desc}</div>

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
                onclick={() => (step = Math.min(maxStep, step + 1))}
                disabled={step === maxStep}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    {/if}
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
    .top-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }
    .spacer {
        flex: 1;
    }
    .size-toggle {
        display: flex;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        overflow: hidden;
    }
    .size-toggle button {
        padding: 4px 12px;
        font-family: var(--font-body);
        font-size: 0.78rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color);
    }
    .size-toggle button.active {
        background: var(--primary-color);
        color: var(--white);
    }
    .matrices-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .mx-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }
    .mx-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--primary-color);
        text-align: center;
    }
    .eq-sym {
        font-family: var(--font-display);
        font-size: 1.2rem;
        color: var(--text-color);
    }
    .grid {
        display: grid;
        gap: 4px;
    }
    .cell {
        width: 2.8em;
        height: 2.1em;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.8rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface);
        color: var(--text-color);
        padding: 0;
    }
    .cell:disabled {
        opacity: 0.85;
        background: var(--neutral-surface-variant);
    }
    .cell.static {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--neutral-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        font-family: var(--font-body);
        font-size: 0.8rem;
        color: var(--text-color);
    }
    .cell.zero {
        opacity: 0.35;
    }
    .cell.hl-diag {
        background: var(--neutral-surface-variant);
        font-weight: 700;
    }
    .cell.hl-factor {
        background: var(--secondary-container-color);
        border-color: var(--secondary-color);
        color: var(--secondary-color);
        font-weight: 700;
    }
    .cell.hl-pivot {
        background: var(--primary-container-color);
        border-color: var(--primary-color);
    }
    .verify {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }
    .verify-cell {
        background: var(--secondary-container-color) !important;
        color: var(--secondary-color) !important;
        font-weight: 700;
    }
    .singular-msg {
        padding: 10px;
        background: var(--error-container-color);
        color: var(--error-color);
        border-radius: var(--radius);
        font-family: var(--font-body);
        font-size: 0.82rem;
        font-weight: 600;
    }
    .desc-box {
        background: var(--neutral-surface-variant);
        border-radius: var(--radius);
        padding: 8px 11px;
        font-family: var(--font-body);
        font-size: 0.83rem;
        color: var(--text-color);
        text-align: center;
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
    .text-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: var(--font-body);
        font-size: 0.72rem;
        color: var(--primary-color);
        background: none;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 4px 8px;
        cursor: pointer;
    }
</style>
