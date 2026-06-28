<script lang="ts">
    import { Shuffle, Refresh } from "@material-symbols-svg/svelte";
    import type { VectorOperationsBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: VectorOperationsBlockSpec;
    }
    const { config }: Props = $props();

    const editable = config.editable ?? true;

    function safe(v: unknown): number {
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    function r4(x: number): number {
        return Math.round(x * 1e4) / 1e4;
    }
    function fmt(n: number): string {
        if (!Number.isFinite(n)) return "—";
        if (Math.abs(n) < 1e-8) return "0";
        if (Number.isInteger(n)) return String(n);
        return r4(n).toString();
    }
    function fmtDeg(rad: number): string {
        if (!Number.isFinite(rad)) return "—";
        return r4((rad * 180) / Math.PI) + "°";
    }

    let dim = $state<2 | 3>(config.dimension === 2 ? 2 : 3);

    function initVec(src: number[] | undefined, n: number): number[] {
        return Array.from({ length: n }, (_, i) => src?.[i] ?? 0);
    }

    let A = $state(initVec(config.vectorA, 3));
    let B = $state(initVec(config.vectorB, 3));

    function setDim(n: 2 | 3) {
        dim = n;
    }
    function randomize() {
        A = A.map(() => Math.floor(Math.random() * 11) - 5);
        B = B.map(() => Math.floor(Math.random() * 11) - 5);
    }
    function reset() {
        A = initVec(config.vectorA, 3);
        B = initVec(config.vectorB, 3);
    }

    const aUsed = $derived(A.slice(0, dim));
    const bUsed = $derived(B.slice(0, dim));

    const dot = $derived(
        aUsed.reduce((s, v, i) => s + safe(v) * safe(bUsed[i]), 0),
    );
    const magA = $derived(
        Math.sqrt(aUsed.reduce((s, v) => s + safe(v) ** 2, 0)),
    );
    const magB = $derived(
        Math.sqrt(bUsed.reduce((s, v) => s + safe(v) ** 2, 0)),
    );
    const cosT = $derived(
        magA > 1e-10 && magB > 1e-10 ? r4(dot / (magA * magB)) : NaN,
    );
    const angle = $derived(
        Number.isFinite(cosT)
            ? Math.acos(Math.max(-1, Math.min(1, cosT)))
            : NaN,
    );

    const projScalar = $derived(magB > 1e-10 ? r4(dot / (magB * magB)) : NaN);
    const proj = $derived(bUsed.map((v) => r4(safe(v) * projScalar)));

    const cross = $derived([
        r4(safe(A[1]) * safe(B[2]) - safe(A[2]) * safe(B[1])),
        r4(safe(A[2]) * safe(B[0]) - safe(A[0]) * safe(B[2])),
        r4(safe(A[0]) * safe(B[1]) - safe(A[1]) * safe(B[0])),
    ]);

    const W = 200,
        H = 200,
        CX = 100,
        CY = 100;
    const SCALE = 18;

    function svgPt(x: number, y: number): string {
        return `${CX + x * SCALE},${CY - y * SCALE}`;
    }

    function arrowPath(x: number, y: number): string {
        const len = Math.sqrt(x * x + y * y);
        if (len < 1e-4) return "";
        const ux = x / len,
            uy = y / len;
        const hLen = 0.55;
        const hW = 0.3;
        const bx = x - hLen * ux,
            by = y - hLen * uy;
        const p1 = svgPt(bx + hW * -uy, by + hW * ux);
        const p2 = svgPt(x, y);
        const p3 = svgPt(bx - hW * -uy, by - hW * ux);
        return `M ${svgPt(0, 0)} L ${svgPt(x, y)} M ${p1} L ${p2} L ${p3}`;
    }

    const LABELS = ["x", "y", "z"];
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="top-row">
        <div class="dim-toggle">
            <button class:active={dim === 2} onclick={() => setDim(2)}
                >2D</button
            >
            <button class:active={dim === 3} onclick={() => setDim(3)}
                >3D</button
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

    <div class="main-area">
        <!-- Vector inputs -->
        <div class="vecs-col">
            {#each [{ label: "a", vec: A }, { label: "b", vec: B }] as vd, vi (vi)}
                <div class="vec-input-row">
                    <span
                        class="vec-name"
                        style="color:{vi === 0
                            ? 'var(--primary-color)'
                            : 'var(--secondary-color)'}"
                    >
                        {vd.label} =
                    </span>
                    <span class="bracket">[</span>
                    {#each vd.vec.slice(0, dim) as _, ci (ci)}
                        <input
                            class="vec-cell"
                            type="number"
                            disabled={!editable}
                            bind:value={vd.vec[ci]}
                        />
                        {#if ci < dim - 1}<span class="comma">,</span>{/if}
                    {/each}
                    <span class="bracket">]</span>
                </div>
            {/each}
        </div>

        <!-- 2D visualization -->
        {#if dim === 2}
            <svg width={W} height={H} viewBox="0 0 {W} {H}" class="canvas">
                <!-- Grid -->
                {#each [-4, -3, -2, -1, 0, 1, 2, 3, 4] as n}
                    <line
                        x1={CX + n * SCALE}
                        y1="10"
                        x2={CX + n * SCALE}
                        y2={H - 10}
                        stroke="var(--border-color)"
                        stroke-width={n === 0 ? 1 : 0.4}
                        opacity={n === 0 ? 0.6 : 0.3}
                    />
                    <line
                        x1="10"
                        y1={CY - n * SCALE}
                        x2={W - 10}
                        y2={CY - n * SCALE}
                        stroke="var(--border-color)"
                        stroke-width={n === 0 ? 1 : 0.4}
                        opacity={n === 0 ? 0.6 : 0.3}
                    />
                {/each}

                <path
                    d={arrowPath(safe(A[0]), safe(A[1]))}
                    fill="none"
                    stroke="var(--primary-color)"
                    stroke-width="2"
                />

                <path
                    d={arrowPath(safe(B[0]), safe(B[1]))}
                    fill="none"
                    stroke="var(--secondary-color)"
                    stroke-width="2"
                />

                {#if Number.isFinite(projScalar) && magB > 1e-4}
                    <line
                        x1={CX}
                        y1={CY}
                        x2={CX + proj[0] * SCALE}
                        y2={CY - proj[1] * SCALE}
                        stroke="var(--primary-color)"
                        stroke-width="1"
                        stroke-dasharray="3 2"
                        opacity=".6"
                    />
                {/if}

                <text
                    x={CX + safe(A[0]) * SCALE + 5}
                    y={CY - safe(A[1]) * SCALE - 5}
                    fill="var(--primary-color)"
                    font-size="11"
                    font-family="var(--font-body)"
                    font-weight="bold">a</text
                >
                <text
                    x={CX + safe(B[0]) * SCALE + 5}
                    y={CY - safe(B[1]) * SCALE - 5}
                    fill="var(--secondary-color)"
                    font-size="11"
                    font-family="var(--font-body)"
                    font-weight="bold">b</text
                >
            </svg>
        {/if}
    </div>

    <div class="results">
        <div class="res-row">
            <span class="res-label">|<b>a</b>|</span>
            <span class="res-formula"
                >√({aUsed.map((v) => safe(v) + "²").join(" + ")})</span
            >
            <span class="res-val">{fmt(magA)}</span>
        </div>
        <div class="res-row">
            <span class="res-label">|<b>b</b>|</span>
            <span class="res-formula"
                >√({bUsed.map((v) => safe(v) + "²").join(" + ")})</span
            >
            <span class="res-val">{fmt(magB)}</span>
        </div>
        <div class="res-divider"></div>
        <div class="res-row">
            <span class="res-label"><b>a</b>·<b>b</b></span>
            <span class="res-formula"
                >{aUsed
                    .map((v, i) => safe(v) + "·" + safe(bUsed[i]))
                    .join(" + ")}</span
            >
            <span class="res-val primary">{fmt(dot)}</span>
        </div>
        <div class="res-row">
            <span class="res-label">θ</span>
            <span class="res-formula">arccos({fmt(cosT)})</span>
            <span class="res-val">{fmtDeg(angle)}</span>
        </div>
        <div class="res-row">
            <span class="res-label">proj<sub>b</sub> <b>a</b></span>
            <span class="res-formula">({fmt(projScalar)}) · <b>b</b></span>
            <span class="res-val">[{proj.map(fmt).join(", ")}]</span>
        </div>
        {#if dim === 3}
            <div class="res-divider"></div>
            <div class="res-row">
                <span class="res-label"><b>a</b> × <b>b</b></span>
                <span class="res-formula">
                    ({fmt(safe(A[1]))}·{fmt(safe(B[2]))} − {fmt(
                        safe(A[2]),
                    )}·{fmt(safe(B[1]))}, …)
                </span>
                <span class="res-val secondary"
                    >[{cross.map(fmt).join(", ")}]</span
                >
            </div>
        {/if}
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
    .top-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
    }
    .spacer {
        flex: 1;
    }
    .dim-toggle {
        display: flex;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        overflow: hidden;
    }
    .dim-toggle button {
        padding: 4px 12px;
        font-family: var(--font-body);
        font-size: 0.78rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color);
    }
    .dim-toggle button.active {
        background: var(--primary-color);
        color: var(--white);
    }
    .main-area {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: flex-start;
    }
    .vecs-col {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .vec-input-row {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .vec-name {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.9rem;
        min-width: 2.5em;
    }
    .bracket {
        font-size: 1.3rem;
        color: var(--text-color);
        opacity: 0.7;
    }
    .vec-cell {
        width: 3em;
        height: 2em;
        text-align: center;
        font-family: var(--font-body);
        font-size: 0.84rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface);
        color: var(--text-color);
        padding: 0;
    }
    .vec-cell:disabled {
        background: var(--neutral-surface-variant);
        opacity: 0.85;
    }
    .comma {
        font-size: 0.8rem;
        color: var(--text-color);
        opacity: 0.5;
    }
    .canvas {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface-variant);
    }
    .results {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .res-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-family: var(--font-body);
        font-size: 0.8rem;
        color: var(--text-color);
        padding: 3px 8px;
        border-radius: var(--radius);
    }
    .res-row:hover {
        background: var(--neutral-surface-variant);
    }
    .res-label {
        min-width: 5em;
        font-weight: 700;
        font-size: 0.78rem;
    }
    .res-formula {
        flex: 1;
        opacity: 0.6;
        font-size: 0.73rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .res-val {
        font-weight: 700;
        font-size: 0.85rem;
        min-width: 4em;
        text-align: right;
    }
    .res-val.primary {
        color: var(--primary-color);
    }
    .res-val.secondary {
        color: var(--secondary-color);
    }
    .res-divider {
        height: 1px;
        background: var(--border-color);
        opacity: 0.4;
        margin: 3px 0;
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
