<script lang="ts">
    import type { SessionParticipant, StudentRow } from "$lib/api";
    import { Check, Close, RestartAlt } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    interface Props {
        participants: SessionParticipant[];
        waitingCount: number;
        courseId: string;
        studentData: Map<string, StudentRow>;
        onApprove: (id: string) => void;
        onDeny: (id: string) => void;
        onSetParticipation: (studentId: string, value: number) => Promise<void>;
        onClearParticipation: (studentId: string) => Promise<void>;
    }

    const {
        participants,
        waitingCount,
        courseId,
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

    function getEditValue(id: string): string {
        if (editingParticipation[id] !== undefined)
            return editingParticipation[id];
        return String(studentData.get(id)?.participation_value ?? 0);
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
        } finally {
            savingParticipation[id] = false;
        }
    }

    async function handleClearParticipation(id: string) {
        savingParticipation[id] = true;
        try {
            await onClearParticipation(id);
            delete editingParticipation[id];
        } finally {
            savingParticipation[id] = false;
        }
    }
</script>

<div class="panel">
    <div class="section">
        <div class="sec-header">
            <span class="sec-title">Sala de espera</span>
            {#if waitingCount > 0}
                <span class="badge red">{waitingCount}</span>
            {/if}
        </div>

        {#if waiting.length === 0}
            <p class="empty">No hay alumnos esperando.</p>
        {:else}
            <ul class="list">
                {#each waiting as s (s.id)}
                    <li class="row">
                        <div class="avatar">{s.username[0].toUpperCase()}</div>
                        <span class="name">{s.username}</span>
                        <div class="actions">
                            <button
                                class="act approve"
                                onclick={() => onApprove(s.id)}
                                title="Admitir"><Check size={15} /></button
                            >
                            <button
                                class="act deny"
                                onclick={() => onDeny(s.id)}
                                title="Rechazar"><Close size={15} /></button
                            >
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <div class="section">
        <div class="sec-header">
            <span class="sec-title">Admitidos</span>
            <span class="badge green">{approved.length}</span>
        </div>

        {#if approved.length === 0}
            <p class="empty">Ningún alumno admitido aún.</p>
        {:else}
            <ul class="list">
                {#each approved as s (s.id)}
                    {@const sd = studentData.get(s.id)}
                    <li class="row approved">
                        <div class="avatar green">
                            {s.username[0].toUpperCase()}
                        </div>
                        <div class="student-info">
                            <span class="name">{s.username}</span>
                            <div class="participation-row">
                                <span class="part-label">
                                    Participación
                                    {#if sd?.participation_is_manual}
                                        <span class="manual-tag">manual</span>
                                    {/if}
                                </span>
                                <div class="part-controls">
                                    <Input
                                        type="text"
                                        id="participacion"
                                        name="participacion"
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
                                            title="Guardar"
                                        >
                                            {#if savingParticipation[s.id]}
                                                <WaveLoader size={24}
                                                ></WaveLoader>
                                            {:else}
                                                <Check />
                                            {/if}
                                        </VariantButton>
                                    {/if}
                                    {#if sd?.participation_is_manual}
                                        <VariantButton
                                            variant="secondary-light"
                                            onclick={() =>
                                                handleClearParticipation(s.id)}
                                            disabled={savingParticipation[s.id]}
                                            title="Quitar override"
                                        >
                                            {#if savingParticipation[s.id]}
                                                <WaveLoader size={24}
                                                ></WaveLoader>
                                            {:else}
                                                <RestartAlt />
                                            {/if}</VariantButton
                                        >
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
    .panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
        overflow-y: auto;
    }

    .section {
        background-color: rgba(255, 255, 255, 0.055);
        border-radius: var(--radius);
        padding: 12px;
        flex-shrink: 0;
    }

    .sec-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
    }

    .sec-title {
        flex: 1;
        font-family: var(--font-display);
        font-size: 0.78rem;
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
        font-size: 0.68rem;
        font-weight: 700;
        padding: 1px 7px;
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
        font-size: 0.78rem;
        color: var(--text-color-light);
        margin: 0;
        text-align: center;
        padding: 6px 0;
    }

    .list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 6px 8px;
        background-color: rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
    }

    .row.approved {
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .avatar {
        width: 27px;
        height: 27px;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
    }
    .avatar.green {
        background-color: var(--secondary-color);
    }

    .name {
        flex: 1;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.82);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
    }

    .act {
        width: 26px;
        height: 26px;
        border-radius: var(--radius);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.13s;
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
