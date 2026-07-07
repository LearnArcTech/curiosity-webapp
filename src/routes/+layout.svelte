<script>
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import { page } from "$app/state";
    import CuriosityHeader from "$lib/components/basic/curiosity-header.svelte";
    import CuriosityFooter from "$lib/components/basic/curiosity-footer.svelte";

    let { children, data } = $props();
    let user = $derived(data.user);
    let isOnboarding = $derived(page.url.pathname.startsWith("/onboarding"));
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Curiosity</title>
</svelte:head>

<main>
    {#if user != null && !isOnboarding}
        <CuriosityHeader
            isAuthenticated={true}
            username={user?.username ?? ""}
        />
    {/if}

    <div class="main-content">
        {@render children()}
    </div>

    {#if user != null && !isOnboarding}
        <CuriosityFooter isAuthenticated={true} />
    {/if}
</main>

<style>
    main {
        display: grid;
        grid-template-rows: auto 1fr auto;
        width: 100vw;
        height: 100vh;
    }

    .main-content {
        overflow: auto;
    }
</style>
