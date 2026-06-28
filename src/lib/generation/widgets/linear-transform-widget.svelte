<script lang="ts">
    import { Refresh } from "@material-symbols-svg/svelte";
    import type { LinearTransformBlockSpec } from "$lib/generation/sharedTypes";

    interface Props {
        config: LinearTransformBlockSpec;
    }
    const { config }: Props = $props();

    const editable = config.editable ?? true;

    function safe(v: unknown): number {
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }
    function fmt(n: number): string {
        if (Math.abs(n) < 1e-8) return "0";
        if (Number.isInteger(n)) return String(n);
        return (Math.round(n * 1000) / 1000).toString();
    }

    let M = $state([
        [
            config.matrix?.values?.[0]?.[0] ?? 1,
            config.matrix?.values?.[0]?.[1] ?? 0,
        ],
        [
            config.matrix?.values?.[1]?.[0] ?? 0,
            config.matrix?.values?.[1]?.[1] ?? 1,
        ],
    ]);

    function reset() {
        M = [
            [
                config.matrix?.values?.[0]?.[0] ?? 1,
                config.matrix?.values?.[0]?.[1] ?? 0,
            ],
            [
                config.matrix?.values?.[1]?.[0] ?? 0,
                config.matrix?.values?.[1]?.[1] ?? 1,
            ],
        ];
    }

    const PRESETS = [
        {
            label: "Identidad",
            v: [
                [1, 0],
                [0, 1],
            ],
        },
        {
            label: "Rot. 90°",
            v: [
                [0, -1],
                [1, 0],
            ],
        },
        {
            label: "Rot. 45°",
            v: [
                [0.707, -0.707],
                [0.707, 0.707],
            ],
        },
        {
            label: "Reflexión X",
            v: [
                [1, 0],
                [0, -1],
            ],
        },
        {
            label: "Cizallamiento",
            v: [
                [1, 1],
                [0, 1],
            ],
        },
        {
            label: "Escala ×2",
            v: [
                [2, 0],
                [0, 2],
            ],
        },
    ];
    function applyPreset(v: number[][]) {
        M = [
            [v[0][0], v[0][1]],
            [v[1][0], v[1][1]],
        ];
    }

    const W = 220,
        H = 220,
        CX = 110,
        CY = 110,
        SC = 40;

    function sx(x: number): number {
        return CX + x * SC;
    }
    function sy(y: number): number {
        return CY - y * SC;
    }

    function tx(x: number, y: number): [number, number] {
        return [
            safe(M[0][0]) * x + safe(M[0][1]) * y,
            safe(M[1][0]) * x + safe(M[1][1]) * y,
        ];
    }

    const origCorners: [number, number][] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ];

    function toPoints(corners: [number, number][]): string {
        return corners.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
    }

    const origPts = $derived(toPoints(origCorners));
    const transCorners = $derived(origCorners.map(([x, y]) => tx(x, y)));
    const transPts = $derived(toPoints(transCorners as [number, number][]));

    const e1t = $derived(tx(1, 0));
    const e2t = $derived(tx(0, 1));

    const det = $derived(
        safe(M[0][0]) * safe(M[1][1]) - safe(M[0][1]) * safe(M[1][0]),
    );

    function arrowPath(x: number, y: number): string {
        const svgx = sx(x),
            svgy = sy(y);
        const len = Math.sqrt((svgx - CX) ** 2 + (svgy - CY) ** 2);
        if (len < 2) return "";
        const ux = (svgx - CX) / len,
            uy = (svgy - CY) / len;
        const hLen = 8,
            hW = 4;
        const bx = svgx - hLen * ux,
            by = svgy - hLen * uy;
        return [
            `M${CX},${CY} L${svgx},${svgy}`,
            `M${bx + hW * -uy},${by + hW * ux} L${svgx},${svgy} L${bx - hW * -uy},${by - hW * ux}`,
        ].join(" ");
    }

    // Grid range
    const GRID = [-2, -1, 0, 1, 2];
</script>

