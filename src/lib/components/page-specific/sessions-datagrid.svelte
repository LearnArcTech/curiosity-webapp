<script lang="ts">
    import type { SessionRow } from "$lib/api";
    import DataGrid from "$lib/components/data/data-grid.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    let {
        items,
        role,
        onJoin,
        onDeleteRequest,
    }: {
        items: SessionRow[];
        role: string;
        onJoin: (session: SessionRow) => void;
        onDeleteRequest: (id: string) => void;
    } = $props();

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
        });
    }
</script>

<DataGrid
    {items}
    searchPlaceholder="Buscar sesión por nombre..."
    searchKeys={["name"]}
>
    {#snippet card({ item: session })}
        <div class="session-card" class:active-session={session.is_active}>
            <div class="card-body">
                <div class="card-meta">
                    <span class="session-id">ID:{session.id}</span>
                    <span class="status-badge" class:active={session.is_active}>
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
                    <VariantButton onclick={() => onJoin(session)}>
                        Entrar
                    </VariantButton>
                {/if}
                {#if role === "teacher"}
                    <VariantButton
                        variant="secondary-dark"
                        onclick={() => onDeleteRequest(session.id)}
                    >
                        Eliminar
                    </VariantButton>
                {/if}
            </div>
        </div>
    {/snippet}
</DataGrid>

<style>
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
    }

    .stat-value {
        font-size: 1rem;
    }

    .card-actions {
        display: flex;
        gap: 8px;
        margin-top: 20px;
    }
</style>
