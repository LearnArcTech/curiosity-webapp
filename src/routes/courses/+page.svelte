<script lang="ts">
    import type { DashboardStudentEntry } from "$lib/api";
    import Card from "$lib/components/basic/card.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import { Warning } from "@material-symbols-svg/svelte";
    import { EmptyDashboard, Person } from "@material-symbols-svg/svelte";
    import Podium from "$lib/components/cards/podium.svelte";

    let { data } = $props();
    let summaryData = $derived(data.summaryData);

    let assistanceAverage = $derived(summaryData?.assistance_average ?? 0);
    let participationAverage = $derived(
        summaryData?.participation_average ?? 0,
    );
    let sessionLengthAverage = $derived(
        summaryData?.session_length_average ?? 0,
    );

    function initials(username: string): string {
        return username.slice(0, 2).toUpperCase();
    }

    let uniqueStudents = $derived(
        Array.from(
            new Map(
                (summaryData?.students ?? []).map(
                    (s: DashboardStudentEntry) => [s.id, s],
                ),
            ).values(),
        ),
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
                <div class="classmates-wrapper">
                    <h3>Lista de participantes</h3>
                    {#if !summaryData?.students?.length}
                        <div class="empty">
                            <Person size={80} />
                            <p>No hay participantes todavia.</p>
                        </div>
                    {:else}
                        <ul class="participant-list">
                            {#each uniqueStudents as s (s.id)}
                                <li class="participant-row">
                                    <div class="avatar small">
                                        {initials(s.username)}
                                    </div>
                                    <span class="participant-username"
                                        >{s.username}</span
                                    >
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
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

    .classmates-wrapper {
        text-align: center;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .empty {
        color: var(--text-color);
        font-size: 0.85rem;
        margin: auto;
    }

    .avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .avatar.small {
        width: 32px;
        height: 32px;
        font-size: 0.7rem;
        background-color: var(--secondary-color);
    }

    /* Participant list */
    .participant-list {
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

    .participant-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        border-radius: var(--radius);
        background-color: rgba(255, 255, 255, 0.04);
    }

    .participant-username {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