<div class="widget">
    {#if config.title}<p class="title">{config.title}</p>{/if}

    <div class="body">
        <div class="left-col">
            <p class="mx-label">Matriz de transformación T</p>
            <div class="matrix-input">
                <span class="bracket tall">[</span>
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
                <span class="bracket tall">]</span>
            </div>

            <div class="info-box">
                <div class="info-row">
                    <span>det(T)</span>
                    <strong class:pos={det > 0} class:neg={det < 0}
                        >{fmt(det)}</strong
                    >
                </div>
                <div class="info-row">
                    <span>T(e₁)</span>
                    <strong>({fmt(e1t[0])}, {fmt(e1t[1])})</strong>
                </div>
                <div class="info-row">
                    <span>T(e₂)</span>
                    <strong>({fmt(e2t[0])}, {fmt(e2t[1])})</strong>
                </div>
            </div>

            {#if editable}
                <div class="preset-row">
                    {#each PRESETS as p (p.label)}
                        <button
                            class="preset-btn"
                            onclick={() => applyPreset(p.v)}>{p.label}</button
                        >
                    {/each}
                </div>
                <button class="text-btn" onclick={reset}
                    ><Refresh size={14} /> Reiniciar</button
                >
            {/if}
        </div>

        <svg width={W} height={H} viewBox="0 0 {W} {H}" class="canvas">
            {#each GRID as n (n)}
                <line
                    x1={sx(n)}
                    y1={sy(-2.7)}
                    x2={sx(n)}
                    y2={sy(2.7)}
                    stroke="var(--border-color)"
                    stroke-width={n === 0 ? 1 : 0.5}
                    opacity={n === 0 ? 0.5 : 0.25}
                />
                <line
                    x1={sx(-2.7)}
                    y1={sy(n)}
                    x2={sx(2.7)}
                    y2={sy(n)}
                    stroke="var(--border-color)"
                    stroke-width={n === 0 ? 1 : 0.5}
                    opacity={n === 0 ? 0.5 : 0.25}
                />
            {/each}

            <polygon
                points={origPts}
                fill="var(--primary-color)"
                fill-opacity=".12"
                stroke="var(--primary-color)"
                stroke-width="1.5"
                stroke-dasharray="4 2"
            />

            <polygon
                points={transPts}
                fill="var(--secondary-color)"
                fill-opacity=".18"
                stroke="var(--secondary-color)"
                stroke-width="1.8"
            />

            <path
                d={arrowPath(1, 0)}
                fill="none"
                stroke="var(--primary-color)"
                stroke-width="1.5"
                opacity=".6"
            />
            <path
                d={arrowPath(0, 1)}
                fill="none"
                stroke="var(--primary-color)"
                stroke-width="1.5"
                opacity=".6"
            />

            <path
                d={arrowPath(e1t[0], e1t[1])}
                fill="none"
                stroke="var(--secondary-color)"
                stroke-width="2"
            />
            <path
                d={arrowPath(e2t[0], e2t[1])}
                fill="none"
                stroke="var(--secondary-color)"
                stroke-width="2"
            />

            <text
                x={sx(1) + 5}
                y={sy(0) + 4}
                fill="var(--primary-color)"
                font-size="10"
                font-family="var(--font-body)"
                opacity=".7">e₁</text
            >
            <text
                x={sx(0) + 5}
                y={sy(1) - 4}
                fill="var(--primary-color)"
                font-size="10"
                font-family="var(--font-body)"
                opacity=".7">e₂</text
            >

            <text
                x={sx(e1t[0]) + 5}
                y={sy(e1t[1]) + 4}
                fill="var(--secondary-color)"
                font-size="10"
                font-family="var(--font-body)"
                font-weight="bold">T(e₁)</text
            >
            <text
                x={sx(e2t[0]) + 5}
                y={sy(e2t[1]) - 4}
                fill="var(--secondary-color)"
                font-size="10"
                font-family="var(--font-body)"
                font-weight="bold">T(e₂)</text
            >
        </svg>
    </div>

    <div class="legend">
        <span class="legend-item orig">▪ Original (cuadrado unitario)</span>
        <span class="legend-item trans">▪ Transformado T(cuadrado)</span>
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
    .body {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: flex-start;
    }
    .left-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 160px;
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
    .bracket.tall {
        font-size: 2.8rem;
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
    .info-box {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
        background: var(--neutral-surface-variant);
        border-radius: var(--radius);
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-family: var(--font-body);
        font-size: 0.78rem;
        color: var(--text-color);
    }
    .info-row strong {
        font-weight: 700;
    }
    .info-row strong.pos {
        color: var(--secondary-color);
    }
    .info-row strong.neg {
        color: var(--error-color);
    }
    .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    .preset-btn {
        padding: 3px 7px;
        font-family: var(--font-body);
        font-size: 0.68rem;
        background: var(--primary-container-color);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
        border-radius: var(--radius);
        cursor: pointer;
    }
    .canvas {
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--neutral-surface-variant);
        flex-shrink: 0;
    }
    .legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }
    .legend-item {
        font-family: var(--font-body);
        font-size: 0.72rem;
    }
    .legend-item.orig {
        color: var(--primary-color);
    }
    .legend-item.trans {
        color: var(--secondary-color);
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
        width: fit-content;
    }
</style>
