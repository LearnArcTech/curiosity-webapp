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
        sharedExample?: ExampleSpec | null;
        onShareExample?: () => Promise<void>;
        onDiscardExample?: () => void;
        onSaveToRepo?: (spec: ExampleSpec) => Promise<void>;
        onClearExample?: () => Promise<void>;
        pendingExampleStreaming?: boolean;
    }
    const {
        activeQuiz,
        userRole,
        participants,
        quizResponses,
        onQuizAnswered = () => {},
        pendingExample = null,
        sharedExample = null,
        onShareExample,
        onDiscardExample,
        onSaveToRepo,
        onClearExample,
        pendingExampleStreaming,
    }: Props = $props();

    const approvedStudents = $derived(
        participants.filter((p) => p.status === "approved" && !p.is_teacher),
    );

    const stageAnnouncement = $derived.by(() => {
        if (pendingExample && userRole === "teacher")
            return "Vista previa de ejemplo generado por IA.";
        if (activeQuiz && userRole === "student")
            return `Nuevo quiz: ${activeQuiz.title}`;
        if (activeQuiz && userRole === "teacher")
            return `Quiz en curso: ${activeQuiz.title}`;
        if (sharedExample) return "Ejemplo compartido con la clase.";
        return "";
    });

    let isSharing = $state(false);
    let isSaving = $state(false);

    async function handleShare() {
        isSharing = true;
        try {
            await onShareExample?.();
        } finally {
            isSharing = false;
        }
    }

    async function handleSave(spec: ExampleSpec) {
        isSaving = true;
        try {
            await onSaveToRepo?.(spec);
        } finally {
            isSaving = false;
        }
    }
</script>

<main class="main-stage">
    <div class="visually-hidden" role="status" aria-live="polite">
        {stageAnnouncement}
    </div>

    <div class="content-canvas">
        {#if pendingExample && userRole === "teacher"}
            <div class="preview-header">
                <div class="preview-label-group">
                    <WaveLoader color="var(--secondary-color)" size={16} />
                    <span class="preview-label">
                        Vista previa - ejemplo generado por IA
                    </span>
                </div>
                <div class="preview-actions">
                    <VariantButton
                        variant="secondary-light"
                        onclick={onDiscardExample}
                        disabled={isSharing || pendingExampleStreaming}
                    >
                        Descartar
                    </VariantButton>
                    <VariantButton
                        variant="secondary-light"
                        onclick={() => handleSave(pendingExample!)}
                        disabled={isSharing ||
                            isSaving ||
                            pendingExampleStreaming}
                        aria-busy={isSaving}
                    >
                        {isSaving ? "Guardando…" : "Guardar en repositorio"}
                    </VariantButton>
                    <VariantButton
                        variant="secondary-dark"
                        onclick={handleShare}
                        disabled={isSharing || pendingExampleStreaming}
                        aria-busy={isSharing}
                    >
                        {isSharing ? "Compartiendo…" : "Compartir con la clase"}
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
        {:else if sharedExample}
            <div class="shared-header">
                <div class="preview-label-group">
                    <WaveLoader color="var(--secondary-color)" size={14} />
                    <span class="preview-label">Ejemplo compartido</span>
                </div>
                {#if userRole === "teacher"}
                    <div class="preview-actions">
                        <VariantButton
                            variant="secondary-light"
                            onclick={() => handleSave(sharedExample!)}
                            disabled={isSaving}
                            aria-busy={isSaving}
                        >
                            {isSaving ? "Guardando…" : "Guardar en repositorio"}
                        </VariantButton>
                        <VariantButton
                            variant="secondary-light"
                            onclick={onClearExample}
                        >
                            Retirar de la clase
                        </VariantButton>
                    </div>
                {/if}
            </div>
            <div class="preview-body">
                <ExampleRenderer spec={sharedExample} />
            </div>
        {:else}
            <div class="content-placeholder">
                <h3>Área interactiva</h3>
                <p>Aquí se mostrarán los quizzes y ejemplos en tiempo real.</p>
            </div>
        {/if}
    </div>
</main>

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

    .preview-header,
    .shared-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.625rem 1rem;
        background-color: var(--secondary-container-color);
        border-bottom: var(--border-width) solid var(--border-color);
        flex-shrink: 0;
    }

    .preview-label-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .preview-label {
        font-size: calc(0.78rem * var(--font-scale));
        font-weight: 700;
        text-transform: uppercase;
        color: var(--secondary-color);
    }

    .preview-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .preview-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .quiz-live-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1rem;
        background: var(--primary-container-color);
        border-bottom: var(--border-width) solid var(--border-color);
        font-size: calc(0.85rem * var(--font-scale));
        color: var(--primary-color);
        flex-shrink: 0;
    }

    .content-placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        padding: 3rem;
        text-align: center;
    }

    .content-placeholder h3 {
        font-size: calc(1.05rem * var(--font-scale));
        font-weight: 600;
        margin: 0;
        color: var(--text-color);
    }

    .content-placeholder p {
        font-size: calc(0.85rem * var(--font-scale));
        color: var(--text-color);
        opacity: 0.65;
        margin: 0;
    }

    @media (max-width: 770px) {
        .preview-header {
            display: flex;
            flex-direction: column;
        }
    }
</style>
