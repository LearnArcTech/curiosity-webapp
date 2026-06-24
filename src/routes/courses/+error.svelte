<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Error } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    function handleRedirect() {
        goto("/courses");
    }
</script>

<main>
    <div class="content">
        <Error size={100} />
        <h1>Uh oh! Algo inesperado paso!</h1>
        <p>
            Nuestro equipo de duentes esta trabajando para resolver tu problema
            :)
        </p>
        <p>Error: {page.status} - {page.error?.message}</p>
        <VariantButton onclick={handleRedirect}>Ir a cursos</VariantButton>
    </div>
</main>

<style>
    main {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        text-align: center;
        align-items: center;
        max-width: 450px;
    }
</style>
