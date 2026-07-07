<script>
    import { CoPresent, School } from "@material-symbols-svg/svelte";

    let { onContinue } = $props();

    /**
     * @type {string | null}
     */
    let selectedRole = $state(null);

    /**
     * @param {string | null} role
     */
    function selectRole(role) {
        selectedRole = role;
    }

    function handleContinue() {
        if (selectedRole && onContinue) {
            onContinue(selectedRole);
        }
    }
</script>

<section class="role-section">
    <div class="role-intro">
        <h1>¿Cuál es tu rol?</h1>
        <p>Cambiar tu rol más tarde eliminará todos tus datos de usuario.</p>
    </div>

    <div class="role-cards" aria-label="Selecciona tu rol">
        <button
            type="button"
            class:selected={selectedRole === "student"}
            class="role-card"
            onclick={() => selectRole("student")}
            aria-pressed={selectedRole === "student"}
        >
            <span class="icon-badge" aria-hidden="true">
                <School size={38} />
            </span>
            <span class="role-name">Estudiante</span>
            <span class="role-description">
                Acceder reuniones, quizzes y cursos
            </span>
        </button>

        <button
            type="button"
            class:selected={selectedRole === "teacher"}
            class="role-card"
            onclick={() => selectRole("teacher")}
            aria-pressed={selectedRole === "teacher"}
        >
            <span class="icon-badge" aria-hidden="true">
                <CoPresent size={38} />
            </span>
            <span class="role-name">Profesor</span>
            <span class="role-description">
                Crear reuniones, cursos y quizzes
            </span>
        </button>
    </div>

    <button
        type="button"
        class="submit-btn"
        disabled={!selectedRole}
        onclick={handleContinue}
    >
        Continuar
    </button>
</section>

<style>
    .role-section {
        width: min(100%, 620px);
        padding: clamp(2rem, 5vw, 4rem) 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .role-intro {
        margin-bottom: 2.4rem;
    }

    h1 {
        color: var(--primary-color);
        font-size: clamp(2.35rem, 4.4vw, 3.25rem);
        line-height: 1;
        letter-spacing: 0;
        margin-bottom: 1rem;
    }

    p {
        color: var(--muted-text-color);
        font-size: 1rem;
        line-height: 1.55;
    }

    .role-cards {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2rem;
        width: 100%;
        margin-bottom: 2rem;
    }

    .role-card {
        min-height: 235px;
        padding: 1.75rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        border: 1px solid var(--soft-border-color);
        border-radius: 8px;
        background: var(--panel-surface);
        color: var(--text-color);
        box-shadow: 0 18px 50px rgba(19, 40, 56, 0.06);
        transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background-color 0.18s ease,
            box-shadow 0.18s ease;
    }

    .role-card:hover {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--primary-color) 35%, transparent);
        box-shadow: 0 22px 58px rgba(19, 40, 56, 0.1);
    }

    .role-card.selected {
        border-color: color-mix(in srgb, var(--primary-color) 48%, transparent);
        background: color-mix(in srgb, var(--primary-container-color) 22%, var(--panel-surface));
        box-shadow: 0 22px 60px rgba(46, 98, 140, 0.14);
    }

    .icon-badge {
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        border-radius: 999px;
        color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-container-color) 45%, white);
    }

    .role-name {
        display: block;
        color: color-mix(in srgb, var(--text-color) 88%, var(--primary-color));
        font-size: 1.3rem;
        font-weight: 800;
    }

    .role-description {
        max-width: 160px;
        color: var(--muted-text-color);
        font-size: 1rem;
        line-height: 1.45;
    }

    .submit-btn {
        width: min(100%, 220px);
        height: 3.25rem;
        border-radius: 8px;
        background: var(--primary-color);
        color: var(--text-color-light);
        font-weight: 800;
        box-shadow: 0 18px 42px rgba(46, 98, 140, 0.18);
        transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
    }

    .submit-btn:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 22px 48px rgba(46, 98, 140, 0.24);
    }

    .submit-btn:disabled {
        cursor: not-allowed;
        opacity: 0.32;
        box-shadow: none;
    }

    @media (max-width: 640px) {
        .role-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .role-card {
            min-height: 190px;
        }
    }
</style>
