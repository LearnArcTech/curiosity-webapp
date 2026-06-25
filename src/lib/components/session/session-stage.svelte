<script lang="ts">
    import type {
        SessionQuiz,
        SessionParticipant,
        QuizResponseRow,
    } from "$lib/api";
    import type { ExampleSpec } from "$lib/generation/sharedTypes";
    import QuizDisplay from "./quiz-display.svelte";
    import QuizResponseGrid from "./quiz-response-grid.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import ExampleRenderer from "$lib/generation/example-renderer.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    interface Props {
        activeQuiz: SessionQuiz | null;
        userRole: "teacher" | "student" | null;
        participants: SessionParticipant[];
        quizResponses: QuizResponseRow[];
        onQuizAnswered?: (isCorrect: boolean) => void;
        pendingExample?: ExampleSpec | null;
        onShareExample?: () => void;
        onDiscardExample?: () => void;
    }
    const {
        activeQuiz,
        userRole,
        participants,
        quizResponses,
        onQuizAnswered = () => {},
        pendingExample = null,
        onShareExample,
        onDiscardExample,
    }: Props = $props();

    const approvedStudents = $derived(
        participants.filter((p) => p.status === "approved" && !p.is_teacher),
    );

    // Track whether the teacher has already shared this example
    let isShared = $state(false);

    $effect(() => {
        // Reset shared state whenever a new example arrives
        if (pendingExample) isShared = false;
    });

    function handleShare() {
        isShared = true;
        onShareExample?.();
    }
</script>

<main class="main-stage">
    <div class="content-canvas">
        {#if pendingExample && userRole === "teacher"}
            <div class="preview-header">
                <div class="preview-label-group">
                    <WaveLoader color="#0a6b5a" size={16}></WaveLoader>
                    <span class="preview-label"
                        >Vista previa — ejemplo generado por IA</span
                    >
                </div>
                <div class="preview-actions">
                    <VariantButton
                        variant="secondary-light"
                        onclick={onDiscardExample}
                        disabled={isShared}
                    >
                        Descartar
                    </VariantButton>
                    <VariantButton
                        variant="secondary-dark"
                        onclick={handleShare}
                        disabled={isShared}
                    >
                        {#if isShared}
                            ✓ Compartido con la clase
                        {:else}
                            Compartir con la clase
                        {/if}
                    </VariantButton>
                </div>
            </div>
            <div class="preview-body">
                <ExampleRenderer spec={pendingExample} />
            </div>
        {:else if activeQuiz && userRole === "student"}
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
                <p>Aquí se mostrarán los quizzes y ejemplos en tiempo real.</p>
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

    /* ── Example preview ── */
    .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 16px;
        background-color: var(--secondary-container-color);
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
    }

    .preview-label-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .preview-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--secondary-color);
        animation: pulse 2s infinite;
        flex-shrink: 0;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.35;
        }
    }

    .preview-label {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--secondary-color);
    }

    .preview-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .btn-discard {
        padding: 6px 14px;
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
        background: transparent;
        color: var(--text-color);
        font-family: var(--font-body);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.12s;
    }
    .btn-discard:hover:not(:disabled) {
        background-color: var(--neutral-surface-variant);
    }
    .btn-discard:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .btn-share {
        padding: 6px 14px;
        border-radius: var(--radius);
        border: none;
        background-color: var(--secondary-color);
        color: var(--white);
        font-family: var(--font-body);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            background 0.12s,
            opacity 0.12s;
    }
    .btn-share:hover:not(:disabled) {
        opacity: 0.88;
    }
    .btn-share.shared {
        background-color: var(--border-color);
        cursor: default;
    }
    .btn-share:disabled {
        cursor: default;
    }

    .preview-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* ── Quiz banner ── */
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

    /* ── Placeholder ── */
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

    .content-placeholder p {
        font-size: 0.85rem;
        color: var(--border-color);
        margin: 0;
    }
</style>
