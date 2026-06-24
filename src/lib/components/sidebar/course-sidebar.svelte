<script lang="ts">
    import { goto } from "$app/navigation";
    import Sidebar from "$lib/components/basic/sidebar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    interface Course {
        id: string | number;
        name: string;
    }
    interface Props {
        courses: Course[] | null;
        courseId?: string | number;
        role: "teacher" | "student";
        courseHref: (id: string | number) => string;
        onCreateCourse?: () => void;
        onJoinByCode?: () => void;
        onLeaveCourse?: () => void;
    }
    let {
        courses,
        courseId,
        role,
        courseHref,
        onCreateCourse,
        onJoinByCode,
        onLeaveCourse,
    }: Props = $props();
    const isTeacher = $derived(role === "teacher");

    function handleItemClick(item: Course) {
        if (courseId === item.id) {
            onLeaveCourse?.();
            goto("/courses");
        } else {
            goto(courseHref(item.id));
        }
    }
</script>

<Sidebar
    items={courses}
    itemKey={(c) => c.id}
    itemLabel={(c) => c.name}
    isActive={(c) => courseId === c.id}
    onItemClick={handleItemClick}
>
    {#snippet header()}
        <h1 class="sidebar-title">Cursos</h1>
    {/snippet}
    {#snippet footer()}
        {#if isTeacher}
            <VariantButton onclick={onCreateCourse} variant="primary-light">
                Crear nuevo curso
            </VariantButton>
        {:else}
            <VariantButton onclick={onJoinByCode} variant="primary-light">
                Unirse a un curso
            </VariantButton>
        {/if}
    {/snippet}
</Sidebar>

<style>
    .sidebar-title {
        color: var(--primary-color);
        font-size: 1.5rem;
        font-weight: bold;
    }
</style>
