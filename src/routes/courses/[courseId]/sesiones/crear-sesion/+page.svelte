<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { sessions } from "$lib/api";
    import Switch from "$lib/components/basic/switch.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    let sessionName = $state("");

    let requirePassword = $state(false);
    let sessionPassword = $state("");
    let requireWaitingRoom = $state(false);

    let isSubmitting = $state(false);
    let errorMessage = $state("");

    const courseId = $derived(page.params.courseId);

    async function handleCreateSession(e: SubmitEvent) {
        e.preventDefault();

        if (!sessionName.trim()) {
            errorMessage = "El nombre de la sesión es requerido.";
            return;
        }

        if (requirePassword && !sessionPassword.trim()) {
            errorMessage =
                "Has activado el uso de contraseña, por favor ingresa una clave.";
            return;
        }

        if (!courseId) {
            errorMessage = "Algo ha salido mal. Intenta mas tarde.";
            return;
        }

        isSubmitting = true;
        errorMessage = "";

        try {
            const result = await sessions.create(
                courseId,
                sessionName,
                requirePassword ? sessionPassword : "",
                requireWaitingRoom,
            );

            goto(`/session/${result.session_id}`);
        } catch (err: any) {
            console.error("Error al crear sesión:", err);
            errorMessage =
                err.message || "Hubo un error al intentar registrar la sesión.";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="create-session-container">
    <h1 class="form-title">Crear Sesión</h1>

    <form onsubmit={handleCreateSession}>
        <Input
            type="text"
            id="session-name"
            name="session-name"
            label="Nombre de la sesión"
            placeholder="Ej. Clase 01: Introducción al desarrollo"
            bind:value={sessionName}
            disabled={isSubmitting}
            required
        />

        <div class="toggle-card-box">
            <div class="toggle-info">
                <span class="toggle-label-title"
                    >Requerir contraseña de acceso</span
                >
                <span class="toggle-subdescription">
                    Los estudiantes deberán ingresar esta clave secreta antes de
                    poder unirse a la clase.
                </span>
            </div>
            <div class="toggle-action">
                <Switch
                    bind:checked={requirePassword}
                    disabled={isSubmitting}
                />
            </div>
        </div>

        {#if requirePassword}
            <div class="conditional-field">
                <Input
                    type="text"
                    id="session-password"
                    name="session-password"
                    label="Contraseña de la sesión"
                    placeholder="Ej. Alfa2026"
                    bind:value={sessionPassword}
                    disabled={isSubmitting}
                    required={requirePassword}
                />
            </div>
        {:else}
            {((sessionPassword = ""), "")}
        {/if}

        <div class="toggle-card-box">
            <div class="toggle-info">
                <span class="toggle-label-title">Activar sala de espera</span>
                <span class="toggle-subdescription">
                    Incluso con la contraseña correcta, el docente deberá
                    aprobar manualmente el ingreso de cada participante.
                </span>
            </div>
            <div class="toggle-action">
                <Switch
                    bind:checked={requireWaitingRoom}
                    disabled={isSubmitting}
                />
            </div>
        </div>

        {#if errorMessage}
            <p class="error-banner">{errorMessage}</p>
        {/if}

        <VariantButton type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
                <WaveLoader size={18} />
                <span>Creando sesión...</span>
            {:else}
                <span>Crear Sesión</span>
            {/if}
        </VariantButton>
    </form>
</div>

<style>
    .create-session-container {
        width: 100%;
    }

    .form-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-color);
        margin: 0 0 1.75rem 0;
    }

    .toggle-card-box {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        background-color: var(--white);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 16px;
        margin: 1.25rem 0;
    }

    .toggle-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .toggle-label-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .toggle-subdescription {
        font-size: 0.82rem;
        color: var(--text-color);
        line-height: 1.4;
    }

    .toggle-action {
        padding-top: 2px;
        flex-shrink: 0;
    }

    .conditional-field {
        margin: 0.5rem 0 1.25rem 0;
        animation: slideDown 0.2s ease-out;
        user-select: none;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .error-banner {
        color: var(--error-color);
        background-color: var(--error-container-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 10px;
        font-size: 0.85rem;
        margin: 1rem 0;
    }
</style>
