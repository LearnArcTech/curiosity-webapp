<script>
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import CuriosityHeader from "$lib/components/basic/curiosity-header.svelte";
    import CuriosityFooter from "$lib/components/basic/curiosity-footer.svelte";
    let { children, data } = $props();
    let user = $derived(data.user);

    $effect(() => {
        const html = document.documentElement;
        html.setAttribute("data-font-size", data.prefs?.font_size ?? "medium");
        html.setAttribute("data-contrast", data.prefs?.contrast ?? "normal");
        html.toggleAttribute(
            "data-simple-mode",
            data.prefs?.simple_mode ?? false,
        );
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Curiosity</title>
</svelte:head>

<main>
    <CuriosityHeader
        isAuthenticated={user != null}
        username={user?.username ?? ""}
    />
    <div class="main-content">
        {@render children()}
    </div>
    <CuriosityFooter isAuthenticated={user != null} />
</main>

<style>
    main {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        width: 100vw;
        height: 100vh;
    }

    .main-content {
        overflow: auto;
        min-height: 0;
    }

    @media (max-height: 750px) {
        main {
            height: auto;
            min-height: 100vh;
        }
        .main-content {
            overflow: visible;
        }
    }
    @media (max-width: 640px) {
        main {
            height: auto;
            min-height: 100vh;
        }
        .main-content {
            overflow: visible;
        }
    }
</style>
