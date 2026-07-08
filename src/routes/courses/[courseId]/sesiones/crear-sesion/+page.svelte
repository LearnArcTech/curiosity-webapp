<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { sessions, type SessionRow } from "$lib/api";
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

    let activeSessions = $state<SessionRow[]>([]);
    let checkingActive = $state(true);
    let confirmedProceed = $state(false);

    let closingIds = $state<Set<string>>(new Set());
    let closingAll = $state(false);
    let closeErrorMessage = $state("");

    const courseId = $derived(page.params.courseId);

    const showActiveWarning = $derived(
        activeSessions.length > 0 && !confirmedProceed,
    );

    onMount(async () => {
        try {
            activeSessions = await sessions.listActiveForTeacher();
        } catch (err) {
            console.error("No se pudo verificar sesiones activas:", err);
        } finally {
            checkingActive = false;
        }
    });

    async function handleCreateSession(e: SubmitEvent) {
        e.preventDefault();
        if (!validate()) return;

        if (showActiveWarning) {
            return;
        }

        await doCreateSession();
    }

    function validate(): boolean {
        if (!sessionName.trim()) {
            errorMessage = "El nombre de la sesión es requerido.";
            return false;
        }
        if (requirePassword && !sessionPassword.trim()) {
            errorMessage =
                "Has activado el uso de contraseña, por favor ingresa una clave.";
            return false;
        }
        if (!courseId) {
            errorMessage = "Algo ha salido mal. Intenta mas tarde.";
            return false;
        }
        errorMessage = "";
        return true;
    }

    async function doCreateSession() {
        isSubmitting = true;
        errorMessage = "";
        try {
            const result = await sessions.create(
                courseId!,
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

    function confirmProceedAnyway() {
        confirmedProceed = true;
    }

    async function closeSession(sessionId: string) {
        closeErrorMessage = "";
        closingIds = new Set(closingIds).add(sessionId);
        try {
            await sessions.end(sessionId);
            activeSessions = activeSessions.filter((s) => s.id !== sessionId);
        } catch (err: any) {
            console.error("No se pudo cerrar la sesión:", err);
            closeErrorMessage =
                err?.message || "No se pudo cerrar una de las sesiones.";
        } finally {
            const next = new Set(closingIds);
            next.delete(sessionId);
            closingIds = next;
        }
    }

    async function closeAllSessions() {
        closeErrorMessage = "";
        closingAll = true;
        const idsToClose = activeSessions.map((s) => s.id);
        const results = await Promise.allSettled(
            idsToClose.map((id) => sessions.end(id)),
        );

        const failedIds = new Set<string>();
        results.forEach((result, i) => {
            if (result.status === "rejected") failedIds.add(idsToClose[i]);
        });

        activeSessions = activeSessions.filter((s) => failedIds.has(s.id));

        if (failedIds.size > 0) {
            closeErrorMessage =
                failedIds.size === 1
                    ? "No se pudo cerrar una de las sesiones."
                    : `No se pudieron cerrar ${failedIds.size} sesiones.`;
        }

        closingAll = false;
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

        {#if showActiveWarning}
            <div class="active-session-warning" role="alert">
                <p class="warning-title">
                    {activeSessions.length === 1
                        ? "Tienes una sesión activa"
                        : `Tienes ${activeSessions.length} sesiones activas`}
                </p>
                <p class="warning-text">
                    Debes cerrarlas o confirmar que deseas crear otra sesión de
                    todas formas.
                </p>

                {#if closeErrorMessage}
                    <p class="warning-text warning-error">
                        {closeErrorMessage}
                    </p>
                {/if}

                <ul class="active-session-list">
                    {#each activeSessions as session (session.id)}
                        <li class="active-session-item">
                            <span class="active-session-name"
                                >{session.name}</span
                            >
                            <VariantButton
                                variant="secondary-light"
                                onclick={() => closeSession(session.id)}
                                disabled={closingIds.has(session.id) ||
                                    closingAll}
                            >
                                {#if closingIds.has(session.id)}
                                    <WaveLoader size={14} />
                                    <span>Cerrando...</span>
                                {:else}
                                    <span>Cerrar sesión</span>
                                {/if}
                            </VariantButton>
                        </li>
                    {/each}
                </ul>

                <div class="warning-actions">
                    {#if activeSessions.length > 1}
                        <VariantButton
                            variant="secondary-light"
                            onclick={closeAllSessions}
                            disabled={closingAll || closingIds.size > 0}
                        >
                            {#if closingAll}
                                <WaveLoader size={16} />
                                <span>Cerrando todas...</span>
                            {:else}
                                <span>Cerrar todas</span>
                            {/if}
                        </VariantButton>
                    {/if}
                    <VariantButton
                        variant="secondary-dark"
                        onclick={confirmProceedAnyway}
                        disabled={closingAll}
                    >
                        Crear de todas formas
                    </VariantButton>
                </div>
            </div>
        {/if}

        <VariantButton type="submit" disabled={isSubmitting || checkingActive}>
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
        color: var(--primary-color);
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
        font-size: calc(1rem * var(--font-scale));
        font-weight: 600;
        color: var(--text-color);
    }

    .toggle-subdescription {
        font-size: calc(0.8rem * var(--font-scale));
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
        font-size: calc(0.8rem * var(--font-scale));
        margin: 1rem 0;
    }

    .active-session-warning {
        background-color: var(--error-container-color);
        border: 1px solid var(--error-color);
        border-radius: var(--radius);
        padding: 16px;
        margin: 1rem 0;
    }

    .warning-title {
        font-weight: 600;
        color: var(--error-color);
        margin: 0 0 6px 0;
        font-size: calc(0.95rem * var(--font-scale));
    }

    .warning-text {
        color: var(--text-color);
        font-size: calc(0.85rem * var(--font-scale));
        line-height: 1.4;
        margin: 0 0 12px 0;
    }

    .warning-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .active-session-list {
        list-style: none;
        margin: 0 0 12px 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .active-session-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background-color: var(--white);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 8px 12px;
    }

    .active-session-name {
        font-size: calc(0.9rem * var(--font-scale));
        color: var(--text-color);
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .warning-error {
        color: var(--error-color);
        font-weight: 600;
    }
</style>
