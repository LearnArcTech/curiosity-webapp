<script lang="ts">
    import type { SessionParticipant } from "$lib/api";
    interface Props {
        participants: SessionParticipant[];
    }
    const { participants }: Props = $props();
</script>

<ul class="participants-panel">
    {#each participants as p (p.id)}
        <li
            class="participant-tile"
            class:hand-raised={p.hand_raised}
            aria-label={p.hand_raised
                ? `${p.username}, mano levantada`
                : p.username}
        >
            {#if p.hand_raised}
                <div class="hand-indicator-badge" aria-hidden="true">✋</div>
            {/if}
            <div class="p-avatar" aria-hidden="true">
                {p.username[0].toUpperCase()}
            </div>
            <span class="p-label" aria-hidden="true">{p.username}</span>
        </li>
    {/each}
    {#if participants.length === 0}
        <p class="empty-hint">No hay participantes admitidos aún.</p>
    {/if}
</ul>

<style>
    .participants-panel {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--text-color-light) transparent;
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .participant-tile {
        background-color: var(--neutral-surface-variant);
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
            border-color var(--motion-duration),
            box-shadow var(--motion-duration);
        border: var(--border-width) solid transparent;
    }
    .participant-tile.hand-raised {
        border-color: var(--primary-color);
        box-shadow: 0 0 10px var(--primary-color);
    }
    .hand-indicator-badge {
        position: absolute;
        top: 0.375rem;
        right: 0.5rem;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        font-size: calc(0.8rem * var(--font-scale));
        width: 1.375rem;
        height: 1.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .p-avatar {
        width: 3.125rem;
        height: 3.125rem;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: calc(1.3rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
    }
    .p-label {
        position: absolute;
        bottom: 0.44rem;
        left: 0.5rem;
        font-size: calc(0.7rem * var(--font-scale));
        color: var(--text-color-light);
        background: rgba(0, 0, 0, 0.5);
        padding: 0.125rem 0.44rem;
        border-radius: 2px;
    }
    .empty-hint {
        color: var(--text-color);
        opacity: 0.5;
        font-size: calc(0.8rem * var(--font-scale));
        text-align: center;
        padding: 1.25rem 0.625rem;
        margin: 0;
    }
</style>
