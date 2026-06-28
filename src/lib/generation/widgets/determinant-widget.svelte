<script lang="ts">
    import {
        ChevronLeft,
        ChevronRight,
        Shuffle,
        Refresh,
    } from "@material-symbols-svg/svelte";
    import type { DeterminantBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: DeterminantBlockSpec;
    }
    const { config }: Props = $props();

    const editable = config.editable ?? true;

    function safe(v: unknown): number {
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    function fmt(n: number): string {
        if (Math.abs(n) < 1e-9) return "0";
        return Number.isInteger(n)
            ? String(n)
            : (Math.round(n * 10000) / 10000).toString();
    }
    function det2(a: number, b: number, c: number, d: number): number {
        return a * d - b * c;
    }

    function buildMat(n: number, seed?: number[][]): number[][] {
        return Array.from({ length: n }, (_, i) =>
            Array.from(
                { length: n },
                (_, j) => seed?.[i]?.[j] ?? (i === j ? 1 : 0),
            ),
        );
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
        M = buildMat(size).map((r) =>
            r.map(() => Math.floor(Math.random() * 9) - 4),
        );
        step = 0;
    }
    function reset() {
        M = buildMat(size, config.matrix?.values);
        step = 0;
    }

    const det = $derived.by(() => {
        if (size === 2) {
            return det2(
                safe(M[0][0]),
                safe(M[0][1]),
                safe(M[1][0]),
                safe(M[1][1]),
            );
        }

        return [0, 1, 2].reduce((acc, j) => {
            const minor = M.filter((_, r) => r !== 0).map((row) =>
                row.filter((_, c) => c !== j),
            );
            const sign = j % 2 === 0 ? 1 : -1;
            return (
                acc +
                sign *
                    safe(M[0][j]) *
                    det2(minor[0][0], minor[0][1], minor[1][0], minor[1][1])
            );
        }, 0);
    });

    interface CofactorStep {
        j: number;
        elem: number;
        sign: 1 | -1;
        minor: number[][];
        minorDet: number;
        term: number;
    }

    const cofactorSteps = $derived.by((): CofactorStep[] => {
        if (size !== 3) return [];
        return [0, 1, 2].map((j) => {
            const minor = M.filter((_, r) => r !== 0).map((row) =>
                row.filter((_, c) => c !== j),
            );
            const sign = (j % 2 === 0 ? 1 : -1) as 1 | -1;
            const mDet = det2(
                safe(minor[0][0]),
                safe(minor[0][1]),
                safe(minor[1][0]),
                safe(minor[1][1]),
            );
            return {
                j,
                elem: safe(M[0][j]),
                sign,
                minor,
                minorDet: mDet,
                term: sign * safe(M[0][j]) * mDet,
            };
        });
    });

    const maxStep = $derived(size === 3 ? 3 : 0);
    const cs = $derived(cofactorSteps[step] ?? null);

    function cellHl(i: number, j: number): "pivot" | "minor" | "" {
        if (size !== 3 || step >= 3) return "";
        if (i === 0 && j === step) return "pivot";
        if (i !== 0 && j !== step) return "minor";
        return "";
    }
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

    <div class="center-row">
        <span class="det-bar"></span>
        <div class="grid" style="grid-template-columns: repeat({size}, 2.4em)">
            {#each M as row, i (i)}
                {#each row as _, j (j)}
                    <input
                        class="cell"
                        class:hl-pivot={cellHl(i, j) === "pivot"}
                        class:hl-minor={cellHl(i, j) === "minor"}
                        type="number"
                        disabled={!editable}
                        bind:value={M[i][j]}
                    />
                {/each}
            {/each}
        </div>
        <span class="det-bar"></span>
        <span class="eq">=</span>
        <div class="result-box" class:pos={det > 0} class:neg={det < 0}>
            <span class="result-val">{fmt(det)}</span>
            <span class="result-lbl">det(A)</span>
        </div>
    </div>

    {#if size === 2}
        <div class="breakdown">
            <p>
                det(A) = ({fmt(safe(M[0][0]))})({fmt(safe(M[1][1]))}) − ({fmt(
                    safe(M[0][1]),
                )})({fmt(safe(M[1][0]))})
            </p>
            <p>
                = {fmt(safe(M[0][0]) * safe(M[1][1]))} − ({fmt(
                    safe(M[0][1]) * safe(M[1][0]),
                )}) = <strong>{fmt(det)}</strong>
            </p>
        </div>
    {:else if step < 3 && cs}
        <div class="breakdown">
            <p class="step-lbl">
                Cofactor C₁{cs.j + 1}: {cs.sign < 0 ? "−" : "+"}{fmt(
                    Math.abs(cs.elem),
                )} ×
            </p>
            <div class="minor-row">
                <span class="det-bar sm"></span>
                <div
                    class="grid"
                    style="grid-template-columns: repeat(2, 2.4em)"
                >
                    {#each cs.minor.flat() as v, k (k)}
                        <div class="cell static">{fmt(safe(v))}</div>
                    {/each}
                </div>
                <span class="det-bar sm"></span>
                <span class="eq sm"
                    >= {cs.sign < 0 ? "−" : ""}{fmt(Math.abs(cs.term))}</span
                >
            </div>
        </div>
    {:else}
        <div class="breakdown">
            <p>
                det(A) =
                {cofactorSteps
                    .map((s, idx) => {
                        const sign =
                            idx === 0
                                ? s.sign < 0
                                    ? "−"
                                    : ""
                                : s.sign < 0
                                  ? " − "
                                  : " + ";
                        return sign + fmt(Math.abs(s.term));
                    })
                    .join("")}
                = <strong>{fmt(det)}</strong>
            </p>
        </div>
    {/if}

    {#if size === 3}
        <div class="nav-row">
            <button
                class="icon-btn"
                onclick={() => (step = Math.max(0, step - 1))}
                disabled={step === 0}
            >
                <ChevronLeft size={16} />
            </button>
            <span class="step-count">
                {step < 3 ? `Cofactor ${step + 1} / 3` : "Suma final"}
            </span>
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
    .center-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .det-bar {
        display: inline-block;
        width: 3px;
        height: calc(var(--rows, 2) * 2.5em);
        background: var(--text-color);
        border-radius: 2px;
        min-height: 2em;
    }
    .det-bar.sm {
        height: 2.5em;
        min-height: 2.5em;
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
    }
    .cell:disabled {
        opacity: 0.85;
        background: var(--neutral-surface-variant);
    }
    .cell.hl-pivot {
        border-color: var(--primary-color);
        background: var(--primary-container-color);
    }
    .cell.hl-minor {
        border-color: var(--secondary-color);
        background: var(--secondary-container-color);
    }
    .cell.static {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        background: var(--neutral-surface-variant);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        font-family: var(--font-body);
        font-size: 0.82rem;
        color: var(--text-color);
    }
    .eq {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--text-color);
    }
    .eq.sm {
        font-size: 0.9rem;
        margin-left: 6px;
    }
    .result-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 3.5em;
        padding: 4px 10px;
        border: 2px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface-variant);
    }
    .result-box.pos {
        border-color: var(--secondary-color);
        background: var(--secondary-container-color);
    }
    .result-box.neg {
        border-color: var(--error-color);
        background: var(--error-container-color);
    }
    .result-val {
        font-family: var(--font-body);
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--text-color);
    }
    .result-lbl {
        font-family: var(--font-body);
        font-size: 0.62rem;
        color: var(--primary-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .breakdown {
        background: var(--neutral-surface-variant);
        border-radius: var(--radius);
        padding: 9px 11px;
        font-family: var(--font-body);
        font-size: 0.83rem;
        color: var(--text-color);
    }
    .breakdown p {
        margin: 0 0 4px 0;
    }
    .breakdown p:last-child {
        margin: 0;
    }
    .step-lbl {
        font-size: 0.74rem;
        color: var(--primary-color);
        font-weight: 600;
        margin: 0 0 6px 0 !important;
    }
    .minor-row {
        display: flex;
        align-items: center;
        gap: 6px;
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
