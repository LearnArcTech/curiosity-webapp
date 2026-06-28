<script lang="ts">
    import { page } from "$app/state";
    import { goto, invalidateAll } from "$app/navigation";
    import { courses, type CourseRow } from "$lib/api";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import AlertDialog from "$lib/components/dialog/alert-dialog.svelte";

    let { data } = $props();
    let { courseId } = page.params;

    let userRole = $derived(data.user.role);
    let isTeacher = $derived(userRole === "teacher");

    let course = $state<CourseRow | null>(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let newName = $state("");
    let saving = $state(false);

    let confirmDeleteOpen = $state(false);
    let confirmLeaveOpen = $state(false);
    let errorDialogOpen = $state(false);

    async function load() {
        if (!courseId) return;
        loading = true;
        try {
            course = await courses.get(courseId);
            newName = course.name;
        } catch {
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
        } catch {
            errorMsg = "Error al renombrar el curso.";
            errorDialogOpen = true;
        } finally {
            saving = false;
        }
    }

    async function handleDeleteConfirm() {
        confirmDeleteOpen = false;
        if (!courseId) return;
        try {
            await courses.remove(courseId);
            await invalidateAll();
            goto("/courses");
        } catch {
            errorMsg = "Error al eliminar el curso.";
            errorDialogOpen = true;
        }
    }

    async function handleLeaveConfirm() {
        confirmLeaveOpen = false;
        if (!courseId) return;
        try {
            await courses.leave(courseId);
            await invalidateAll();
            goto("/courses");
        } catch {
            errorMsg = "Error al abandonar el curso.";
            errorDialogOpen = true;
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
    {:else if course}
        <div class="section">
            <Input
                id="course-name"
                name="course-name"
                label="Nombre del curso"
                bind:value={newName}
                disabled={!isTeacher}
            />
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
                    <button
                        class="btn-danger"
                        onclick={() => (confirmDeleteOpen = true)}
                    >
                        Eliminar curso
                    </button>
                </div>
            {:else}
                <div class="danger-action">
                    <p>Abandonar el curso y perder el acceso.</p>
                    <button
                        class="btn-danger"
                        onclick={() => (confirmLeaveOpen = true)}
                    >
                        Abandonar curso
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</main>

<ConfirmDialog
    bind:open={confirmDeleteOpen}
    title="Eliminar curso"
    onAccept={handleDeleteConfirm}
    onCancel={() => (confirmDeleteOpen = false)}
>
    {#snippet content()}
        <p>¿Estás seguro? Esta acción no se puede deshacer.</p>
    {/snippet}
</ConfirmDialog>

<ConfirmDialog
    bind:open={confirmLeaveOpen}
    title="Abandonar curso"
    onAccept={handleLeaveConfirm}
    onCancel={() => (confirmLeaveOpen = false)}
>
    {#snippet content()}
        <p>¿Estás seguro de que quieres abandonar este curso?</p>
    {/snippet}
</ConfirmDialog>

<AlertDialog
    bind:open={errorDialogOpen}
    title="Error"
    onClose={() => (errorDialogOpen = false)}
>
    {#snippet content()}
        <p>{errorMsg}</p>
    {/snippet}
</AlertDialog>

<style>
    .title {
        color: var(--primary-color);
        margin-bottom: 2rem;
    }

    .section {
        margin-bottom: 3rem;
        padding: 1.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .section-title {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        color: var(--text-color);
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
</style>
