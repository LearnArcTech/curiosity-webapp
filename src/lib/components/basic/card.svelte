<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        children,
        ...rest
    }: HTMLAttributes<HTMLElement> & { children: Snippet } = $props();
</script>

<main {...rest}>
    {@render children()}
</main>

<style>
    main {
        display: flex;
        gap: 2rem;
        border: 1px solid var(--border-color);
        padding: 1rem;
        border-radius: var(--radius);
        align-items: center;
    }
</style>
