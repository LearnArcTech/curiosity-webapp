<script lang="ts">
    import { quizzes, type SessionQuiz } from "$lib/api";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import Input from "$lib/components/basic/input.svelte";

    interface Props {
        quiz: SessionQuiz;
        onAnswered: (isCorrect: boolean) => void;
    }

    const { quiz, onAnswered }: Props = $props();

    let selectedTexts = $state<string[]>([]);
    let inputAnswer = $state("");
    let hasAnswered = $state(false);
    let wasCorrect = $state(false);
    let isSubmitting = $state(false);
    let timeLeft = $derived<number | null>(quiz.time_limit_seconds ?? null);

    $effect(() => {
        if (!timeLeft || hasAnswered) return;
        const interval = setInterval(() => {
            timeLeft = Math.max(0, (timeLeft ?? 0) - 1);
            if (timeLeft === 0) {
                clearInterval(interval);
                handleSubmit();
            }
        }, 1000);
        return () => clearInterval(interval);
    });

    const timerPercent = $derived(
        quiz.time_limit_seconds && timeLeft !== null
            ? (timeLeft / quiz.time_limit_seconds) * 100
            : 100,
    );
    const isUrgent = $derived(timeLeft !== null && timeLeft <= 10);

    const canSubmit = $derived(
        quiz.question_type === "input"
            ? inputAnswer.trim().length > 0
            : selectedTexts.length > 0,
    );

    function toggleOption(text: string) {
        if (hasAnswered) return;
        if (quiz.question_type === "single") {
            selectedTexts = [text];
        } else {
            selectedTexts = selectedTexts.includes(text)
                ? selectedTexts.filter((t) => t !== text)
                : [...selectedTexts, text];
        }
    }

    async function handleSubmit() {
        if (hasAnswered || isSubmitting || !canSubmit) return;
        const answer =
            quiz.question_type === "input" ? inputAnswer.trim() : selectedTexts;

        isSubmitting = true;
        try {
            const result = await quizzes.submitAnswer(quiz.id, answer);
            wasCorrect = result.is_correct;
            hasAnswered = true;
            onAnswered(result.is_correct);
        } catch (e) {
            console.error("Error al enviar respuesta:", e);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="quiz-wrapper">
    <div class="quiz-card">
        {#if quiz.time_limit_seconds && timeLeft !== null && !hasAnswered}
            <div class="timer-bar">
                <div
                    class="timer-fill"
                    class:urgent={isUrgent}
                    style="width: {timerPercent}%"
                ></div>
                <span class="timer-label" class:urgent={isUrgent}
                    >{timeLeft}s</span
                >
            </div>
        {/if}

        {#if !hasAnswered}
            <div class="quiz-body">
                <div class="quiz-meta">
                    <span class="quiz-badge">Quiz en vivo</span>
                    {#if quiz.question_type === "multiple"}
                        <span class="quiz-hint">Selección múltiple</span>
                    {/if}
                </div>

                <h2 class="quiz-title">{quiz.title}</h2>

                {#if quiz.description}
                    <p class="quiz-desc">{quiz.description}</p>
                {/if}

                {#if quiz.question_type === "input"}
                    <Input
                        type="text"
                        id="respuesta"
                        name="respuesta"
                        placeholder="Tu respuesta..."
                        bind:value={inputAnswer}
                        onkeydown={(e) => e.key === "Enter" && handleSubmit()}
                        autofocus
                    />
                {:else}
                    <div class="options-list">
                        {#each quiz.options as opt (opt.id)}
                            <VariantButton
                                variant={selectedTexts.includes(opt.text)
                                    ? "primary-dark"
                                    : "primary-light"}
                                onclick={() => toggleOption(opt.text)}
                            >
                                {opt.text}
                            </VariantButton>
                        {/each}
                    </div>
                {/if}

                <VariantButton
                    onclick={handleSubmit}
                    disabled={isSubmitting || !canSubmit}
                >
                    {#if isSubmitting}
                        <WaveLoader size={21}></WaveLoader>
                    {:else}
                        Lanzar Quiz
                    {/if}
                </VariantButton>
            </div>
        {:else}
            <div class="result-body" class:correct={wasCorrect}>
                <div class="result-icon">{wasCorrect ? "✓" : "✗"}</div>
                <h3 class="result-title">
                    {wasCorrect ? "¡Correcto!" : "Incorrecto"}
                </h3>
                <p class="result-msg">
                    {wasCorrect
                        ? "+1 punto añadido a tu puntuación."
                        : "No era la respuesta esperada."}
                </p>
            </div>
        {/if}
    </div>
</div>

<style>
    .quiz-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .quiz-card {
        background: var(--neutral-surface);
        border-radius: var(--radius);
        width: min(460px, 100%);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border-color);
    }

    .timer-bar {
        position: relative;
        height: 5px;
        background: var(--secondary-container-color);
        display: flex;
        align-items: center;
    }

    .timer-fill {
        height: 100%;
        background: var(--secondary-color);
        transition:
            width 1s linear,
            background 0.3s;
    }

    .timer-fill.urgent {
        background: var(--error-color);
    }

    .timer-label {
        margin-top: 10px;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-color);
        line-height: 1;
    }

    .timer-label.urgent {
        color: var(--error-color);
    }

    .quiz-body {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .quiz-meta {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .quiz-badge {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--primary-color);
        background: var(--primary-container-color);
        padding: 2px 8px;
        border-radius: var(--radius);
    }

    .quiz-hint {
        font-size: 0.73rem;
        color: var(--text-color);
    }

    .quiz-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-color);
        line-height: 1.4;
    }

    .quiz-desc {
        margin: 0;
        font-size: 0.84rem;
        color: var(--text-color);
        line-height: 1.5;
    }

    .options-list {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }

    .result-body {
        padding: 36px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
    }

    .result-icon {
        width: 60px;
        height: 60px;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        font-weight: 700;
        background: var(--error-container-color);
        color: var(--error-color);
    }
    .result-body.correct .result-icon {
        background: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .result-title {
        margin: 4px 0 0;
        font-family: var(--font-display);
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--error-color);
    }
    .result-body.correct .result-title {
        color: var(--secondary-color);
    }

    .result-msg {
        margin: 0;
        font-size: 0.83rem;
        color: var(--text-color);
    }
</style>
