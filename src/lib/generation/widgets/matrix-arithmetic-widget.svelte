<script lang="ts">
    import { Shuffle, Refresh } from "@material-symbols-svg/svelte";
    import type { MatrixArithmeticBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: MatrixArithmeticBlockSpec;
    }
    const { config }: Props = $props();

    const HARD_MAX = 5;

    function clamp(n: number, lo: number, hi: number): number {
        return Math.min(
            Math.max(Number.isFinite(n) ? Math.round(n) : lo, lo),
            hi,
        );
    }
    function safe(v: number): number {
        return Number.isFinite(v) ? v : 0;
    }
    function fmt(n: number): string {
        if (Math.abs(n) < 1e-9) return "0";
        return Number.isInteger(n)
            ? String(n)
            : (Math.round(n * 1000) / 1000).toString();
    }
    function mat(r: number, c: number, seed?: number[][]): number[][] {
        return Array.from({ length: r }, (_, i) =>
            Array.from({ length: c }, (_, j) => seed?.[i]?.[j] ?? 0),
        );
    }

    const maxSz = clamp(config.maxSize ?? 4, 1, HARD_MAX);
    const editable = config.editable ?? true;
    let op = $state<"add" | "subtract">(config.operation ?? "add");

    const seedA = mat(
        clamp(config.matrixA.rows, 1, maxSz),
        clamp(config.matrixA.cols, 1, maxSz),
        config.matrixA.values,
    );
    const seedB = mat(
        clamp(config.matrixB.rows, 1, maxSz),
        clamp(config.matrixB.cols, 1, maxSz),
        config.matrixB.values,
    );

    let rows = $state(seedA.length);
    let cols = $state(seedA[0]?.length ?? 1);
    let A = $state(mat(rows, cols, seedA));
    let B = $state(mat(rows, cols, seedB));

    let hover = $state<[number, number] | null>(null);

    const C = $derived(
        A.map((row, i) =>
            row.map((a, j) => {
                const b = safe(B[i]?.[j] ?? 0);
                return op === "add" ? safe(a) + b : safe(a) - b;
            }),
        ),
    );

    function setDims(r: number, c: number) {
        rows = clamp(r, 1, maxSz);
        cols = clamp(c, 1, maxSz);
        A = mat(rows, cols, A);
        B = mat(rows, cols, B);
    }
    function randomize() {
        A = A.map((row) => row.map(() => Math.floor(Math.random() * 11) - 5));
        B = B.map((row) => row.map(() => Math.floor(Math.random() * 11) - 5));
    }
    function reset() {
        rows = seedA.length;
        cols = seedA[0]?.length ?? 1;
        A = mat(rows, cols, seedA);
        B = mat(rows, cols, seedB);
    }
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="top-row">
        <label class="dim-label">
            Filas
            <input
                type="number"
                min="1"
                max={maxSz}
                value={rows}
                onchange={(e) => setDims(Number(e.currentTarget.value), cols)}
            />
        </label>
        <label class="dim-label">
            Columnas
            <input
                type="number"
                min="1"
                max={maxSz}
                value={cols}
                onchange={(e) => setDims(rows, Number(e.currentTarget.value))}
            />
        </label>
        <span class="spacer"></span>
        <div class="op-toggle">
            <button class:active={op === "add"} onclick={() => (op = "add")}
                >A + B</button
            >
            <button
                class:active={op === "subtract"}
                onclick={() => (op = "subtract")}>A − B</button
            >
        </div>
    </div>

    <div class="operands">
        {#each [{ label: "A", data: A, setter: (i: number, j: number, v: number) => (A[i][j] = v) }, { label: "B", data: B, setter: (i: number, j: number, v: number) => (B[i][j] = v) }] as mx, mIdx (mIdx)}
            <div class="mx-wrap">
                <p class="mx-label">{mx.label}</p>
                <div
                    class="grid"
                    style="grid-template-columns: repeat({cols}, 2.4em)"
                >
                    {#each mx.data as row, i (i)}
                        {#each row as _, j (j)}
                            <input
                                class="cell"
                                class:hl={hover !== null &&
                                    hover[0] === i &&
                                    hover[1] === j}
                                type="number"
                                disabled={!editable}
                                bind:value={mx.data[i][j]}
                            />
                        {/each}
                    {/each}
                </div>
            </div>
            {#if mIdx === 0}
                <span class="op-sym">{op === "add" ? "+" : "−"}</span>
            {/if}
        {/each}

        <span class="op-sym">=</span>

        <div class="mx-wrap">
            <p class="mx-label">C</p>
            <div
                class="grid"
                style="grid-template-columns: repeat({cols}, 2.4em)"
            >
                {#each C as row, i (i)}
                    {#each row as val, j (j)}
                        <div
                            class="cell result"
                            class:hl-result={hover !== null &&
                                hover[0] === i &&
                                hover[1] === j}
                            role="gridcell"
                            onmouseenter={() => (hover = [i, j])}
                            onmouseleave={() => (hover = null)}
                        >
                            {fmt(val)}
                        </div>
                    {/each}
                {/each}
            </div>
        </div>
    </div>

    {#if hover}
        {@const i = hover[0]}
        {@const j = hover[1]}
        {@const a = safe(A[i]?.[j] ?? 0)}
        {@const b = safe(B[i]?.[j] ?? 0)}
        {@const res = op === "add" ? a + b : a - b}
        <div class="formula">
            C[{i + 1},{j + 1}] = {a}
            {op === "add" ? "+" : "−"}
            {op === "add" ? b : Math.abs(b)} = <strong>{fmt(res)}</strong>
        </div>
    {:else}
        <div class="formula dim">
            Pasa el cursor sobre una celda del resultado para ver la operación.
        </div>
    {/if}

    {#if editable}
        <div class="btn-row">
            <button class="text-btn" onclick={randomize}
                ><Shuffle size={14} /> Aleatorizar</button
            >
            <button class="text-btn" onclick={reset}
                ><Refresh size={14} /> Reiniciar</button
            >
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
    .dim-label {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-family: var(--font-body);
        font-size: 0.68rem;
        color: var(--text-color);
        opacity: 0.85;
    }
    .dim-label input {
        width: 3.4em;
        padding: 3px 5px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface);
        color: var(--text-color);
        font-family: var(--font-body);
        font-size: 0.8rem;
    }
    .spacer {
        flex: 1;
    }
    .op-toggle {
        display: flex;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        overflow: hidden;
    }
    .op-toggle button {
        padding: 4px 10px;
        font-family: var(--font-body);
        font-size: 0.75rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color);
    }
    .op-toggle button.active {
        background: var(--primary-color);
        color: var(--white);
    }
    .operands {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }
    .mx-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    .mx-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary-color);
    }
    .grid {
        display: grid;
        gap: 4px;
    }
    .cell {
        width: 2.4em;
        height: 2.1em;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.82rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface);
        color: var(--text-color);
        padding: 0;
        transition:
            border-color 0.1s,
            background 0.1s;
    }
    .cell:disabled {
        opacity: 0.85;
        background: var(--neutral-surface-variant);
    }
    .cell.hl {
        border-color: var(--primary-color);
        background: var(--primary-container-color);
    }
    .result {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--secondary-color);
        background: var(--neutral-surface-variant);
        cursor: default;
    }
    .result.hl-result {
        border-color: var(--secondary-color);
        background: var(--secondary-container-color);
    }
    .op-sym {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--text-color);
        flex-shrink: 0;
    }
    .formula {
        background: var(--neutral-surface-variant);
        border-radius: var(--radius);
        padding: 8px 11px;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.84rem;
        color: var(--text-color);
    }
    .formula.dim {
        opacity: 0.55;
        font-size: 0.76rem;
    }
    .btn-row {
        display: flex;
        gap: 8px;
        justify-content: center;
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
