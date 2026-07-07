<script>
    import { ArrowForward, Person } from "@material-symbols-svg/svelte";
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

<section class="name-section">
    <div class="icon-badge" aria-hidden="true">
        <Person size={42} />
    </div>

    <div class="intro">
        <h1>¿Cuál es tu nombre?</h1>
        <p>Esto puede ser cambiado en tu perfil más tarde</p>
    </div>

    <form class="name-form" onsubmit={handleSubmit}>
        <label class="input-shell" for="name">
            <span class="input-icon" aria-hidden="true">
                <Person size={28} />
            </span>
            <input
                id="name"
                type="text"
                bind:value={name}
                placeholder="Ingresa tu nombre (Opcional)"
            />
        </label>

        <div class="button-group">
            <StyledLink onclick={onSkip} class="skip-btn">Saltar</StyledLink>

            <button type="submit" class="submit-btn">
                <span>Continuar</span>
                <ArrowForward size={26} />
            </button>
        </div>
    </form>
</section>

<style>
    .name-section {
        width: min(100%, 620px);
        padding: clamp(2rem, 5vw, 4rem) 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .icon-badge {
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        margin-bottom: 2rem;
        border-radius: 999px;
        color: var(--primary-color);
        background:
            radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.7), transparent 46%),
            color-mix(in srgb, var(--primary-container-color) 55%, var(--panel-surface));
        box-shadow: 0 18px 50px rgba(46, 98, 140, 0.1);
    }

    .intro {
        margin-bottom: 2rem;
    }

    h1 {
        color: var(--primary-color);
        font-size: clamp(2.35rem, 4.4vw, 3.25rem);
        line-height: 1;
        letter-spacing: 0;
        margin-bottom: 1.15rem;
    }

    p {
        color: var(--muted-text-color);
        font-size: 1rem;
        line-height: 1.5;
    }

    .name-form {
        width: min(100%, 500px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
    }

    .input-shell {
        width: 100%;
        min-height: 4.35rem;
        display: flex;
        align-items: center;
        gap: 1.15rem;
        padding: 0 1.3rem;
        border: 1.5px solid color-mix(in srgb, var(--primary-color) 58%, transparent);
        border-radius: 8px;
        background: color-mix(in srgb, var(--panel-surface) 82%, white);
        box-shadow: 0 18px 50px rgba(19, 40, 56, 0.06);
        transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background-color 0.18s ease;
    }

    .input-shell:focus-within {
        border-color: var(--primary-color);
        box-shadow:
            0 18px 48px rgba(46, 98, 140, 0.12),
            0 0 0 4px color-mix(in srgb, var(--primary-color) 14%, transparent);
    }

    .input-icon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        color: color-mix(in srgb, var(--primary-color) 55%, var(--muted-text-color));
    }

    input {
        width: 100%;
        min-width: 0;
        background: transparent;
        color: var(--text-color);
        font-size: 1.05rem;
        font-weight: 500;
    }

    input::placeholder {
        color: color-mix(in srgb, var(--muted-text-color) 62%, transparent);
    }

    .button-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
    }

    :global(.skip-btn) {
        color: var(--primary-color);
        font-size: 1rem;
        font-weight: 800;
        text-decoration: underline;
        text-decoration-style: dotted;
        text-underline-offset: 0.3rem;
    }

    .submit-btn {
        min-width: 220px;
        height: 3.25rem;
        padding: 0 1.6rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.85rem;
        border-radius: 8px;
        background: var(--primary-color);
        color: var(--text-color-light);
        font-size: 1rem;
        font-weight: 800;
        box-shadow: 0 18px 42px rgba(46, 98, 140, 0.18);
        transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            filter 0.18s ease;
    }

    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 22px 48px rgba(46, 98, 140, 0.24);
        filter: brightness(1.04);
    }

    :global(:root[data-theme="dark"]) .icon-badge {
        background:
            radial-gradient(circle at 35% 25%, rgba(143, 199, 255, 0.24), transparent 48%),
            color-mix(in srgb, var(--primary-container-color) 44%, #101820);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
    }

    :global(:root[data-theme="dark"]) .input-shell {
        background: color-mix(in srgb, var(--field-surface) 78%, #17212a);
        border-color: color-mix(in srgb, var(--primary-color) 42%, transparent);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
    }

    @media (max-width: 640px) {
        .name-section {
            padding-inline: 1rem;
        }

        .icon-badge {
            width: 62px;
            height: 62px;
            margin-bottom: 1.6rem;
        }

        .input-shell {
            min-height: 4.8rem;
            padding: 0 1.2rem;
        }

        .button-group {
            flex-direction: column;
            gap: 1.2rem;
        }

        .submit-btn {
            width: 100%;
            min-width: 0;
        }
    }
</style>
