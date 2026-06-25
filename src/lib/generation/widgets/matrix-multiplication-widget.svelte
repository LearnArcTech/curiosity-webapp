<script lang="ts">
    import {
        ChevronLeft,
        ChevronRight,
        Refresh,
        Shuffle,
    } from "@material-symbols-svg/svelte";
    import type { MatrixMultiplicationBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: MatrixMultiplicationBlockSpec;
    }
    const { config }: Props = $props();

    const HARD_MAX = 6;

    function clamp(n: number, min: number, max: number): number {
        if (!Number.isFinite(n)) return min;
        return Math.min(Math.max(Math.round(n), min), max);
    }

    const maxSize = clamp(config.maxSize ?? 3, 1, HARD_MAX);
    const editable = config.editable ?? true;

    function buildMatrix(
        rows: number,
        cols: number,
        seed?: number[][],
    ): number[][] {
        const m: number[][] = [];
        for (let i = 0; i < rows; i++) {
            const row: number[] = [];
            for (let j = 0; j < cols; j++) {
                const v = seed?.[i]?.[j];
                row.push(typeof v === "number" && Number.isFinite(v) ? v : 0);
            }
            m.push(row);
        }
        return m;
    }

    function resize(
        matrix: number[][],
        rows: number,
        cols: number,
    ): number[][] {
        const next: number[][] = [];
        for (let i = 0; i < rows; i++) {
            const row: number[] = [];
            for (let j = 0; j < cols; j++) {
                row.push(matrix[i]?.[j] ?? 0);
            }
            next.push(row);
        }
        return next;
    }

    const seedA = buildMatrix(
        clamp(config.matrixA?.rows ?? 2, 1, maxSize),
        clamp(config.matrixA?.cols ?? config.matrixB?.rows ?? 2, 1, maxSize),
        config.matrixA?.values,
    );
    const seedB = buildMatrix(
        clamp(config.matrixB?.rows ?? config.matrixA?.cols ?? 2, 1, maxSize),
        clamp(config.matrixB?.cols ?? 2, 1, maxSize),
        config.matrixB?.values,
    );

    let rowsA = $state(seedA.length);
    let inner = $state(seedA[0]?.length ?? 1);
    let colsB = $state(seedB[0]?.length ?? 1);

    let A = $state(buildMatrix(rowsA, inner, seedA));
    let B = $state(buildMatrix(inner, colsB, seedB));

    let currentStep = $state(0);
    let maxRevealed = $state(0);

    function restartWalkthrough() {
        currentStep = 0;
        maxRevealed = 0;
    }

    function setRowsA(value: number) {
        rowsA = clamp(value, 1, maxSize);
        A = resize(A, rowsA, inner);
        restartWalkthrough();
    }

    function setInner(value: number) {
        inner = clamp(value, 1, maxSize);
        A = resize(A, rowsA, inner);
        B = resize(B, inner, colsB);
        restartWalkthrough();
    }

    function setColsB(value: number) {
        colsB = clamp(value, 1, maxSize);
        B = resize(B, inner, colsB);
        restartWalkthrough();
    }

    function randomize() {
        A = A.map((row) => row.map(() => Math.floor(Math.random() * 11) - 5));
        B = B.map((row) => row.map(() => Math.floor(Math.random() * 11) - 5));
        restartWalkthrough();
    }

    function resetValues() {
        A = resize(seedA, rowsA, inner);
        B = resize(seedB, inner, colsB);
        restartWalkthrough();
    }

    interface Step {
        i: number;
        j: number;
        terms: { a: number; b: number }[];
        sum: number;
    }

    let steps = $derived.by((): Step[] => {
        const out: Step[] = [];
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                const terms: { a: number; b: number }[] = [];
                let sum = 0;
                for (let k = 0; k < inner; k++) {
                    const a = A[i]?.[k] ?? 0;
                    const b = B[k]?.[j] ?? 0;
                    terms.push({ a, b });
                    sum += a * b;
                }
                out.push({ i, j, terms, sum });
            }
        }
        return out;
    });

    $effect(() => {
        const lastIndex = Math.max(0, steps.length - 1);
        if (currentStep > lastIndex) currentStep = lastIndex;
        if (maxRevealed > lastIndex) maxRevealed = lastIndex;
    });

    let activeStep = $derived(steps[currentStep]);

    function next() {
        if (currentStep < steps.length - 1) {
            currentStep++;
            if (currentStep > maxRevealed) maxRevealed = currentStep;
        }
    }
    function prev() {
        if (currentStep > 0) currentStep--;
    }

    function cellIndex(i: number, j: number): number {
        return i * colsB + j;
    }

    function isRevealed(i: number, j: number): boolean {
        return cellIndex(i, j) <= maxRevealed;
    }

    function resultValue(i: number, j: number): number {
        return steps.find((s) => s.i === i && s.j === j)?.sum ?? 0;
    }
</script>

