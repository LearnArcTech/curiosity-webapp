<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { animate } from "animejs";

    type MaskSource = string | HTMLImageElement;

    interface Props {
        /** Word/phrase that resolves in the center of the noise grid. */
        text?: string;
        /** Whether the field is actively animating. */
        active?: boolean;
        /**
         * Roughly how many cells to render, regardless of container size.
         * Canvas makes this cheap — 1000-2500 is fine even for a full-page
         * background. Higher = denser letters.
         */
        targetCellCount?: number;
        /** Character pool used for the flickering "noise" cells. */
        glyphs?: string;
        /**
         * Optional single image URL (or a preloaded HTMLImageElement) used as a
         * density mask. Ignored if `maskImages` is also provided. Dark/opaque
         * regions render denser character clusters, light/transparent regions
         * thin out. Must be same-origin or served with CORS headers, since it's
         * read back via getImageData.
         */
        maskImage?: MaskSource;
        /**
         * Array of image URLs (or preloaded HTMLImageElements) to cycle through as
         * the density mask, crossfading from one to the next. Takes priority over
         * `maskImage`. A single-item array behaves like a static mask.
         */
        maskImages?: MaskSource[];
        /** How long each mask is shown before switching to the next, in ms. */
        maskCycleMs?: number;
        /** Flip the mask's density mapping (useful for light-on-dark source images). */
        maskInvert?: boolean;
        /**
         * Pushes density values away from the midpoint (0.5) before rendering.
         * 1 = untouched. >1 sharpens the image (near-black/near-white clusters
         * become fully dense/empty, midtones thin out fast) — try 1.5-2.5 to
         * make detail pop. <1 flattens it toward uniform density.
         */
        maskContrast?: number;
        /**
         * Gamma-reshapes midtones after contrast is applied. <1 brightens/expands
         * midtones (more cells render), >1 darkens/compresses them (fewer, punchier
         * clusters). 1 = untouched.
         */
        maskGamma?: number;
        /**
         * Minimum opacity multiplier applied even where mask density is 0.
         * Lower = starker contrast between "shape" and "empty" areas, but a fully
         * black background loses the ambient static texture entirely. 0-0.15 is
         * usually the useful range.
         */
        maskFloor?: number;
    }

    const {
        text = "",
        active = true,
        targetCellCount = 900,
        glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-·:/\\",
        maskImage,
        maskImages,
        maskCycleMs = 4000,
        maskInvert = false,
        maskContrast = 1,
        maskGamma = 1,
        maskFloor = 0.15,
    }: Props = $props();

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;

    let simpleMode = $state(false);
    let simpleModeObserver: MutationObserver | undefined;

    function readSimpleMode() {
        simpleMode = document.documentElement.hasAttribute("data-simple-mode");
    }

    let cols = 1;
    let rows = 1;
    let cellW = 16;
    let cellH = 16;
    let widthPx = 0;
    let heightPx = 0;

    // Plain arrays, not Svelte state — mutated every frame without ever
    // touching reactivity/the DOM diff.
    let charGrid: string[] = [];
    let isSignalGrid: boolean[] = [];
    let phaseGrid: number[] = []; // per-cell flicker phase offset
    let signalDelayGrid: number[] = []; // per-signal-cell reveal delay, staggered from center
    let revealDuration = 900;

    // Mask cycling
    let loadedImages: HTMLImageElement[] = [];
    let maskGridsArr: (Float32Array | null)[] = [];
    let loadedSrcKey = "";
    let currentMaskIndex = 0;
    let cycleTimer: ReturnType<typeof setInterval> | undefined;

    let noiseColor = "#888888";
    let signalColor = "#ffffff";

    let rafId: number | undefined;
    let lastGlyphSwap = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let isVisible = true;

    // Anime.js animates this single plain object, not any DOM nodes — cheap,
    // and it's what drives the staggered "resolve" of the center word.
    const revealState = { value: 0 };

    const prefersReducedMotion = () =>
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function randomGlyph() {
        return glyphs[Math.floor(Math.random() * glyphs.length)];
    }

    function computeSignalPositions(
        word: string,
        gridCols: number,
        gridRows: number,
    ) {
        const map = new Map<number, string>();
        const chars = word.toUpperCase().split("");
        if (!chars.length) return map;

        const startCol = Math.max(0, Math.floor((gridCols - chars.length) / 2));
        const centerRow = Math.floor(gridRows / 2);

        chars.forEach((ch, i) => {
            const col = startCol + i;
            if (ch !== " " && col >= 0 && col < gridCols) {
                map.set(centerRow * gridCols + col, ch);
            }
        });
        return map;
    }

    function readThemeColors() {
        if (!container) return;
        const styles = getComputedStyle(container);
        noiseColor =
            styles.getPropertyValue("--secondary-color").trim() || "#888888";
        signalColor =
            styles.getPropertyValue("--text-color").trim() || "#ffffff";
    }

    /** Pushes a 0-1 density value away from the midpoint, then applies a gamma curve. */
    function shapeDensity(density: number): number {
        let d = (density - 0.5) * maskContrast + 0.5;
        d = Math.max(0, Math.min(1, d));
        if (maskGamma !== 1) d = Math.pow(d, maskGamma);
        return d;
    }

    function resolveImageList(): MaskSource[] {
        if (maskImages && maskImages.length) return maskImages;
        if (maskImage) return [maskImage];
        return [];
    }

    async function loadOneImage(
        src: MaskSource,
    ): Promise<HTMLImageElement | null> {
        if (typeof src !== "string") return src;
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () =>
                    reject(new Error(`Could not load mask image: ${src}`));
                img.src = src;
            });
            return img;
        } catch (err) {
            console.warn(
                "[LetterField] mask image failed to load, skipping.",
                err,
            );
            return null;
        }
    }

    /** Downsamples one loaded image to the current cols×rows grid (cover-fit crop). */
    function sampleImageToGrid(img: HTMLImageElement): Float32Array | null {
        if (!img.complete || !img.naturalWidth || !cols || !rows) return null;

        const off = document.createElement("canvas");
        off.width = cols;
        off.height = rows;
        const octx = off.getContext("2d", { willReadFrequently: true });
        if (!octx) return null;

        const srcAspect = img.naturalWidth / img.naturalHeight;
        const dstAspect = cols / rows;
        let sx = 0,
            sy = 0,
            sw = img.naturalWidth,
            sh = img.naturalHeight;

        if (srcAspect > dstAspect) {
            sw = img.naturalHeight * dstAspect;
            sx = (img.naturalWidth - sw) / 2;
        } else {
            sh = img.naturalWidth / dstAspect;
            sy = (img.naturalHeight - sh) / 2;
        }

        try {
            octx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
            const data = octx.getImageData(0, 0, cols, rows).data;
            const grid = new Float32Array(cols * rows);

            for (let i = 0; i < cols * rows; i++) {
                const r = data[i * 4];
                const g = data[i * 4 + 1];
                const b = data[i * 4 + 2];
                const a = data[i * 4 + 3];
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const hasTransparency = a < 250;
                let density = hasTransparency ? a / 255 : 1 - luminance;
                if (maskInvert) density = 1 - density;
                grid[i] = shapeDensity(density);
            }
            return grid;
        } catch (err) {
            // Most likely a CORS-tainted canvas from a cross-origin image without proper headers.
            console.warn(
                "[LetterField] could not read mask image pixels (CORS?), ignoring it.",
                err,
            );
            return null;
        }
    }

    function resampleAllMasks() {
        maskGridsArr = loadedImages.map((img) => sampleImageToGrid(img));
    }

    function scheduleCycle() {
        clearInterval(cycleTimer);
        if (loadedImages.length < 2) return;

        cycleTimer = setInterval(() => {
            currentMaskIndex = (currentMaskIndex + 1) % loadedImages.length;
        }, maskCycleMs);
    }

    async function ensureMasksLoaded() {
        const list = resolveImageList();
        const key = list
            .map((item) => (typeof item === "string" ? item : `el:${item.src}`))
            .join("|");

        if (key === loadedSrcKey && (loadedImages.length || !list.length))
            return;
        loadedSrcKey = key;

        if (!list.length) {
            loadedImages = [];
            maskGridsArr = [];
            clearInterval(cycleTimer);
            return;
        }

        const results = await Promise.all(list.map(loadOneImage));
        loadedImages = results.filter((img): img is HTMLImageElement => !!img);
        currentMaskIndex = 0;

        resampleAllMasks();
        scheduleCycle();
    }

    function getMaskDensity(i: number): number {
        if (!maskGridsArr.length) return 1;
        return maskGridsArr[currentMaskIndex]?.[i] ?? 1;
    }

    function buildGrid() {
        if (!container || !canvas) return;
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        widthPx = rect.width;
        heightPx = rect.height;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(widthPx * dpr);
        canvas.height = Math.round(heightPx * dpr);
        canvas.style.width = `${widthPx}px`;
        canvas.style.height = `${heightPx}px`;

        ctx = canvas.getContext("2d");
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

        const aspect = widthPx / heightPx || 1;
        rows = Math.max(4, Math.round(Math.sqrt(targetCellCount / aspect)));
        cols = Math.max(4, Math.round(targetCellCount / rows));
        cellW = widthPx / cols;
        cellH = heightPx / rows;

        const signalPositions = computeSignalPositions(text, cols, rows);
        const centerCol = cols / 2;

        charGrid = [];
        isSignalGrid = [];
        phaseGrid = [];
        signalDelayGrid = [];

        for (let i = 0; i < cols * rows; i++) {
            const signalChar = signalPositions.get(i);
            const isSignal = signalChar !== undefined;
            charGrid.push(signalChar ?? randomGlyph());
            isSignalGrid.push(isSignal);
            phaseGrid.push(Math.random() * Math.PI * 2);
            signalDelayGrid.push(
                isSignal ? Math.abs((i % cols) - centerCol) * 40 : 0,
            );
        }

        readThemeColors();
        resampleAllMasks(); // cheap re-crop of already-loaded images to the new grid size
        triggerReveal();
    }

    function triggerReveal() {
        const maxDelay = signalDelayGrid.length
            ? Math.max(0, ...signalDelayGrid)
            : 0;
        revealDuration = maxDelay + 400;
        revealState.value = 0;
        animate(revealState, {
            value: [0, 1],
            duration: revealDuration,
            ease: "outQuad",
        });
    }

    function swapNoiseBatch() {
        for (let n = 0; n < 6; n++) {
            const idx = Math.floor(Math.random() * charGrid.length);
            if (!isSignalGrid[idx]) charGrid[idx] = randomGlyph();
        }
    }

    function draw(time: number) {
        if (!ctx) return;
        const reduced = prefersReducedMotion();

        ctx.clearRect(0, 0, widthPx, heightPx);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${Math.round(Math.min(cellW, cellH) * 0.65)}px ui-monospace, "SF Mono", Consolas, monospace`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const i = row * cols + col;
                const isSignal = isSignalGrid[i];
                const x = col * cellW + cellW / 2;
                const y = row * cellH + cellH / 2;
                const density = getMaskDensity(i);

                let alpha: number;
                if (isSignal) {
                    ctx.fillStyle = signalColor;
                    alpha = reduced
                        ? 1
                        : Math.max(
                              0,
                              Math.min(
                                  1,
                                  (revealState.value * revealDuration -
                                      signalDelayGrid[i]) /
                                      400,
                              ),
                          );
                } else {
                    ctx.fillStyle = noiseColor;
                    const base = reduced
                        ? 0.2
                        : 0.05 +
                          0.4 *
                              (0.5 + 0.5 * Math.sin(time / 900 + phaseGrid[i]));
                    // maskFloor keeps a faint ambient noise floor outside the mask so the
                    // whole field still reads as "static" rather than hard-cutting to empty.
                    alpha = base * (maskFloor + (1 - maskFloor) * density);
                }

                if (alpha <= 0.02) continue;
                ctx.globalAlpha = alpha;
                ctx.fillText(charGrid[i], x, y);
            }
        }
        ctx.globalAlpha = 1;

        if (!reduced && time - lastGlyphSwap > 60) {
            swapNoiseBatch();
            lastGlyphSwap = time;
        }
    }

    function loop(time: number) {
        if (!active || !isVisible) return;
        draw(time);
        rafId = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (rafId) cancelAnimationFrame(rafId);
        if (prefersReducedMotion()) {
            draw(0);
            return;
        }
        rafId = requestAnimationFrame(loop);
    }

    function stopLoop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = undefined;
    }

    function scheduleRebuild() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            buildGrid();
            if (active && isVisible) startLoop();
        }, 150);
    }

    onMount(() => {
        readSimpleMode();
        simpleModeObserver = new MutationObserver(readSimpleMode);
        simpleModeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-simple-mode"],
        });

        if (!simpleMode) {
            buildGrid();
            ensureMasksLoaded();
            if (active) startLoop();

            resizeObserver = new ResizeObserver(scheduleRebuild);
            resizeObserver.observe(container);

            intersectionObserver = new IntersectionObserver(
                ([entry]) => {
                    isVisible = entry.isIntersecting;
                    if (isVisible && active && !simpleMode) startLoop();
                    else stopLoop();
                },
                { threshold: 0 },
            );
            intersectionObserver.observe(container);
        }
    });

    onDestroy(() => {
        stopLoop();
        clearTimeout(resizeTimer);
        clearInterval(cycleTimer);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        simpleModeObserver?.disconnect();
    });

    $effect(() => {
        if (simpleMode) {
            stopLoop();
            clearInterval(cycleTimer);
            if (canvas) {
                canvas.width = 0;
                canvas.height = 0;
            }
            return;
        }

        if (container && canvas && !charGrid.length) {
            buildGrid();
            ensureMasksLoaded();
        }
        if (active && isVisible) startLoop();
    });

    $effect(() => {
        text;
        if (container && canvas) buildGrid();
    });

    $effect(() => {
        maskImage;
        maskImages;
        ensureMasksLoaded();
    });

    $effect(() => {
        if (active && isVisible && !simpleMode) startLoop();
        else stopLoop();
    });
</script>

<div
    class="letter-field"
    class:simple-mode-hidden={simpleMode}
    bind:this={container}
    aria-hidden="true"
>
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .letter-field {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .letter-field.simple-mode-hidden {
        display: none;
    }

    .letter-field canvas {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
