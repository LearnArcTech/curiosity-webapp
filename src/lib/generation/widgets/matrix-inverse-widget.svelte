<script lang="ts">
    import {
        ChevronLeft,
        ChevronRight,
        Shuffle,
        Refresh,
    } from "@material-symbols-svg/svelte";
    import type { MatrixInverseBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: MatrixInverseBlockSpec;
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
        // Try to display as a simple fraction p/q with |q| ≤ 20
        for (let q = 2; q <= 20; q++) {
            const p = Math.round(n * q);
            if (Math.abs(p / q - n) < 1e-8) return `${p}/${q}`;
        }
        return (Math.round(n * 10000) / 10000).toString();
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
        // Keep trying until det ≠ 0
        let tries = 0;
        do {
            M = buildMat(size).map((r) =>
                r.map(() => Math.floor(Math.random() * 7) - 3),
            );
            tries++;
        } while (Math.abs(computeDet()) < 0.5 && tries < 30);
        step = 0;
    }
    function reset() {
        M = buildMat(size, config.matrix?.values);
        step = 0;
    }

    function det2(a: number, b: number, c: number, d: number): number {
        return a * d - b * c;
    }

    function computeDet(): number {
        if (size === 2)
            return det2(
                safe(M[0][0]),
                safe(M[0][1]),
                safe(M[1][0]),
                safe(M[1][1]),
            );
        return [0, 1, 2].reduce((acc, j) => {
            const minor = M.filter((_, r) => r !== 0).map((row) =>
                row.filter((_, c) => c !== j),
            );
            const sign = j % 2 === 0 ? 1 : -1;
            return (
                acc +
                sign *
                    safe(M[0][j]) *
                    det2(
                        safe(minor[0][0]),
                        safe(minor[0][1]),
                        safe(minor[1][0]),
                        safe(minor[1][1]),
                    )
            );
        }, 0);
    }

    function cofactorMat(): number[][] {
        return Array.from({ length: size }, (_, i) =>
            Array.from({ length: size }, (_, j) => {
                const minor = M.filter((_, r) => r !== i).map((row) =>
                    row.filter((_, c) => c !== j),
                );
                const sign = (i + j) % 2 === 0 ? 1 : -1;
                const md =
                    minor.length === 1
                        ? safe(minor[0][0])
                        : det2(
                              safe(minor[0][0]),
                              safe(minor[0][1]),
                              safe(minor[1][0]),
                              safe(minor[1][1]),
                          );
                return r6(sign * md);
            }),
        );
    }

    function transpose(m: number[][]): number[][] {
        return Array.from({ length: m[0].length }, (_, i) =>
            m.map((row) => row[i]),
        );
    }

    const det = $derived(computeDet());
    const singular = $derived(Math.abs(det) < 1e-10);
    const cofactor = $derived(cofactorMat());
    const adjugate = $derived(transpose(cofactor));
    const inverse = $derived(
        singular ? null : adjugate.map((row) => row.map((v) => r6(v / det))),
    );

    const maxStep = $derived(size === 2 ? 2 : 3);
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

    <div class="steps-row">
        <div class="mx-panel" class:active={step === 0}>
            <p class="mx-label">A</p>
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

        {#if singular}
            <div class="singular-msg">
                ⚠ Matriz singular — det(A) = 0 — no existe A⁻¹
            </div>
        {:else}
            {#if step >= 1}
                <div class="arrow">→</div>
                <div class="mx-panel highlight" class:active={step === 1}>
                    <p class="mx-label">det(A)</p>
                    <div class="det-val">{fmt(det)}</div>
                </div>
            {/if}

            {#if size === 3 && step >= 2}
                <div class="arrow">→</div>
                <div class="mx-panel" class:active={step === 2}>
                    <p class="mx-label">Cofactores C</p>
                    <div
                        class="grid"
                        style="grid-template-columns: repeat(3, 2.8em)"
                    >
                        {#each cofactor.flat() as v, k (k)}
                            <div class="cell static">{fmt(v)}</div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if (size === 2 && step >= 1) || (size === 3 && step >= 3)}
                <div class="arrow">→</div>
                <div
                    class="mx-panel"
                    class:active={(size === 2 && step === 1) ||
                        (size === 3 && step === 3)}
                >
                    <p class="mx-label">
                        adj(A){size === 2 ? " = Cof(A)ᵀ" : ""}
                    </p>
                    <div
                        class="grid"
                        style="grid-template-columns: repeat({size}, 2.8em)"
                    >
                        {#each adjugate.flat() as v, k (k)}
                            <div class="cell static">{fmt(v)}</div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if (size === 2 && step >= 2) || (size === 3 && step >= 4 - 1)}
                <div class="arrow">→</div>
                <div
                    class="mx-panel result"
                    class:active={step === maxStep + 1}
                >
                    <p class="mx-label">A⁻¹ = (1/{fmt(det)}) · adj(A)</p>
                    <div
                        class="grid"
                        style="grid-template-columns: repeat({size}, 2.8em)"
                    >
                        {#each (inverse ?? []).flat() as v, k (k)}
                            <div class="cell static result-cell">{fmt(v)}</div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>

    {#if !singular}
        <div class="nav-row">
            <button
                class="icon-btn"
                onclick={() => (step = Math.max(0, step - 1))}
                disabled={step === 0}
            >
                <ChevronLeft size={16} />
            </button>
            <span class="step-count">
                {[
                    "A original",
                    "Determinante",
                    size === 3 ? "Cofactores" : "Adjunta / inversa",
                    size === 3 ? "Adjunta" : "",
                    "A⁻¹",
                ].filter(Boolean)[step] ?? "A⁻¹"}
            </span>
            <button
                class="icon-btn"
                onclick={() => (step = Math.min(size === 2 ? 2 : 3, step + 1))}
                disabled={step === (size === 2 ? 2 : 3)}
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
    .steps-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    .arrow {
        font-size: 1.2rem;
        color: var(--border-color);
    }
    .mx-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface-variant);
        opacity: 0.55;
        transition:
            opacity 0.15s,
            border-color 0.15s;
    }
    .mx-panel.active,
    .mx-panel:last-child {
        opacity: 1;
        border-color: var(--primary-color);
    }
    .mx-panel.highlight {
        border-color: var(--secondary-color);
    }
    .mx-panel.result {
        border-color: var(--secondary-color);
    }
    .mx-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--primary-color);
        text-align: center;
    }
    .det-val {
        font-family: var(--font-body);
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--secondary-color);
        padding: 4px 12px;
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
    .cell.result-cell {
        color: var(--secondary-color);
        font-weight: 700;
        background: var(--secondary-container-color);
        border-color: var(--secondary-color);
    }
    .singular-msg {
        padding: 10px 14px;
        background: var(--error-container-color);
        color: var(--error-color);
        border-radius: var(--radius);
        font-family: var(--font-body);
        font-size: 0.83rem;
        font-weight: 600;
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
        min-width: 90px;
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
