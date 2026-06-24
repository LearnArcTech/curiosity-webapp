<script lang="ts">
    import { page } from "$app/state";
    import { invalidateAll } from "$app/navigation";
    import { onMount } from "svelte";
    import CourseSidebar from "$lib/components/sidebar/course-sidebar.svelte";
    import CreateCourseDialog from "$lib/components/modals/create-course-dialog.svelte";
    import EnrollDialog from "$lib/components/modals/enroll-dialog.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { courses } from "$lib/api";
    let { data, children } = $props();
    let role = $derived(data.user?.role ?? "student");
    let isTeacher = $derived(role === "teacher");
    let showCreateCourse = $state(false);
    let showEnroll = $state(false);
    let isLeavingCourse = $state(false);

    async function handleCreateCourse(name: string) {
        await courses.create(name);
        await invalidateAll();
    }
    async function handleEnroll(courseId: string) {
        await courses.enroll(courseId);
        await invalidateAll();
    }
    onMount(() => {
        const unsubscribe = courses.subscribeAll(() => {
            invalidateAll();
        });
        return unsubscribe;
    });

    $effect(() => {
        if (page.url.pathname === "/courses") {
            isLeavingCourse = false;
        }
    });
</script>

<div class="dashboard">
    <div>
        <CourseSidebar
            courses={data.coursesList}
            courseId={page.params.courseId}
            role={isTeacher ? "teacher" : "student"}
            courseHref={(id) => `/courses/${id}`}
            onCreateCourse={() => (showCreateCourse = true)}
            onJoinByCode={() => (showEnroll = true)}
            onLeaveCourse={() => (isLeavingCourse = true)}
        />
    </div>
    <div class="content">
        {@render children()}
        {#if isLeavingCourse}
            <div class="loader-overlay">
                <WaveLoader size={48} />
            </div>
        {/if}
    </div>
</div>
<CreateCourseDialog
    bind:open={showCreateCourse}
    onCreateCourse={handleCreateCourse}
/>
<EnrollDialog bind:open={showEnroll} onEnroll={handleEnroll} />

<style>
    .dashboard {
        display: flex;
        height: 100%;
        width: 100%;
    }

    .dashboard > div {
        z-index: 999;
    }

    .content {
        position: relative;
        height: 100%;
        width: 100%;
        z-index: -1;
        overflow-x: hidden;
    }

    .loader-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--background-color);
        opacity: 50%;
        z-index: 10;
    }
</style>
