<script lang="ts">
    import { page } from "$app/state";
    import { goto, beforeNavigate } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import { animate } from "animejs";
    import { fly } from "svelte/transition";
    import CourseDetailsSidebar from "$lib/components/sidebar/course-details-sidebar.svelte";

    let { data, children } = $props();
    let role = $derived(data.user?.role ?? "student");
    let segments = $derived(page.url.pathname.split("/").filter(Boolean));
    let section = $derived(segments[2]);
    let subsection = $derived(segments[3]);
    let courseId = $derived(page.params.courseId);
    let basicCourse = $derived(
        data.coursesList?.find((c) => c.id === courseId) ?? null,
    );

    $effect(() => {
        if (data.coursesList && courseId && !basicCourse) {
            goto("/courses?notice=course_unavailable");
        }
    });

    let dashboardEl: HTMLDivElement;
    let sidebarEl: HTMLDivElement;
    let contentEl: HTMLDivElement;

    const ENTER_CONTENT_DELAY = 180;
    const ENTER_CONTENT_DURATION = 150;
    const ENTER_SIDEBAR_DURATION = 120;

    const EXIT_CONTENT_DURATION = 160;
    const EXIT_SIDEBAR_DELAY = 80;
    const EXIT_SIDEBAR_DURATION = 180;
    const EXIT_BOUNCE_DURATION = 500;

    let activeAnimations: ReturnType<typeof animate>[] = [];

    function killActiveAnimations() {
        for (const anim of activeAnimations) {
            anim.revert();
        }
        activeAnimations = [];
    }

    function snapToSettled() {
        killActiveAnimations();
        if (dashboardEl) dashboardEl.style.transform = "";
        if (sidebarEl) {
            sidebarEl.style.opacity = "1";
            sidebarEl.style.transform = "";
        }
        if (contentEl) {
            contentEl.style.opacity = "1";
            contentEl.style.transform = "";
        }
    }

    function playEnter() {
        if (!dashboardEl || !sidebarEl || !contentEl) return;
        killActiveAnimations();

        sidebarEl.style.opacity = "0";
        sidebarEl.style.transform = "translateX(-12px)";
        contentEl.style.opacity = "0";
        contentEl.style.transform = "translateX(-12px)";

        activeAnimations.push(
            animate(sidebarEl, {
                opacity: [0, 1],
                translateX: [-12, 0],
                duration: ENTER_SIDEBAR_DURATION,
                ease: "outExpo",
            }),
        );

        activeAnimations.push(
            animate(contentEl, {
                opacity: [0, 1],
                translateX: [-12, 0],
                duration: ENTER_CONTENT_DURATION,
                delay: ENTER_CONTENT_DELAY,
                ease: "outExpo",

                onComplete: () => {
                    activeAnimations = [];
                },
            }),
        );
    }

    function playExit(onDone: () => void) {
        if (!dashboardEl || !sidebarEl || !contentEl) {
            onDone();
            return;
        }
        killActiveAnimations();

        activeAnimations.push(
            animate(contentEl, {
                opacity: [1, 0],
                translateX: [0, -12],
                duration: EXIT_CONTENT_DURATION,
                ease: "outExpo",
            }),
        );

        activeAnimations.push(
            animate(sidebarEl, {
                opacity: [1, 0],
                translateX: [0, -12],
                duration: EXIT_SIDEBAR_DURATION,
                delay: EXIT_SIDEBAR_DELAY,
                ease: "outExpo",
                onComplete: () => {
                    activeAnimations = [];
                    onDone();
                },
            }),
        );
    }

    let isExiting = false;
    let allowNextNavigation = false;

    function isCoursePath(pathname: string) {
        return /^\/courses\/[^/]+/.test(pathname);
    }

    beforeNavigate((navigation) => {
        if (!navigation.to) return;

        if (allowNextNavigation) {
            allowNextNavigation = false;
            return;
        }

        const fromPath = page.url.pathname;
        const toPath = navigation.to.url.pathname;

        const fromIsCourse = isCoursePath(fromPath);
        const toIsCourse = isCoursePath(toPath);

        if (fromIsCourse && toIsCourse) {
            snapToSettled();
            isExiting = false;
            return;
        }

        if (!toIsCourse) {
            const targetUrl = toPath + navigation.to.url.search;

            if (isExiting) {
                return;
            }

            navigation.cancel();
            isExiting = true;

            playExit(() => {
                isExiting = false;
                allowNextNavigation = true;
                goto(targetUrl);
            });
        }
    });

    onMount(() => {
        playEnter();
    });

    onDestroy(() => {
        killActiveAnimations();
    });
</script>

<div class="dashboard" bind:this={dashboardEl}>
    <div bind:this={sidebarEl}>
        <CourseDetailsSidebar
            courseName={basicCourse?.name ?? "Course"}
            role={role === "teacher" ? "teacher" : "student"}
            {section}
            {subsection}
            subHref={(sectionKey, subKey) =>
                `/courses/${page.params.courseId}/${sectionKey}/${subKey}`}
            settingsHref={`/courses/${page.params.courseId}/settings`}
        />
    </div>
    <div class="content" bind:this={contentEl}>
        {#key page.url.pathname}
            <div in:fly={{ y: 16, duration: 220 }}>
                {@render children()}
            </div>
        {/key}
    </div>
</div>

<style>
    .dashboard {
        display: flex;
        height: 100%;
    }

    .dashboard > div {
        z-index: 100;
    }

    .content {
        flex: 1;
        padding: 2rem;
        width: 100%;
        height: 100%;
    }

    .content > div {
        width: 100%;
        height: 100%;
    }
</style>
