<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let {
        color = "currentColor",
        size,
    }: {
        color?: string;
        size?: number;
    } = $props();

    let container: HTMLDivElement;
    let animation: any;

    onMount(async () => {
        const { animate } = await import("animejs");

        animation = animate(container.querySelectorAll(".cell"), {
            scale: [1, 0.1, 1],
            duration: 900,
            delay: (_: any, i: number) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return (row + col) * 120;
            },
            ease: "inOutCirc",
            loop: true,
        });
    });

    onDestroy(() => {
        animation?.pause();
    });
</script>

<div
    class="wave-grid"
    bind:this={container}
    style:width={size ? `${size}px` : undefined}
    style:height={size ? `${size}px` : undefined}
    role="status"
    aria-label="Loading"
>
    {#each Array(9) as _}
        <div class="cell" style:background={color}></div>
    {/each}
</div>

<style>
    .wave-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5%;
        width: 100%;
        aspect-ratio: 1;
    }
    .cell {
        border-radius: 0px;
        transform-origin: center;
    }
</style>
