<script lang="ts">
    import type { Snippet } from "svelte";
    import HelpSidebar from "$lib/components/sidebar/HelpSidebar.svelte";

    let {
        data,
        children,
    }: {
        data: { isAuthenticated: boolean };
        children: Snippet;
    } = $props();
</script>

<div class="help-layout">
    <HelpSidebar isAuthenticated={data.isAuthenticated} />
    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .help-layout {
        display: flex;
        height: 100%;
        min-height: 0;
        flex: 1;
    }
    .content {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
    }
</style>
