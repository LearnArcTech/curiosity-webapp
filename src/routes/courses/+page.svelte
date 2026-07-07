<script lang="ts">
    import Card from "$lib/components/basic/card.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import { Warning } from "@material-symbols-svg/svelte";
    import { EmptyDashboard } from "@material-symbols-svg/svelte";
    import Podium from "$lib/components/cards/podium.svelte";
    import StudentList from "$lib/components/cards/student-list.svelte";

    let { data } = $props();
    let summaryData = $derived(data.summaryData);

    let assistanceAverage = $derived(summaryData?.assistance_average ?? 0);
    let participationAverage = $derived(
        summaryData?.participation_average ?? 0,
    );
    let sessionLengthAverage = $derived(
        summaryData?.session_length_average ?? 0,
    );
</script>

<main>
    {#if data.coursesList.length === 0}
        <div class="center-wrap">
            <Warning size={150} />
            <h1>No tienes ningun curso!</h1>
            <p>
                Aqui apareceran las estadisticas generales de tu curso tan
                pronto tengamos informacion.
            </p>
        </div>
    {:else}
        <h1 class="title">Resumen</h1>

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
        <h1 class="title">General</h1>
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
                <StudentList students={summaryData?.students ?? []} />
            </Card>
        </div>
    {/if}
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 2rem;
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
    }

    .center-wrap {
        text-align: center;
    }

    @media (max-width: 900px) {
        .card-header,
        .summary-content {
            flex-direction: column;
        }
    }
</style>
