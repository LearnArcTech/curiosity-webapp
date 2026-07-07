<script lang="ts">
    import type {
        SessionParticipant,
        QuizResponseRow,
        SessionQuiz,
    } from "$lib/api";

    interface Props {
        quiz: SessionQuiz;
        participants: SessionParticipant[];
        responses: QuizResponseRow[];
    }

    const { quiz, participants, responses }: Props = $props();

    const responseMap = $derived(
        new Map(responses.map((r) => [r.student_id, r])),
    );

    const answeredCount = $derived(responses.length);
    const correctCount = $derived(responses.filter((r) => r.is_correct).length);
    const pendingCount = $derived(participants.length - answeredCount);

    function answerLabel(r: QuizResponseRow): string {
        if (Array.isArray(r.answer)) return (r.answer as string[]).join(", ");
        return String(r.answer);
    }

    function statusLabel(response: QuizResponseRow | undefined): string {
        if (!response) return "Pendiente";
        return response.is_correct ? "Correcta" : "Incorrecta";
    }
</script>

<div class="grid-wrapper">
    <div class="summary-bar" role="status" aria-live="polite">
        <div class="stat">
            <span class="stat-val">{answeredCount}/{participants.length}</span>
            <span class="stat-label">respondieron</span>
        </div>
        <div class="stat correct">
            <span class="stat-val">{correctCount}</span>
            <span class="stat-label">correctas</span>
        </div>
        <div class="stat wrong">
            <span class="stat-val">{answeredCount - correctCount}</span>
            <span class="stat-label">incorrectas</span>
        </div>
        <div class="stat pending">
            <span class="stat-val">{pendingCount}</span>
            <span class="stat-label">pendientes</span>
        </div>
    </div>

    <ul class="student-grid">
        {#each participants as p (p.id)}
            {@const response = responseMap.get(p.id)}
            <li
                class="student-card"
                class:correct={response?.is_correct === true}
                class:wrong={response?.is_correct === false}
                aria-label="@{p.username}: {statusLabel(response)}{response
                    ? `, respuesta: ${answerLabel(response)}`
                    : ''}"
            >
                <div class="card-top">
                    <div class="s-avatar" aria-hidden="true">
                        {p.username[0].toUpperCase()}
                    </div>
                    <span class="s-name" aria-hidden="true">@{p.username}</span>
                    <span
                        class="status-dot"
                        class:dot-correct={response?.is_correct === true}
                        class:dot-wrong={response?.is_correct === false}
                        aria-hidden="true"
                    ></span>
                </div>
                {#if response}
                    <div
                        class="answer-chip"
                        class:chip-correct={response.is_correct}
                        class:chip-wrong={!response.is_correct}
                        aria-hidden="true"
                    >
                        {answerLabel(response)}
                    </div>
                {:else}
                    <div class="answer-chip chip-pending" aria-hidden="true">
                        —
                    </div>
                {/if}
            </li>
        {/each}

        {#if participants.length === 0}
            <p class="empty">No hay participantes admitidos.</p>
        {/if}
    </ul>
</div>

<style>
    .grid-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0;
        height: 100%;
        overflow: hidden;
    }

    .summary-bar {
        display: flex;
        gap: 0;
        padding: 0.625rem 1rem;
        background: var(--primary-container-color);
        border-bottom: var(--border-width) solid var(--border-color);
        flex-shrink: 0;
    }

    .stat {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
    }

    .stat-val {
        font-size: calc(1.1rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color);
    }

    .stat-label {
        font-size: calc(0.65rem * var(--font-scale));
        text-transform: uppercase;
        color: var(--text-color);
    }

    .stat.correct .stat-val {
        color: var(--secondary-color);
    }
    .stat.wrong .stat-val {
        color: var(--error-color);
    }
    .stat.pending .stat-val {
        color: var(--text-color);
    }

    .student-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8.125rem, 1fr));
        gap: 0.5rem;
        padding: 0.75rem;
        overflow-y: auto;
        align-content: start;
        list-style: none;
        margin: 0;
    }

    .student-card {
        background: var(--secondary-container-color);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        padding: 0.625rem 0.625rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.44rem;
        color: var(--text-color);
        transition:
            border-color var(--motion-duration),
            background-color var(--motion-duration);
    }

    .student-card.correct {
        border-color: var(--secondary-color);
        background: var(--secondary-container-color);
    }

    .student-card.wrong {
        border-color: var(--error-color);
        background: var(--error-container-color);
    }

    .card-top {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .s-avatar {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(0.7rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
        flex-shrink: 0;
    }

    .s-name {
        flex: 1;
        font-size: calc(0.73rem * var(--font-scale));
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .status-dot {
        width: 0.44rem;
        height: 0.44rem;
        border-radius: 50%;
        background: var(--neutral-surface-variant);
        flex-shrink: 0;
    }
    .dot-correct {
        background: var(--secondary-color);
    }
    .dot-wrong {
        background: var(--error-color);
    }

    .answer-chip {
        font-size: calc(0.71rem * var(--font-scale));
        padding: 0.2rem 0.44rem;
        border-radius: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }

    .chip-correct {
        background: var(--secondary-container-color);
        color: var(--secondary-color);
    }
    .chip-wrong {
        background: var(--error-container-color);
        color: var(--error-color);
    }
    .chip-pending {
        background: var(--neutral-surface-variant);
        color: var(--text-color);
        opacity: 0.5;
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--text-color);
        font-size: calc(0.8rem * var(--font-scale));
        padding: 1.25rem;
        margin: 0;
    }
</style>
