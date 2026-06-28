<script lang="ts">
    import {
        ChevronLeft,
        ChevronRight,
        Shuffle,
        Refresh,
    } from "@material-symbols-svg/svelte";
    import type { EigenvalueBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: EigenvalueBlockSpec;
    }
    const { config }: Props = $props();

    const editable = config.editable ?? true;

    function r4(x: number): number {
        return Math.round(x * 1e4) / 1e4;
    }
    function safe(v: unknown): number {
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    function fmt(n: number): string {
        if (!Number.isFinite(n)) return "?";
        if (Math.abs(n) < 1e-8) return "0";
        if (Number.isInteger(n)) return String(n);
        for (let q = 2; q <= 20; q++) {
            const p = Math.round(n * q);
            if (Math.abs(p / q - n) < 1e-8) return `${p}/${q}`;
        }
        return r4(n).toString();
    }
    function fmtSign(n: number, first = false): string {
        if (first) return fmt(n);
        return n < 0 ? ` − ${fmt(Math.abs(n))}` : ` + ${fmt(n)}`;
    }
    function fmtComplex(re: number, im: number): string {
        const reStr = fmt(re);
        const imStr = fmt(Math.abs(im));
        return `${reStr} ${im >= 0 ? "+" : "−"} ${imStr}i`;
    }

    function buildMat(seed?: number[][]): number[][] {
        return [
            [seed?.[0]?.[0] ?? 4, seed?.[0]?.[1] ?? 1],
            [seed?.[1]?.[0] ?? 2, seed?.[1]?.[1] ?? 3],
        ];
    }

    let M = $state(buildMat(config.matrix?.values));
    let step = $state(0);

    function randomize() {
        let tries = 0;
        do {
            M = buildMat().map((r) =>
                r.map(() => Math.floor(Math.random() * 7) - 2),
            );
            tries++;
        } while (disc < 0 && tries < 30);
        step = 0;
    }
    function reset() {
        M = buildMat(config.matrix?.values);
        step = 0;
    }

    const a = $derived(safe(M[0][0])),
        b = $derived(safe(M[0][1]));
    const c = $derived(safe(M[1][0])),
        d = $derived(safe(M[1][1]));

    const tr = $derived(r4(a + d));
    const det = $derived(r4(a * d - b * c));
    const disc = $derived(r4(tr * tr - 4 * det));

    interface Eigen {
        lambda: number;
        vx: number;
        vy: number;
    }

    const eigenvalues = $derived.by((): Eigen[] | null => {
        if (disc < -1e-8) return null; // complex
        const sqD = Math.sqrt(Math.max(0, disc));
        const lambdas = [r4((tr + sqD) / 2), r4((tr - sqD) / 2)].filter(
            (v, i, arr) => i === 0 || Math.abs(v - arr[0]) > 1e-8,
        );
        return lambdas.map((lambda) => {
            const ra = r4(a - lambda),
                rb = b,
                rc = c,
                rd = r4(d - lambda);
            let vx: number, vy: number;
            if (Math.abs(rb) + Math.abs(ra) >= Math.abs(rd) + Math.abs(rc)) {
                vx = -rb;
                vy = ra;
            } else {
                vx = -rd;
                vy = rc;
            }

            if (Math.abs(vx) < 1e-8 && Math.abs(vy) < 1e-8) {
                vx = 1;
                vy = 0;
            }
            return { lambda, vx: r4(vx), vy: r4(vy) };
        });
    });

    const complexRe = $derived(r4(tr / 2));
    const complexIm = $derived(disc < -1e-8 ? r4(Math.sqrt(-disc) / 2) : 0);

    const maxStep = 4;

    const polyStr = $derived(`λ² ${fmtSign(-tr)}λ ${fmtSign(det)} = 0`);
    const polyVals = $derived(`λ² ${fmtSign(-tr)}λ ${fmtSign(det)} = 0`);
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="mx-center">
        <div class="mx-wrap">
            <p class="mx-label">A (matriz 2×2)</p>
            <div class="matrix-input">
                <span class="bracket">[</span>
                <div class="mx-grid">
                    {#each [0, 1] as i (i)}
                        {#each [0, 1] as j (j)}
                            <input
                                class="cell"
                                type="number"
                                disabled={!editable}
                                bind:value={M[i][j]}
                            />
                        {/each}
                    {/each}
                </div>
                <span class="bracket">]</span>
            </div>
        </div>
        {#if editable}
            <div class="edit-btns">
                <button class="text-btn" onclick={randomize}
                    ><Shuffle size={14} /> Aleatorizar</button
                >
                <button class="text-btn" onclick={reset}
                    ><Refresh size={14} /> Reiniciar</button
                >
            </div>
        {/if}
    </div>

    {#if step >= 1}
        <div class="panel" class:active={step === 1}>
            <p class="panel-label">
                1 — Polinomio característico: det(A − λI) = 0
            </p>
            <p class="panel-content formula">
                det<span class="paren">(</span>
                <span class="mat-inline">
                    <span>{fmt(a)}−λ</span><span>{fmt(b)}</span>
                    <span>{fmt(c)}</span><span>{fmt(d)}−λ</span>
                </span>
                <span class="paren">)</span> = 0
            </p>
            <p class="panel-content formula">
                ({fmt(a)}−λ)({fmt(d)}−λ) − ({fmt(b)})({fmt(c)}) = 0
            </p>
            <p class="panel-content formula strong">
                λ² − {fmt(tr)}λ + {fmt(det)} = 0
            </p>
        </div>
    {/if}

    {#if step >= 2}
        <div class="panel" class:active={step === 2}>
            <p class="panel-label">2 — Discriminante: Δ = tr(A)² − 4·det(A)</p>
            <p class="panel-content formula">
                Δ = {fmt(tr)}² − 4·{fmt(det)} = {fmt(tr * tr)} − {fmt(4 * det)} =
                <strong>{fmt(disc)}</strong>
            </p>
            {#if disc < -1e-8}
                <p class="panel-content complex-note">
                    Δ &lt; 0 → valores propios complejos conjugados
                </p>
            {:else if Math.abs(disc) < 1e-8}
                <p class="panel-content">
                    Δ = 0 → valor propio repetido (doble)
                </p>
            {:else}
                <p class="panel-content">
                    Δ &gt; 0 → dos valores propios reales distintos
                </p>
            {/if}
        </div>
    {/if}

    {#if step >= 3}
        <div class="panel" class:active={step === 3}>
            <p class="panel-label">3 — Valores propios: λ = (tr ± √Δ) / 2</p>
            {#if disc < -1e-8}
                <p class="panel-content formula">
                    λ = ({fmt(complexRe)}) ± ({fmt(complexIm)})i
                </p>
                <p class="panel-content">
                    λ₁ = {fmtComplex(complexRe, complexIm)}, λ₂ = {fmtComplex(
                        complexRe,
                        -complexIm,
                    )}
                </p>
            {:else if eigenvalues}
                {#each eigenvalues as e, idx (idx)}
                    <p class="panel-content formula">
                        λ{idx + 1} = ({fmt(tr)}
                        {disc > 1e-8 ? (idx === 0 ? "+" : "−") : ""}
                        {disc > 1e-8 ? fmt(Math.sqrt(disc)) : "0"}) / 2 =
                        <strong class="eigen-val">{fmt(e.lambda)}</strong>
                    </p>
                {/each}
            {/if}
        </div>
    {/if}

    {#if step >= 4 && eigenvalues && disc >= -1e-8}
        <div class="panel" class:active={step === 4}>
            <p class="panel-label">4 — Vectores propios: (A − λI)v = 0</p>
            {#each eigenvalues as e, idx (idx)}
                <div class="eigen-block">
                    <p class="panel-content">
                        Para λ{idx + 1} = {fmt(e.lambda)}:
                        <span class="mat-eq">
                            [{fmt(r4(a - e.lambda))}, {fmt(b)}; {fmt(c)}, {fmt(
                                r4(d - e.lambda),
                            )}] · v = 0
                        </span>
                    </p>
                    <p class="panel-content formula">
                        v{idx + 1} =
                        <span class="bracket">[</span>
                        <span class="vec-vals">{fmt(e.vx)}, {fmt(e.vy)}</span>
                        <span class="bracket">]</span>
                        <span class="scalar-note">
                            (o cualquier múltiplo no nulo)</span
                        >
                    </p>
                </div>
            {/each}
        </div>
    {:else if step >= 4 && disc < -1e-8}
        <div class="panel">
            <p class="panel-label">4 — Vectores propios</p>
            <p class="panel-content complex-note">
                Los vectores propios son vectores complejos — fuera del alcance
                de este widget.
            </p>
        </div>
    {/if}

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
                "Matriz A",
                "Polinomio caract.",
                "Discriminante",
                "Valores propios",
                "Vectores propios",
            ][step]}
        </span>
        <button
            class="icon-btn"
            onclick={() => (step = Math.min(maxStep, step + 1))}
            disabled={step === maxStep}
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
    .mx-center {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 12px;
    }
    .mx-wrap {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .mx-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary-color);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }
    .matrix-input {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .bracket {
        font-size: 2.2rem;
        color: var(--text-color);
        line-height: 1;
    }
    .mx-grid {
        display: grid;
        grid-template-columns: repeat(2, 3em);
        gap: 4px;
    }
    .cell {
        width: 3em;
        height: 2.1em;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.84rem;
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
    .edit-btns {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .panel {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 9px 12px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        opacity: 0.55;
        transition:
            opacity 0.15s,
            border-color 0.15s;
    }
    .panel.active {
        opacity: 1;
        border-color: var(--primary-color);
    }
    .panel-label {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.66rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-color);
    }
    .panel-content {
        margin: 0;
        font-family: var(--font-body);
        font-size: 0.83rem;
        color: var(--text-color);
    }
    .formula {
        font-style: italic;
    }
    .strong {
        font-weight: 700;
    }
    .eigen-val {
        color: var(--secondary-color);
    }
    .complex-note {
        color: var(--error-color);
        font-style: italic;
    }
    .mat-inline {
        display: inline-grid;
        grid-template-columns: auto auto;
        gap: 2px 8px;
        font-style: normal;
        border: 1px solid var(--text-color);
        padding: 1px 4px;
        vertical-align: middle;
        font-size: 0.78rem;
    }
    .paren {
        font-size: 1.3rem;
        vertical-align: middle;
    }
    .mat-eq {
        font-style: normal;
        opacity: 0.75;
        margin-left: 6px;
        font-size: 0.78rem;
    }
    .eigen-block {
        padding: 4px 0;
        border-top: 1px solid var(--border-color);
    }
    .eigen-block:first-of-type {
        border-top: none;
    }
    .vec-vals {
        font-weight: 700;
        color: var(--secondary-color);
    }
    .scalar-note {
        font-size: 0.72rem;
        opacity: 0.6;
        font-style: normal;
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
        min-width: 110px;
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
