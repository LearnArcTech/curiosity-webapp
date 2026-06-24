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
</script>

<div class="grid-wrapper">
    <div class="summary-bar">
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

    <div class="student-grid">
        {#each participants as p (p.id)}
            {@const response = responseMap.get(p.id)}
            <div
                class="student-card"
                class:correct={response?.is_correct === true}
                class:wrong={response?.is_correct === false}
            >
                <div class="card-top">
                    <div class="s-avatar">{p.username[0].toUpperCase()}</div>
                    <span class="s-name">@{p.username}</span>
                    <span
                        class="status-dot"
                        class:dot-correct={response?.is_correct === true}
                        class:dot-wrong={response?.is_correct === false}
                        title={response
                            ? response.is_correct
                                ? "Correcta"
                                : "Incorrecta"
                            : "Pendiente"}
                    ></span>
                </div>
                {#if response}
                    <div
                        class="answer-chip"
                        class:chip-correct={response.is_correct}
                        class:chip-wrong={!response.is_correct}
                    >
                        {answerLabel(response)}
                    </div>
                {:else}
                    <div class="answer-chip chip-pending">—</div>
                {/if}
            </div>
        {/each}

        {#if participants.length === 0}
            <p class="empty">No hay participantes admitidos.</p>
        {/if}
    </div>
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
        padding: 10px 16px;
        background: var(--primary-container-color);
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
    }

    .stat {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .stat-val {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-color);
    }

    .stat-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-color);
    }

    .stat.correct .stat-val {
        color: var(--secondary-color, #10b981);
    }
    .stat.wrong .stat-val {
        color: var(--error-color, #ef4444);
    }
    .stat.pending .stat-val {
        color: var(--text-color);
    }

    .student-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 8px;
        padding: 12px;
        overflow-y: auto;
        align-content: start;
    }

    .student-card {
        background: var(--secondary-container-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 10px 10px 8px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        color: var(--text-color);
        transition:
            border-color 0.2s,
            background 0.2s;
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
        gap: 6px;
    }

    .s-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
    }

    .s-name {
        flex: 1;
        font-size: 0.73rem;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.18);
        flex-shrink: 0;
    }
    .dot-correct {
        background: var(--secondary-color, #10b981);
    }
    .dot-wrong {
        background: var(--error-color, #ef4444);
    }

    .answer-chip {
        font-size: 0.71rem;
        padding: 3px 7px;
        border-radius: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }

    .chip-correct {
        background: rgba(16, 185, 129, 0.15);
        color: var(--secondary-color, #10b981);
    }
    .chip-wrong {
        background: rgba(239, 68, 68, 0.15);
        color: var(--error-color, #ef4444);
    }
    .chip-pending {
        background: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.2);
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--text-color);
        font-size: 0.8rem;
        padding: 20px;
        margin: 0;
    }
</style>
