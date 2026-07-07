<script lang="ts">
    import type { SessionParticipant, StudentRow } from "$lib/api";
    import { Check, Close, RestartAlt } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    interface Props {
        participants: SessionParticipant[];
        waitingCount: number;
        studentData: Map<string, StudentRow>;
        onApprove: (id: string) => void;
        onDeny: (id: string) => void;
        onSetParticipation: (studentId: string, value: number) => Promise<void>;
        onClearParticipation: (studentId: string) => Promise<void>;
    }

    const {
        participants,
        waitingCount,
        studentData,
        onApprove,
        onDeny,
        onSetParticipation,
        onClearParticipation,
    }: Props = $props();

    const waiting = $derived(
        participants.filter((p) => p.status === "waiting"),
    );
    const approved = $derived(
        participants.filter((p) => p.status === "approved" && !p.is_teacher),
    );

    let editingParticipation = $state<Record<string, string>>({});
    let savingParticipation = $state<Record<string, boolean>>({});
    let announcement = $state("");

    function getEditValue(id: string): string {
        if (editingParticipation[id] !== undefined)
            return editingParticipation[id];
        return String(studentData.get(id)?.participation_value ?? 0);
    }

    function handleApprove(id: string, name: string) {
        onApprove(id);
        announcement = `${name} admitido.`;
    }

    function handleDeny(id: string, name: string) {
        onDeny(id);
        announcement = `${name} rechazado.`;
    }

    async function handleSetParticipation(id: string) {
        const raw = editingParticipation[id];
        if (raw === undefined) return;
        const val = parseFloat(raw);
        if (isNaN(val)) return;
        savingParticipation[id] = true;
        try {
            await onSetParticipation(id, val);
            delete editingParticipation[id];
            announcement = "Participación guardada.";
        } finally {
            savingParticipation[id] = false;
        }
    }

    async function handleClearParticipation(id: string) {
        savingParticipation[id] = true;
        try {
            await onClearParticipation(id);
            delete editingParticipation[id];
            announcement = "Override de participación eliminado.";
        } finally {
            savingParticipation[id] = false;
        }
    }
</script>

