<script lang="ts">
    import type {
        SessionQuiz,
        SessionParticipant,
        QuizResponseRow,
    } from "$lib/api";
    import QuizDisplay from "./quiz-display.svelte";
    import QuizResponseGrid from "./quiz-response-grid.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    interface Props {
        activeQuiz: SessionQuiz | null;
        userRole: "teacher" | "student" | null;
        participants: SessionParticipant[];
        quizResponses: QuizResponseRow[];
        onQuizAnswered?: (isCorrect: boolean) => void;
    }

    const {
        activeQuiz,
        userRole,
        participants,
        quizResponses,
        onQuizAnswered = () => {},
    }: Props = $props();

    const approvedStudents = $derived(
        participants.filter((p) => p.status === "approved" && !p.is_teacher),
    );
</script>

<main class="main-stage">
    <div class="content-canvas">
        {#if activeQuiz && userRole === "student"}
            {#key activeQuiz.id}
                <QuizDisplay quiz={activeQuiz} onAnswered={onQuizAnswered} />
            {/key}
        {:else if activeQuiz && userRole === "teacher"}
            <div class="quiz-live-banner">
                <WaveLoader size={14} />
                <span>Quiz en curso: <strong>{activeQuiz.title}</strong></span>
            </div>
            <QuizResponseGrid
                quiz={activeQuiz}
                participants={approvedStudents}
                responses={quizResponses}
            />
        {:else}
            <div class="content-placeholder">
                <h3>Área interactiva</h3>
                <p>Aquí se mostrarán los quizzes en tiempo real.</p>
            </div>
        {/if}
    </div>
</main>

<style>
    .main-stage {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .content-canvas {
        flex: 1;
        background-color: var(--neutral-surface);
        border-radius: var(--radius);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .content-placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 48px;
        text-align: center;
    }

    .content-placeholder h3 {
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-color);
    }

    .quiz-live-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 16px;
        background: var(--primary-container-color);
        border-bottom: 1px solid var(--border-color);
        font-size: 0.85rem;
        color: var(--primary-color);
        flex-shrink: 0;
    }
</style>
