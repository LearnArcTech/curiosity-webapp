<script lang="ts">
    import { page } from "$app/state";
    import { dashboard, type CourseSummaryData } from "$lib/api";
    import Card from "$lib/components/basic/card.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import Podium from "$lib/components/cards/podium.svelte";
    import PageStatus from "$lib/components/basic/page-status.svelte";
    import { EmptyDashboard } from "@material-symbols-svg/svelte";

    let { data } = $props();
    let summaryData = $state<CourseSummaryData | null>(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let currentStudent = $derived(
        summaryData?.students?.find((s) => s.id === data.user?.id),
    );
    let currentUserScore = $derived(currentStudent?.quiz_score ?? 0);

    async function initPage(cId: string) {
        loading = true;
        errorMsg = "";
        try {
            summaryData = await dashboard.courseSummary(cId);
        } catch (err: any) {
            console.error("Initialization failure:", err);
            errorMsg =
                err.message || "No se pudo cargar la información del resumen.";
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const courseId = page.params.courseId;
        if (!courseId) return;
        initPage(courseId);
    });
</script>

<main>
    <h1 class="title">Logros</h1>

    <PageStatus
        {loading}
        error={errorMsg}
        loadingMessage="Cargando métricas del curso..."
        onRetry={() => window.location.reload()}
    >
        {#snippet children()}
            <SummaryCard
                cardTitle="Tu puntaje"
                cardValue={currentUserScore.toString()}
            ></SummaryCard>
            <div class="summary-content">
                <Card class="card-fill">
                    <Podium
                        title="Podio de quizes"
                        podium={summaryData?.podium}
                    >
                        {#snippet emptyIcon()}
                            <EmptyDashboard size={80} />
                        {/snippet}
                    </Podium>
                </Card>
            </div>
        {/snippet}
    </PageStatus>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    .title {
        color: var(--primary-color);
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
    }

    @container course-content (max-width: 880px) {
        .summary-content {
            flex-direction: column;
        }
    }
</style>
