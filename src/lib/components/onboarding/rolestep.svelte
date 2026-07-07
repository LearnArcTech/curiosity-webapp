<script>
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
    <h1>Cual es tu rol?</h1>
    <p>Cambiar tu rol más tarde eliminará todos tus datos de usuario.</p>

    <div class="role-cards">
        <button
            type="button"
            class="role-card {selectedRole === 'student' ? 'selected' : ''}"
            onclick={() => selectRole("student")}
        >
            <span class="role-name">Estudiante</span>
            <span class="role-description"
                >Acceder reuniones, quizzes y cursos</span
            >
        </button>

        <button
            type="button"
            class="role-card {selectedRole === 'teacher' ? 'selected' : ''}"
            onclick={() => selectRole("teacher")}
        >
            <span class="role-name">Profesor</span>
            <span class="role-description"
                >Crear reuniones, cursos y quizzes</span
            >
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
        margin-bottom: 1rem;
    }
    p {
        font-size: 1.1rem;
        margin-bottom: 3rem;
    }
    .role-cards {
        display: flex;
        gap: 2rem;
        width: 100%;
        max-width: 600px;
        margin-bottom: 2rem;
    }
    .role-card {
        flex: 1;
        padding: 20px;
        border: 2px solid var(--border-color);
        border-radius: var(--radius);
        background: var(--white);
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .role-card.selected {
        border-color: var(--primary-color);
        background-color: var(--primary-container-color);
    }
    .role-name {
        font-size: 18px;
        font-weight: bold;
        display: block;
        margin-bottom: 0.5rem;
    }
    .submit-btn {
        padding: 12px 24px;
        background: var(--primary-color);
        color: var(--text-color-light);
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
    }
    .submit-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
</style>
