<script lang="ts">
    import type { SessionParticipant } from "$lib/api";

    interface Props {
        participants: SessionParticipant[];
    }

    const { participants }: Props = $props();
</script>

<div class="participants-panel">
    {#each participants as p (p.id)}
        <div class="participant-tile" class:hand-raised={p.hand_raised}>
            {#if p.hand_raised}
                <div class="hand-indicator-badge" title="Mano levantada">
                    ✋
                </div>
            {/if}
            <div class="p-avatar">{p.username[0].toUpperCase()}</div>
            <span class="p-label">{p.username}</span>
        </div>
    {/each}
    {#if participants.length === 0}
        <p class="empty-hint">No hay participantes admitidos aún.</p>
    {/if}
</div>

<style>
    .participants-panel {
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    }

    .participant-tile {
        background-color: rgba(255, 255, 255, 0.07);
        border-radius: var(--radius);
        aspect-ratio: 16 / 9;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        border: 2px solid transparent;
    }

    .participant-tile.hand-raised {
        border-color: var(--primary-color);
        box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
    }

    .hand-indicator-badge {
        position: absolute;
        top: 6px;
        right: 8px;
        background-color: var(--primary-color);
        color: white;
        font-size: 0.8rem;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .p-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: 1.3rem;
        font-weight: 700;
        color: white;
    }

    .p-label {
        position: absolute;
        bottom: 7px;
        left: 8px;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.9);
        background: rgba(0, 0, 0, 0.5);
        padding: 2px 7px;
        border-radius: 2px;
    }

    .empty-hint {
        color: rgba(255, 255, 255, 0.28);
        font-size: 0.8rem;
        text-align: center;
        padding: 20px 10px;
        margin: 0;
    }
</style>