<div class="panel">
    <div class="visually-hidden" role="status" aria-live="polite">
        {announcement}
    </div>

    <div class="section">
        <div class="sec-header">
            <span class="sec-title" id="waiting-heading">Sala de espera</span>
            {#if waitingCount > 0}
                <span class="badge red">{waitingCount}</span>
            {/if}
        </div>

        {#if waiting.length === 0}
            <p class="empty">No hay alumnos esperando.</p>
        {:else}
            <ul class="list" aria-labelledby="waiting-heading">
                {#each waiting as s (s.id)}
                    <li class="row">
                        <div class="avatar" aria-hidden="true">
                            {s.username[0].toUpperCase()}
                        </div>
                        <span class="name">{s.username}</span>
                        <div class="actions">
                            <button
                                type="button"
                                class="act approve"
                                onclick={() => handleApprove(s.id, s.username)}
                                aria-label="Admitir a {s.username}"
                            >
                                <Check size={15} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                class="act deny"
                                onclick={() => handleDeny(s.id, s.username)}
                                aria-label="Rechazar a {s.username}"
                            >
                                <Close size={15} aria-hidden="true" />
                            </button>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <div class="section">
        <div class="sec-header">
            <span class="sec-title" id="approved-heading">Admitidos</span>
            <span class="badge green">{approved.length}</span>
        </div>

        {#if approved.length === 0}
            <p class="empty">Ningún alumno admitido aún.</p>
        {:else}
            <ul class="list" aria-labelledby="approved-heading">
                {#each approved as s (s.id)}
                    {@const sd = studentData.get(s.id)}
                    <li class="row approved">
                        <div class="avatar green" aria-hidden="true">
                            {s.username[0].toUpperCase()}
                        </div>
                        <div class="student-info">
                            <span class="name">{s.username}</span>
                            <div class="participation-row">
                                <span class="part-label" id="part-label-{s.id}">
                                    Participación
                                    {#if sd?.participation_is_manual}
                                        <span class="manual-tag">manual</span>
                                    {/if}
                                </span>
                                <div class="part-controls">
                                    <label
                                        class="visually-hidden"
                                        for="part-input-{s.id}"
                                    >
                                        Participación de {s.username}
                                    </label>
                                    <Input
                                        type="number"
                                        id="part-input-{s.id}"
                                        name="part-input-{s.id}"
                                        placeholder="Participacion"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={getEditValue(s.id)}
                                        oninput={(e) => {
                                            editingParticipation[s.id] = (
                                                e.target as HTMLInputElement
                                            ).value;
                                        }}
                                        onkeydown={(e) =>
                                            e.key === "Enter" &&
                                            handleSetParticipation(s.id)}
                                        disabled={savingParticipation[s.id]}
                                    />
                                    {#if editingParticipation[s.id] !== undefined}
                                        <VariantButton
                                            variant="secondary-dark"
                                            onclick={() =>
                                                handleSetParticipation(s.id)}
                                            disabled={savingParticipation[s.id]}
                                            aria-label="Guardar participación de {s.username}"
                                            aria-busy={savingParticipation[
                                                s.id
                                            ]}
                                        >
                                            {#if savingParticipation[s.id]}
                                                <WaveLoader size={24}
                                                ></WaveLoader>
                                            {:else}
                                                <Check aria-hidden="true" />
                                            {/if}
                                        </VariantButton>
                                    {/if}
                                    {#if sd?.participation_is_manual}
                                        <VariantButton
                                            variant="secondary-light"
                                            onclick={() =>
                                                handleClearParticipation(s.id)}
                                            disabled={savingParticipation[s.id]}
                                            aria-label="Quitar override de {s.username}"
                                            aria-busy={savingParticipation[
                                                s.id
                                            ]}
                                        >
                                            {#if savingParticipation[s.id]}
                                                <WaveLoader size={24}
                                                ></WaveLoader>
                                            {:else}
                                                <RestartAlt
                                                    aria-hidden="true"
                                                />
                                            {/if}
                                        </VariantButton>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .panel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        height: 100%;
        overflow-y: auto;
    }

    .section {
        background-color: var(--background-color-dark);
        border-radius: var(--radius);
        padding: 0.75rem;
        flex-shrink: 0;
    }

    .sec-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.625rem;
    }

    .sec-title {
        flex: 1;
        font-family: var(--font-display);
        font-size: calc(0.78rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
        text-transform: uppercase;
    }

    .part-controls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .badge {
        font-size: calc(0.68rem * var(--font-scale));
        font-weight: 700;
        padding: 0.0625rem 0.44rem;
        border-radius: var(--radius);
        line-height: 1.7;
    }
    .badge.red {
        background-color: var(--error-container-color);
        color: var(--error-color);
    }

    .badge.green {
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .empty {
        font-size: calc(0.78rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.6;
        margin: 0;
        text-align: center;
        padding: 0.375rem 0;
    }

    .list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 0.44rem;
        padding: 0.375rem 0.5rem;
        background-color: var(--neutral-surface-variant);
        border-radius: var(--radius);
    }

    .row.approved {
        background-color: transparent;
        border: var(--border-width) solid var(--text-color-light);
    }

    .avatar {
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(0.72rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
        flex-shrink: 0;
    }
    .avatar.green {
        background-color: var(--secondary-color);
    }

    .name {
        flex: 1;
        font-size: calc(0.8rem * var(--font-scale));
        color: var(--text-color-light);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .actions {
        display: flex;
        gap: 0.25rem;
        flex-shrink: 0;
    }

    .act {
        width: 1.625rem;
        height: 1.625rem;
        border-radius: var(--radius);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: filter var(--motion-duration);
    }
    .act:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
    }
    .act:hover {
        filter: brightness(1.15);
    }
    .act.approve {
        background-color: var(--secondary-color);
        color: var(--secondary-container-color);
    }

    .act.deny {
        background-color: var(--error-color);
        color: var(--error-container-color);
    }
</style>
