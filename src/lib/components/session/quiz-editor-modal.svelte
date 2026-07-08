<script lang="ts">
    import { quizzes } from "$lib/api";
    import { Add } from "@material-symbols-svg/svelte";
    import Dialog from "$lib/components/basic/dialog.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    interface Props {
        sessionId: string;
        open: boolean;
    }

    let { sessionId, open = $bindable() }: Props = $props();

    type QuestionType = "single" | "multiple" | "input";

    interface EditorOption {
        id: string;
        text: string;
        isCorrect: boolean;
    }

    let title = $state("");
    let description = $state("");
    let questionType = $state<QuestionType>("single");
    let options = $state<EditorOption[]>([
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
    ]);
    let correctInputAnswer = $state("");
    let timeLimitEnabled = $state(false);
    let timeLimitSeconds = $state(30);
    let isSubmitting = $state(false);
    let error = $state<string | null>(null);

    function addOption() {
        options.push({ id: crypto.randomUUID(), text: "", isCorrect: false });
    }

    function removeOption(id: string) {
        if (options.length <= 2) return;
        options = options.filter((o) => o.id !== id);
    }

    function toggleCorrect(id: string) {
        if (questionType === "single") {
            options = options.map((o) => ({ ...o, isCorrect: o.id === id }));
        } else {
            options = options.map((o) =>
                o.id === id ? { ...o, isCorrect: !o.isCorrect } : o,
            );
        }
    }

    function handleTypeChange(type: QuestionType) {
        questionType = type;
        options = options.map((o) => ({ ...o, isCorrect: false }));
    }

    async function handleSubmit() {
        error = null;
        if (!title.trim()) {
            error = "El título es requerido.";
            return;
        }

        let correctAnswer: string | string[];

        if (questionType === "input") {
            if (!correctInputAnswer.trim()) {
                error = "Ingresa la respuesta correcta.";
                return;
            }
            correctAnswer = correctInputAnswer.trim();
        } else {
            if (options.some((o) => !o.text.trim())) {
                error = "Todas las opciones deben tener texto.";
                return;
            }
            const correct = options.filter((o) => o.isCorrect);
            if (correct.length === 0) {
                error = "Marca al menos una respuesta correcta.";
                return;
            }
            correctAnswer = correct.map((o) => o.text.trim());
        }

        isSubmitting = true;
        try {
            await quizzes.create(
                sessionId,
                title.trim(),
                description.trim() || null,
                questionType,
                questionType !== "input"
                    ? options.map((o) => ({ id: o.id, text: o.text.trim() }))
                    : [],
                correctAnswer,
                timeLimitEnabled ? timeLimitSeconds : null,
            );
            open = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Dialog bind:open title="Crear Quiz" maxWidth="650px">
    {#snippet children()}
        <div class="card-body">
            <Input
                type="text"
                id="quiz-title"
                name="quiz-title"
                label="Titulo"
                placeholder="¿Cuál es la capital de Francia?"
                bind:value={title}
                required
            />

            <Input
                type="text"
                id="quiz-description"
                name="quiz-description"
                label="Descripción (Opcional)"
                placeholder="Contexto adicional.."
                bind:value={description}
            />

            <div class="field">
                <p id="type-label">Tipo de pregunta</p>
                <div
                    class="type-tabs"
                    role="radiogroup"
                    aria-labelledby="type-label"
                >
                    {#each [["single", "Única"], ["multiple", "Múltiple"], ["input", "Abierta"]] as [type, label]}
                        <VariantButton
                            variant={questionType === type
                                ? "primary-dark"
                                : "primary-light"}
                            role="radio"
                            aria-checked={questionType === type}
                            onclick={() =>
                                handleTypeChange(type as QuestionType)}
                            >{label}</VariantButton
                        >
                    {/each}
                </div>
            </div>

            {#if questionType !== "input"}
                <div class="field">
                    <p id="options-label">
                        Opciones <span class="muted">(marca las correctas)</span
                        >
                    </p>
                    <div
                        class="options-list"
                        role="group"
                        aria-labelledby="options-label"
                    >
                        {#each options as opt, i (opt.id)}
                            <div class="option-row">
                                <VariantButton
                                    variant="secondary-light"
                                    role={questionType === "single"
                                        ? "radio"
                                        : "checkbox"}
                                    aria-checked={opt.isCorrect}
                                    aria-label="Marcar opción {i +
                                        1} como correcta"
                                    onclick={() => toggleCorrect(opt.id)}
                                >
                                    {questionType === "single"
                                        ? opt.isCorrect
                                            ? "●"
                                            : "○"
                                        : opt.isCorrect
                                          ? "☑"
                                          : "☐"}
                                </VariantButton>
                                <Input
                                    type="text"
                                    id="option-{opt.id}"
                                    name="option-{opt.id}"
                                    label=""
                                    placeholder="Opción..."
                                    bind:value={opt.text}
                                />
                                <VariantButton
                                    variant="primary-dark"
                                    onclick={() => removeOption(opt.id)}
                                    disabled={options.length <= 2}
                                    aria-label="Eliminar opción {i + 1}"
                                >
                                    ×
                                </VariantButton>
                            </div>
                        {/each}
                    </div>
                    <VariantButton onclick={addOption}>
                        <Add size={14} /> Añadir opción
                    </VariantButton>
                </div>
            {:else}
                <div class="field">
                    <Input
                        type="text"
                        id="respuesta-correcta"
                        name="respuesta-correcta"
                        label="Respuesta correcta *"
                        placeholder="Respuesta esperada..."
                        bind:value={correctInputAnswer}
                        aria-describedby="respuesta-hint"
                    />
                    <p class="hint" id="respuesta-hint">
                        No distingue mayúsculas ni espacios extremos.
                    </p>
                </div>
            {/if}

            <div class="field">
                <div class="time-row">
                    <label class="toggle-label" for="time-limit-toggle">
                        <input
                            type="checkbox"
                            id="time-limit-toggle"
                            bind:checked={timeLimitEnabled}
                        />
                        Límite de tiempo
                    </label>
                    {#if timeLimitEnabled}
                        <div class="time-input-group">
                            <label
                                class="visually-hidden"
                                for="time-limit-seconds"
                            >
                                Límite de tiempo en segundos
                            </label>
                            <input
                                type="number"
                                id="time-limit-seconds"
                                class="time-input"
                                min={5}
                                max={300}
                                bind:value={timeLimitSeconds}
                            />
                            <span class="muted">segundos</span>
                        </div>
                    {/if}
                </div>
            </div>

            {#if error}
                <p class="error" role="alert">{error}</p>
            {/if}
        </div>
    {/snippet}
    {#snippet footer()}
        <VariantButton variant="secondary-light" onclick={() => (open = false)}
            >Cancelar</VariantButton
        >
        <VariantButton
            variant="primary-dark"
            onclick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
        >
            {#if isSubmitting}
                <WaveLoader size={16}></WaveLoader>
                <span class="visually-hidden">Creando quiz...</span>
            {:else}
                Lanzar Quiz
            {/if}
        </VariantButton>
    {/snippet}
</Dialog>

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

    .card-body {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
        color: var(--text-color);
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.44rem;
    }

    .muted {
        font-weight: 400;
        text-transform: none;
        color: var(--text-color);
    }

    .type-tabs {
        display: flex;
        gap: 0.2rem;
        background: var(--primary-container-color);
        border-radius: var(--radius);
        padding: 0.5rem;
    }

    .options-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .option-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .hint {
        margin: 0;
        font-size: calc(0.74rem * var(--font-scale));
        color: var(--text-color);
    }

    .time-row {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex-wrap: wrap;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        text-transform: none;
        font-size: calc(0.85rem * var(--font-scale));
        font-weight: 500;
        color: var(--text-color);
    }

    .time-input-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: calc(0.85rem * var(--font-scale));
    }

    .time-input {
        width: 4.5rem;
        text-align: center;
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        padding: 0.35rem;
        font-family: inherit;
        font-size: calc(0.85rem * var(--font-scale));
        color: var(--text-color);
        background: var(--background-color);
    }
    .time-input:focus {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 1px;
    }

    .error {
        margin: 0;
        font-size: calc(0.82rem * var(--font-scale));
        color: var(--error-color);
        background: var(--error-container-color);
        padding: 0.56rem 0.75rem;
        border-radius: var(--radius);
    }
</style>
