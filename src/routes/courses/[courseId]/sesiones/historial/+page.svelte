<script lang="ts">
    import { sessions, type SessionRow } from "$lib/api";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import SessionsDataGrid from "$lib/components/page-specific/sessions-datagrid.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
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
</script>

<main>
    <div class="page-header">
        <h1 class="title">Historial de Sesiones</h1>
    </div>

    <PageStatus
        loading={isLoading}
        error={errorMessage ?? ""}
        loadingMessage="Cargando historial de sesiones de la clase..."
        onRetry={fetchSessions}
    >
        {#snippet children()}
            <SessionsDataGrid
                items={sessionList}
                {role}
                onJoin={handleJoin}
                onDeleteRequest={prepareDelete}
            />
        {/snippet}
    </PageStatus>

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
</main>

<style>
    main {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
        font-family: var(--font-body);
        color: var(--text-color);
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        margin-bottom: 28px;
    }

    .title {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--primary-color);
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
