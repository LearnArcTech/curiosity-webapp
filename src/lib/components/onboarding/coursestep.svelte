<script>
    import StyledLink from "$lib/components/basic/link.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Input from "$lib/components/basic/input.svelte";

    import { animate } from "animejs";
    import { flip } from "svelte/animate";

    let { courses = $bindable([]), onSubmit, onSkip } = $props();

    let currentInput = $state("");

    function addCourse() {
        const trimmed = currentInput.trim();
        if (trimmed && !courses.includes(trimmed)) {
            courses.push(trimmed);
        }
        currentInput = "";
    }

    /**
     * @param {{ key: string; preventDefault: () => void; }} event
     */
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addCourse();
        }
    }

    /**
     * @param {number} index
     */
    function removeCourse(index) {
        courses.splice(index, 1);
    }

    /**
     * @param {{ preventDefault: () => void; }} event
     */
    function handleSubmit(event) {
        event.preventDefault();
        if (currentInput.trim()) {
            addCourse();
        }
        onSubmit?.();
    }

    /**
     * @param {HTMLElement} node
     */
    function animeIn(node) {
        animate(node, {
            opacity: [0, 1],
            x: [-20, 0],
            duration: 400,
            ease: "outCubic",
        });
        return { duration: 400 };
    }

    /**
     * @param {HTMLElement} node
     */
    function animeOut(node) {
        node.style.overflow = "hidden";
        const computed = getComputedStyle(node);
        const pt = parseFloat(computed.paddingTop) || 0;
        const pb = parseFloat(computed.paddingBottom) || 0;
        const border = parseFloat(computed.borderWidth) || 0;

        animate(node, {
            opacity: [1, 0],
            x: [0, 20],
            height: [node.offsetHeight, 0],
            paddingTop: [pt, 0],
            paddingBottom: [pb, 0],
            borderWidth: [border, 0],
            duration: 300,
            ease: "outCubic",
        });

        return { duration: 300 };
    }
</script>

<section class="form-section">
    <div class="form-section-content">
        <h1>¿Te gustaría crear cursos?</h1>
        <p>
            Escribe el nombre de un curso y presiona "Enter" para agregarlo a la
            lista.
        </p>

        <form onsubmit={handleSubmit}>
            <div class="form-group">
                <div class="input-wrapper">
                    <Input
                        type="text"
                        id="course-name"
                        name="course_name"
                        label="Nombre del Curso"
                        placeholder="Ejem: Introduccón a la Programacion"
                        bind:value={currentInput}
                        onkeydown={handleKeyDown}
                    />

                    <VariantButton type="button" onclick={addCourse}>
                        Agregar
                    </VariantButton>
                </div>
            </div>

            <ul class="course-list {courses.length > 0 ? 'has-items' : ''}">
                {#each courses as course, i (course)}
                    <li
                        in:animeIn
                        out:animeOut
                        animate:flip={{ duration: 300 }}
                    >
                        <span class="course-name-text">{course}</span>
                        <button
                            type="button"
                            class="remove-btn"
                            onclick={() => removeCourse(i)}
                            aria-label="Eliminar curso"
                        >
                            ✕
                        </button>
                    </li>
                {/each}
            </ul>

            <div class="button-group">
                <StyledLink onclick={onSkip}>Saltar por ahora</StyledLink>
                <VariantButton type="submit" disabled={courses.length === 0}>
                    Continuar y Crear
                </VariantButton>
            </div>
        </form>
    </div>
</section>

<style>
    .form-section {
        padding: 3rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        text-align: center;
    }
    .form-section-content {
        max-width: 500px;
        width: 100%;
    }

    h1 {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }

    form {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .form-group {
        width: 100%;
        max-width: 400px;
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .input-wrapper {
        display: flex;
        gap: 0.5rem;
        align-items: end;
    }

    .course-list {
        width: 100%;
        max-width: 400px;
        max-height: 200px;
        overflow: auto;
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .course-list.has-items {
        margin-bottom: 2rem;
    }

    .course-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--primary-container-color);
        padding: 0.8rem 1rem;
        border-radius: var(--radius);
        color: var(--text-color);
        border: 1px solid var(--primary-color);
    }
    .course-name-text {
        font-weight: 500;
        word-break: break-word;
        text-align: left;
    }
    .remove-btn {
        background: none;
        border: none;
        color: var(--error-color);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.2rem;
        line-height: 1;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
    }
</style>
