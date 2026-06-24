<script lang="ts">
    import { sessions, type SessionRow } from "$lib/api";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import DataGrid from "$lib/components/data/data-grid.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { CloudAlert } from "@material-symbols-svg/svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import { untrack } from "svelte";

    let { data } = $props();

    const courseId = $derived(page.params.courseId);
    let role = $derived(data.user?.role ?? "student");

    let sessionList = $state<SessionRow[]>([]);
    let isLoading = $state(true);
    let errorMessage = $state<string | null>(null);

    let isDeleteDialogOpen = $state(false);
    let sessionIdToDelete = $state<string | null>(null);
    let isDeleting = $state(false);
    let deleteErrorMessage = $state("");

    $effect(() => {
        if (!courseId) return;

        const currentCourseId = courseId;
        let unsubscribe: (() => void) | undefined;

        untrack(() => {
            fetchSessions();
            unsubscribe = sessions.subscribeToCourse(currentCourseId, () => {
                fetchSessions();
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    });

    async function fetchSessions() {
        if (sessionList.length === 0) isLoading = true;
        errorMessage = null;
        if (!courseId) return;
        try {
            sessionList = await sessions.list(courseId);
        } catch (error: any) {
            errorMessage = error?.message || "Error al cargar sesiones.";
        } finally {
            isLoading = false;
        }
    }

    function handleJoin(session: SessionRow) {
        if (session.is_active) {
            goto(`/join/${session.id}`);
        }
    }

    function prepareDelete(id: string) {
        sessionIdToDelete = id;
        deleteErrorMessage = "";
        isDeleteDialogOpen = true;
    }

    async function confirmDelete() {
        if (!sessionIdToDelete) return;

        isDeleting = true;
        deleteErrorMessage = "";

        try {
            await sessions.remove(sessionIdToDelete);
            sessionList = sessionList.filter((s) => s.id !== sessionIdToDelete);

            isDeleteDialogOpen = false;
            sessionIdToDelete = null;
        } catch (error: any) {
            deleteErrorMessage =
                error?.message ||
                "No se pudo eliminar la sesión correctamente.";
        } finally {
            isDeleting = false;
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
        });
    }
</script>

<div class="sessions-page">
    <div class="page-header">
        <h1 class="title">Historial de Sesiones</h1>
    </div>

    {#if isLoading}
        <div class="state-container loading-wrapper">
            <WaveLoader size={28} />
            <p>Cargando historial de sesiones de la clase...</p>
        </div>
    {:else if errorMessage}
        <div class="state-container error-wrapper">
            <CloudAlert size={32} />
            <p>{errorMessage}</p>
            <VariantButton class="retry-btn" onclick={fetchSessions}>
                Reintentar consulta
            </VariantButton>
        </div>
    {:else}
        <DataGrid
            items={sessionList}
            searchPlaceholder="Buscar sesión por nombre..."
            searchKeys={["name"]}
        >
            {#snippet card({ item: session })}
                <div
                    class="session-card"
                    class:active-session={session.is_active}
                >
                    <div class="card-body">
                        <div class="card-meta">
                            <span class="session-id">ID: {session.id}</span>
                            <span
                                class="status-badge"
                                class:active={session.is_active}
                            >
                                {session.is_active ? "En Vivo" : "Finalizada"}
                            </span>
                        </div>

                        <h3 class="session-name">{session.name}</h3>

                        <p class="session-date">
                            Iniciada: {formatDate(session.started_at)}
                        </p>

                        <div class="session-stats">
                            <div class="stat-item">
                                <span class="stat-label">Duración</span>
                                <strong class="stat-value"
                                    >{session.duration_minutes} min</strong
                                >
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Alumnos</span>
                                <strong class="stat-value"
                                    >{session.participant_count}</strong
                                >
                            </div>
                        </div>
                    </div>

                    <div class="card-actions">
                        {#if session.is_active}
                            <VariantButton onclick={() => handleJoin(session)}>
                                Entrar
                            </VariantButton>
                        {/if}
                        {#if role === "teacher"}
                            <VariantButton
                                variant="secondary-dark"
                                onclick={() => prepareDelete(session.id)}
                            >
                                Eliminar
                            </VariantButton>
                        {/if}
                    </div>
                </div>
            {/snippet}
        </DataGrid>
    {/if}

    <Dialog bind:open={isDeleteDialogOpen} title="¿Eliminar sesión?">
        {#snippet children()}
            <p class="dialog-text">
                ¿Está seguro de que desea eliminar permanentemente esta sesión?
                Si la sesión se encuentra activa en este momento, se cerrará de
                forma automática antes de ser removida del historial.
            </p>

            {#if deleteErrorMessage}
                <div class="dialog-error-banner">
                    {deleteErrorMessage}
                </div>
            {/if}
        {/snippet}

        {#snippet footer()}
            <VariantButton
                variant="secondary-light"
                onclick={() => (isDeleteDialogOpen = false)}
                disabled={isDeleting}
            >
                Cancelar
            </VariantButton>

            <VariantButton
                variant="secondary-dark"
                onclick={confirmDelete}
                disabled={isDeleting}
            >
                {#if isDeleting}
                    <WaveLoader size={16} />
                    <span>Eliminando...</span>
                {:else}
                    <span>Eliminar</span>
                {/if}
            </VariantButton>
        {/snippet}
    </Dialog>
</div>

<style>
    .sessions-page {
        width: 100%;
        font-family: var(--font-body);
        color: var(--text-color);
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
    }

    .title {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
    }

    .state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 32px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        gap: 12px;
    }

    .error-wrapper {
        border-color: var(--error-container-color);
        color: var(--error-color);
        background-color: var(--error-container-color);
    }

    :global(.retry-btn) {
        margin-top: 8px;
    }

    .session-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-color: var(--neutral-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 20px;
        height: 100%;
        box-sizing: border-box;
        transition:
            transform 0.15s ease,
            border-color 0.15s ease;
    }

    .session-card.active-session {
        border-color: var(--secondary-color);
    }

    .card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .session-id {
        font-size: 0.8rem;
        color: var(--border-color);
        font-family: monospace;
    }

    .status-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: var(--radius);
        background-color: var(--neutral-surface-variant);
        color: var(--text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-badge.active {
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .session-name {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }

    .session-date {
        font-size: 0.9rem;
        margin: 0;
        opacity: 0.8;
    }

    .session-stats {
        display: flex;
        gap: 24px;
        margin-top: 4px;
        padding-top: 12px;
        border-top: 1px dashed var(--neutral-surface-variant);
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--border-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-value {
        font-size: 1rem;
    }

    .card-actions {
        display: flex;
        gap: 8px;
        margin-top: 20px;
    }

    .dialog-text {
        font-family: var(--font-body);
        font-size: 0.95rem;
        line-height: 1.5;
        color: var(--text-color);
        margin: 0;
    }

    .dialog-error-banner {
        color: var(--error-color);
        background-color: var(--error-container-color);
        border: 1px solid var(--error-color);
        border-radius: var(--radius);
        padding: 10px 12px;
        font-size: 0.85rem;
        font-family: var(--font-body);
        margin-top: 8px;
    }
</style>
