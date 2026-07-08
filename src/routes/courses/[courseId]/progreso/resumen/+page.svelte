<script lang="ts">
    import { page } from "$app/state";
    import {
        dashboard,
        courses,
        repository,
        type CourseSummaryData,
    } from "$lib/api";
    import type { RepositorySummary } from "$lib/api/types";
    import Card from "$lib/components/basic/card.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import Podium from "$lib/components/cards/podium.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import { EmptyDashboard } from "@material-symbols-svg/svelte";
    import StudentList from "$lib/components/cards/student-list.svelte";

    let { data } = $props();

    let summaryData = $state<CourseSummaryData | null>(null);
    let repoSummary = $state<RepositorySummary | null>(null);
    let isTeacher = $state(false);
    let loading = $state(true);
    let errorMsg = $state("");

    let removingId = $state<string | null>(null);

    let confirmOpen = $state(false);
    let pendingStudent = $state<{ id: string; username: string } | null>(null);

    let assistanceAverage = $derived(summaryData?.assistance_average ?? 0);
    let participationAverage = $derived(
        ((summaryData?.participation_average ?? 0) / 5) * 100,
    );
    let sessionLengthAverage = $derived(
        summaryData?.session_length_average ?? 0,
    );

    let heaviestFiles = $derived(
        [...(repoSummary?.files ?? [])]
            .sort((a, b) => b.file_size - a.file_size)
            .slice(0, 5),
    );

    function formatBytes(bytes: number, decimals = 1) {
        if (!+bytes) return "0 B";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    async function initPage(cId: string) {
        loading = true;
        errorMsg = "";
        try {
            const [summaryRes, repoRes, teachersRes] = await Promise.all([
                dashboard.courseSummary(cId),
                repository.list(cId),
                courses.listTeachers(cId),
            ]);
            summaryData = summaryRes;
            repoSummary = repoRes;
            isTeacher = teachersRes.some((t) => t.id === data.user?.id);
        } catch (err: any) {
            console.error("Initialization failure:", err);
            errorMsg =
                err.message || "No se pudo cargar la información del resumen.";
        } finally {
            loading = false;
        }
    }

    function requestRemoveStudent(studentId: string, username: string) {
        pendingStudent = { id: studentId, username };
        confirmOpen = true;
    }

    async function confirmRemoveStudent() {
        if (!pendingStudent) return;
        const courseId = page.params.courseId;
        if (!courseId) return;

        const { id, username } = pendingStudent;
        removingId = id;
        confirmOpen = false;

        try {
            await courses.removeStudent(courseId, id);
            if (summaryData?.students) {
                summaryData = {
                    ...summaryData,
                    students: summaryData.students.filter((s) => s.id !== id),
                };
            }
        } catch (err: any) {
            console.error("Failed to remove student:", err);
        } finally {
            removingId = null;
            pendingStudent = null;
        }
    }

    $effect(() => {
        const courseId = page.params.courseId;
        if (!courseId) return;
        initPage(courseId);
    });
</script>

<main>
    <h1 class="title">Resumen</h1>
    {#if loading}
        <div class="loader-container">
            <WaveLoader size={28} />
            <p>Cargando métricas del curso...</p>
        </div>
    {:else if errorMsg}
        <div class="error-container">
            <p>{errorMsg}</p>
            <VariantButton onclick={() => window.location.reload()}
                >Reintentar</VariantButton
            >
        </div>
    {:else}
        <div class="card-header">
            <SummaryCard
                cardTitle="Asistencia promedio"
                cardValue={assistanceAverage.toFixed(2) + "%"}
            ></SummaryCard>
            <SummaryCard
                cardTitle="Puntaje de participación promedio"
                cardValue={participationAverage.toFixed(2) + "%"}
            ></SummaryCard>
            <SummaryCard
                cardTitle="Duración promedio de sesiones"
                cardValue={sessionLengthAverage.toFixed(2) + " min"}
            ></SummaryCard>
        </div>

        <h2 class="title">General</h2>
        <div class="summary-content">
            <Card class="card-fill">
                <Podium
                    title="Podio de participación"
                    podium={summaryData?.podium}
                >
                    {#snippet emptyIcon()}
                        <EmptyDashboard size={80} />
                    {/snippet}
                </Podium>
            </Card>

            <Card class="card-fill">
                <div class="files-wrapper">
                    <h3>Archivos más pesados</h3>
                    {#if !heaviestFiles.length}
                        <div class="empty">
                            <p>El repositorio está vacío.</p>
                        </div>
                    {:else}
                        <ul class="file-list">
                            {#each heaviestFiles as file (file.id)}
                                <li class="file-row">
                                    <span class="filename" title={file.filename}
                                        >{file.filename}</span
                                    >
                                    <span class="filesize"
                                        >{formatBytes(file.file_size)}</span
                                    >
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            </Card>

            <Card class="card-fill">
                <StudentList
                    students={summaryData?.students ?? []}
                    {isTeacher}
                    {removingId}
                    onRemove={requestRemoveStudent}
                />
            </Card>
        </div>
    {/if}
</main>

<ConfirmDialog
    bind:open={confirmOpen}
    title="Quitar participante"
    onAccept={confirmRemoveStudent}
>
    {#snippet content()}
        {#if pendingStudent}
            <p>
                ¿Quitar a {pendingStudent.username} del curso? Esta acción no se puede
                deshacer.
            </p>
        {/if}
    {/snippet}
</ConfirmDialog>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .title {
        color: var(--primary-color);
    }

    .card-header {
        display: flex;
        gap: 1rem;
        width: 100%;
        justify-content: space-between;
        padding: 1rem 0;
    }

    .summary-content {
        display: flex;
        width: 100%;
        flex: 1;
        gap: 2rem;
        padding-top: 1rem;
    }

    .summary-content :global(.card-fill) {
        flex: 1;
        min-width: 0;
    }

    .files-wrapper {
        text-align: center;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .loader-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-color);
    }

    .error-container {
        border-color: var(--error-container-color);
        color: var(--error-color);
    }

    .empty {
        color: var(--text-color);
        font-size: 1rem;
        margin: auto;
    }

    .file-list {
        list-style: none;
        margin: 0;
        padding: 0.5rem 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
        flex: 1;
        text-align: left;
    }

    .file-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 6px 10px;
        border-radius: var(--radius);
        background-color: color-mix(in srgb, var(--text-color) 5%, transparent);
    }

    .filename {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .filename {
        flex: 1;
    }

    .filesize {
        font-size: 0.85rem;
        color: var(--text-color);
        opacity: 0.7;
        white-space: nowrap;
    }

    @container course-content (max-width: 1250px) {
        .card-header,
        .summary-content {
            flex-direction: column;
        }
    }
</style>
