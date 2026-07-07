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
    let announcement = $state("");
    let lastAnnouncedSecond = -1;

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

    $effect(() => {
        if (timeLeft === null || hasAnswered) return;
        if (
            timeLeft <= 10 &&
            timeLeft > 0 &&
            timeLeft !== lastAnnouncedSecond
        ) {
            lastAnnouncedSecond = timeLeft;
            announcement = `${timeLeft} segundos restantes`;
        }
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
            announcement = result.is_correct
                ? "Correcto. Punto añadido a tu puntuación."
                : "Incorrecto.";
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
            <div
                class="timer-bar"
                role="timer"
                aria-label="{timeLeft} segundos restantes"
            >
                <div
                    class="timer-fill"
                    class:urgent={isUrgent}
                    style="width: {timerPercent}%"
                ></div>
                <span
                    class="timer-label"
                    class:urgent={isUrgent}
                    aria-hidden="true">{timeLeft}s</span
                >
            </div>
        {/if}

        <div class="visually-hidden" role="status" aria-live="assertive">
            {announcement}
        </div>

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
                        label="Tu respuesta"
                        placeholder="Tu respuesta..."
                        bind:value={inputAnswer}
                        onkeydown={(e) => e.key === "Enter" && handleSubmit()}
                        autofocus
                    />
                {:else}
                    <div
                        class="options-list"
                        role={quiz.question_type === "single"
                            ? "radiogroup"
                            : "group"}
                        aria-label={quiz.title}
                    >
                        {#each quiz.options as opt (opt.id)}
                            <VariantButton
                                variant={selectedTexts.includes(opt.text)
                                    ? "primary-dark"
                                    : "primary-light"}
                                role={quiz.question_type === "single"
                                    ? "radio"
                                    : "checkbox"}
                                aria-checked={selectedTexts.includes(opt.text)}
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
                    aria-busy={isSubmitting}
                >
                    {#if isSubmitting}
                        <WaveLoader size={21}></WaveLoader>
                        <span class="visually-hidden"
                            >Enviando respuesta...</span
                        >
                    {:else}
                        Lanzar Quiz
                    {/if}
                </VariantButton>
            </div>
        {:else}
            <div class="result-body" class:correct={wasCorrect}>
                <div class="result-icon" aria-hidden="true">
                    {wasCorrect ? "✓" : "✗"}
                </div>
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

    .quiz-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    }

    .quiz-card {
        background: var(--neutral-surface);
        border-radius: var(--radius);
        width: min(460px, 100%);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: var(--border-width) solid var(--border-color);
    }

    .timer-bar {
        position: relative;
        height: 0.3125rem;
        background: var(--secondary-container-color);
        display: flex;
        align-items: center;
    }

    .timer-fill {
        height: 100%;
        background: var(--secondary-color);
        transition:
            width 1s linear,
            background-color var(--motion-duration);
    }

    .timer-fill.urgent {
        background: var(--error-color);
    }

    .timer-label {
        margin-top: 0.625rem;
        font-size: calc(1rem * var(--font-scale));
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
        gap: 0.875rem;
    }

    .quiz-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .quiz-badge {
        font-size: calc(0.68rem * var(--font-scale));
        font-weight: 700;
        text-transform: uppercase;
        color: var(--primary-color);
        background: var(--primary-container-color);
        padding: 0.125rem 0.5rem;
        border-radius: var(--radius);
    }

    .quiz-hint {
        font-size: calc(0.73rem * var(--font-scale));
        color: var(--text-color);
    }

    .quiz-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: calc(1.05rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color);
        line-height: 1.4;
    }

    .quiz-desc {
        margin: 0;
        font-size: calc(0.84rem * var(--font-scale));
        color: var(--text-color);
        line-height: 1.5;
    }

    .options-list {
        display: flex;
        flex-direction: column;
        gap: 0.44rem;
    }

    .result-body {
        padding: 2.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
    }

    .result-icon {
        width: 3.75rem;
        height: 3.75rem;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(1.8rem * var(--font-scale));
        font-weight: 700;
        background: var(--error-container-color);
        color: var(--error-color);
    }
    .result-body.correct .result-icon {
        background: var(--secondary-container-color);
        color: var(--secondary-color);
    }

    .result-title {
        margin: 0.25rem 0 0;
        font-family: var(--font-display);
        font-size: calc(1.1rem * var(--font-scale));
        font-weight: 700;
        color: var(--error-color);
    }
    .result-body.correct .result-title {
        color: var(--secondary-color);
    }

    .result-msg {
        margin: 0;
        font-size: calc(0.83rem * var(--font-scale));
        color: var(--text-color);
    }
</style>
