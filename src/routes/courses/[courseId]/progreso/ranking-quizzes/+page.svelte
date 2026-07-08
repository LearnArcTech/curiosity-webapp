<script lang="ts">
    import { rankings } from "$lib/api";
    import { page } from "$app/state";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import RankingsDataTable from "$lib/components/page-specific/rankings-datatable.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";

    let { data } = $props();
    let role = $derived(data.user?.role ?? "student");
    let isStudent = $derived(role === "student");
    let studentRankings = $state<
        {
            user_id: string;
            username: string;
            quiz_score: number;
        }[]
    >([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let currentUserScore = $derived(
        studentRankings.find((student) => student.user_id === data.user?.id)
            ?.quiz_score ?? 0,
    );

    async function fetchRankingsData(cId: string) {
        loading = true;
        errorMsg = "";
        try {
            const data = await rankings.quiz(cId);
            studentRankings = data || [];
        } catch (err: any) {
            console.error("Failed to load rankings:", err);
            errorMsg =
                err.message || "No se pudieron cargar las clasificaciones.";
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const currentCourseId = page.params.courseId;
        if (!currentCourseId) return;
        fetchRankingsData(currentCourseId);
    });
</script>

<main>
    <h1 class="title">
        {#if isStudent}
            Ranking de quizes
        {:else}
            Rankings
        {/if}
    </h1>

    {#if isStudent && !loading}
        <div class="user-score-card-wrap">
            <SummaryCard
                cardTitle="Tu puntaje en participación"
                cardValue={currentUserScore.toString()}
            ></SummaryCard>
        </div>
    {/if}

    <PageStatus
        {loading}
        error={errorMsg}
        loadingMessage="Cargando tabla de posiciones..."
        onRetry={() => window.location.reload()}
    >
        {#snippet children()}
            {#if isStudent}
                <h2>Puntaje de tus compañeros</h2>
            {/if}
            <RankingsDataTable items={studentRankings} scoreKey="quiz_score" />
        {/snippet}
    </PageStatus>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }

    .title {
        color: var(--primary-color);
    }
</style>