<div class="mm-widget">
    {#if config.title}
        <p class="mm-title">{config.title}</p>
    {/if}

    <div class="mm-size-controls">
        <label>
            Filas de A
            <input
                type="number"
                min="1"
                max={maxSize}
                value={rowsA}
                onchange={(e) => setRowsA(Number(e.currentTarget.value))}
            />
        </label>
        <label>
            Cols A / Filas B
            <input
                type="number"
                min="1"
                max={maxSize}
                value={inner}
                onchange={(e) => setInner(Number(e.currentTarget.value))}
            />
        </label>
        <label>
            Cols de B
            <input
                type="number"
                min="1"
                max={maxSize}
                value={colsB}
                onchange={(e) => setColsB(Number(e.currentTarget.value))}
            />
        </label>
    </div>

    <div class="mm-operands">
        <div class="mm-matrix">
            <p class="mm-matrix-label">A</p>
            <div
                class="mm-grid"
                style="grid-template-columns: repeat({inner}, 2.4em);"
            >
                {#each A as row, i (i)}
                    {#each row as cell, j (j)}
                        <input
                            class="mm-cell"
                            class:highlight={activeStep && activeStep.i === i}
                            type="number"
                            disabled={!editable}
                            bind:value={A[i][j]}
                        />
                    {/each}
                {/each}
            </div>
        </div>

        <span class="mm-op">&times;</span>

        <div class="mm-matrix">
            <p class="mm-matrix-label">B</p>
            <div
                class="mm-grid"
                style="grid-template-columns: repeat({colsB}, 2.4em);"
            >
                {#each B as row, i (i)}
                    {#each row as cell, j (j)}
                        <input
                            class="mm-cell"
                            class:highlight={activeStep && activeStep.j === j}
                            type="number"
                            disabled={!editable}
                            bind:value={B[i][j]}
                        />
                    {/each}
                {/each}
            </div>
        </div>

        <span class="mm-op">=</span>

        <div class="mm-matrix">
            <p class="mm-matrix-label">Resultado</p>
            <div
                class="mm-grid"
                style="grid-template-columns: repeat({colsB}, 2.4em);"
            >
                {#each { length: rowsA } as _, i (i)}
                    {#each { length: colsB } as _, j (j)}
                        <div
                            class="mm-cell mm-result-cell"
                            class:highlight={activeStep &&
                                activeStep.i === i &&
                                activeStep.j === j}
                        >
                            {isRevealed(i, j) ? resultValue(i, j) : "?"}
                        </div>
                    {/each}
                {/each}
            </div>
        </div>
    </div>

    {#if activeStep}
        <div class="mm-breakdown">
            <p class="mm-breakdown-title">
                Paso {currentStep + 1} de {steps.length} — fila {activeStep.i +
                    1} de A &times; columna
                {activeStep.j + 1} de B
            </p>
            <p class="mm-breakdown-formula">
                {activeStep.terms.map((t) => `(${t.a} × ${t.b})`).join(" + ")}
                {" = "}
                {activeStep.terms.map((t) => t.a * t.b).join(" + ")}
                {" = "}
                <strong>{activeStep.sum}</strong>
            </p>
        </div>
    {/if}

    <div class="mm-controls">
        <button
            type="button"
            class="mm-icon-btn"
            onclick={prev}
            disabled={currentStep === 0}
            aria-label="Paso anterior"
        >
            <ChevronLeft size={16} />
        </button>
        <span class="mm-step-count"
            >Paso {currentStep + 1} / {steps.length}</span
        >
        <button
            type="button"
            class="mm-icon-btn"
            onclick={next}
            disabled={currentStep === steps.length - 1}
            aria-label="Paso siguiente"
        >
            <ChevronRight size={16} />
        </button>

        {#if editable}
            <span class="mm-controls-spacer"></span>
            <button type="button" class="mm-text-btn" onclick={randomize}>
                <Shuffle size={15} />
                Aleatorizar
            </button>
            <button type="button" class="mm-text-btn" onclick={resetValues}>
                <Refresh size={15} />
                Reiniciar
            </button>
        {/if}
    </div>
</div>

<style>
    .mm-widget {
        display: flex;
        flex-direction: column;
        gap: 11px;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--neutral-surface);
    }
    .mm-title {
        margin: 0;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-color);
    }
    .mm-size-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .mm-size-controls label {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-family: var(--font-body);
        font-size: 0.68rem;
        color: var(--text-color);
        opacity: 0.85;
    }
    .mm-size-controls input {
        width: 3.4em;
        font-family: var(--font-body);
        font-size: 0.8rem;
        padding: 3px 5px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--neutral-surface);
        color: var(--text-color);
    }
    .mm-operands {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }
    .mm-matrix {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    .mm-matrix-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary-color);
    }
    .mm-grid {
        display: grid;
        gap: 4px;
    }
    .mm-cell {
        width: 2.4em;
        height: 2.1em;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.82rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--neutral-surface);
        color: var(--text-color);
        padding: 0;
    }
    .mm-cell:disabled {
        opacity: 0.85;
        background-color: var(--neutral-surface-variant);
    }
    .mm-cell.highlight {
        border-color: var(--primary-color);
        background-color: var(--primary-container-color);
    }
    .mm-result-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--secondary-color);
        background-color: var(--neutral-surface-variant);
    }
    .mm-result-cell.highlight {
        border-color: var(--secondary-color);
        background-color: var(--secondary-container-color);
    }
    .mm-op {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--text-color);
        flex-shrink: 0;
    }
    .mm-breakdown {
        border-radius: var(--radius);
        background-color: var(--neutral-surface-variant);
        padding: 9px 11px;
        text-align: center;
    }
    .mm-breakdown-title {
        margin: 0 0 4px 0;
        font-family: var(--font-body);
        font-size: 0.72rem;
        color: var(--primary-color);
    }
    .mm-breakdown-formula {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.85rem;
        color: var(--text-color);
        word-break: break-word;
    }
    .mm-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    .mm-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background-color: var(--neutral-surface);
        color: var(--primary-color);
        cursor: pointer;
    }
    .mm-icon-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }
    .mm-step-count {
        font-family: var(--font-body);
        font-size: 0.74rem;
        color: var(--text-color);
        opacity: 0.8;
        min-width: 64px;
        text-align: center;
    }
    .mm-controls-spacer {
        width: 1px;
        height: 18px;
        background-color: var(--border-color);
        opacity: 0.6;
    }
    .mm-text-btn {
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
