<script lang="ts">
    import { page } from "$app/state";
    import { goto, invalidateAll } from "$app/navigation";
    import { courses, type CourseRow } from "$lib/api";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    let { data } = $props();
    let { courseId } = page.params;

    let userRole = $derived(data.user.role);
    let isTeacher = $derived(userRole === "teacher");

    let course = $state<CourseRow | null>(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let newName = $state("");
    let saving = $state(false);

    async function load() {
        if (!courseId) return;
        loading = true;
        try {
            course = await courses.get(courseId);
            newName = course.name;
        } catch (err: any) {
            errorMsg = "No se pudo cargar la configuración del curso.";
        } finally {
            loading = false;
        }
    }

    async function handleRename() {
        if (!courseId || !newName.trim()) return;
        saving = true;
        try {
            await courses.rename(courseId, newName);
            await load();
        } catch (err: any) {
            errorMsg = "Error al renombrar el curso.";
        } finally {
            saving = false;
        }
    }

    async function handleDelete() {
        if (
            !courseId ||
            !confirm("¿Estás seguro? Esta acción no se puede deshacer.")
        )
            return;
        try {
            await courses.remove(courseId);
            await invalidateAll();
            goto("/courses");
        } catch (err: any) {
            errorMsg = "Error al eliminar el curso.";
        }
    }

    async function handleLeave() {
        if (
            !courseId ||
            !confirm("¿Estás seguro de que quieres abandonar este curso?")
        )
            return;
        try {
            await courses.leave(courseId);
            await invalidateAll();
            goto("/courses");
        } catch (err: any) {
            errorMsg = "Error al abandonar el curso.";
        }
    }

    $effect(() => {
        load();
    });
</script>

<main class="settings-container">
    <h1 class="title">Configuración del curso</h1>

    {#if loading}
        <WaveLoader size={24} />
    {:else if errorMsg}
        <p class="error">{errorMsg}</p>
    {:else if course}
        <div class="section">
            <div class="field">
                <label for="course-name">Nombre del curso</label>
                <input
                    id="course-name"
                    type="text"
                    bind:value={newName}
                    disabled={!isTeacher}
                />
            </div>
            {#if isTeacher}
                <VariantButton
                    onclick={handleRename}
                    disabled={saving || newName === course.name}
                >
                    {saving ? "Guardando..." : "Guardar cambios"}
                </VariantButton>
            {/if}
        </div>

        <div class="section danger">
            <h2 class="section-title">Zona de peligro</h2>
            {#if isTeacher}
                <div class="danger-action">
                    <p>Eliminar el curso permanentemente y todos sus datos.</p>
                    <button class="btn-danger" onclick={handleDelete}
                        >Eliminar curso</button
                    >
                </div>
            {:else}
                <div class="danger-action">
                    <p>Abandonar el curso y perder el acceso.</p>
                    <button class="btn-danger" onclick={handleLeave}
                        >Abandonar curso</button
                    >
                </div>
            {/if}
        </div>
    {/if}
</main>

<style>
    .settings-container {
        margin: 1rem auto;
        padding: 0 1rem;
    }

    .title {
        color: var(--primary-color);
        margin-bottom: 2rem;
    }

    .section {
        margin-bottom: 3rem;
        padding: 1.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
    }

    .section-title {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        color: var(--text-color);
    }

    .field {
        margin-bottom: 1rem;
    }
    label {
        display: block;
        font-size: 0.8rem;
        margin-bottom: 4px;
        font-weight: 600;
    }
    input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
    }

    .danger {
        border-color: var(--error-color);
    }
    .danger-action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    .btn-danger {
        background: var(--error-color);
        color: var(--error-container-color);
        padding: 8px 16px;
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
    }
    .error {
        color: var(--error-color);
    }
</style>
