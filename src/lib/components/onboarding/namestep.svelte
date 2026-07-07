<script>
    import StyledLink from "$lib/components/basic/link.svelte";

    let { name = $bindable(""), onContinue, onSkip } = $props();

    /**
     * @param {{ preventDefault: () => void; }} event
     */
    function handleSubmit(event) {
        event.preventDefault();
        onContinue?.();
    }
</script>

<section class="form-section">
    <h1>Cual es tu nombre?</h1>
    <p class="subtitle">Esto puede ser cambiado en tu perfil más tarde</p>

    <form class="name-form" onsubmit={handleSubmit}>
        <div class="form-group">
            <input
                type="text"
                bind:value={name}
                placeholder="Ingresa tu nombre (Opcional)"
            />
        </div>

        <div class="button-group">
            <StyledLink onclick={onSkip} class="skip-btn">Saltar</StyledLink>

            <button type="submit" class="submit-btn"> Continuar </button>
        </div>
    </form>
</section>

<style>
    /* Add the same NameStep styles from the previous response here */
    .form-section {
        padding: 3rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        text-align: center;
    }
    h1 {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    .subtitle {
        font-size: 1.1rem;
        margin-bottom: 3rem;
    }
    .name-form {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .form-group {
        width: 100%;
        margin-bottom: 1.5rem;
    }
    input {
        width: 100%;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        font-size: 1rem;
    }
    .button-group {
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: center;
    }
    .submit-btn {
        padding: 12px 24px;
        background: var(--primary-color);
        color: var(--text-color-light);
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
    }
</style>
