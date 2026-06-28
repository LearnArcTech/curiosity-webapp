<script lang="ts">
    import type { DashboardStudentEntry } from "$lib/api";
    import Card from "$lib/components/basic/card.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";
    import { Warning } from "@material-symbols-svg/svelte";
    import { EmptyDashboard, Person } from "@material-symbols-svg/svelte";

    let { data } = $props();
    let summaryData = $derived(data.summaryData);

    let assistanceAverage = $derived(summaryData?.assistance_average ?? 0);
    let participationAverage = $derived(
        summaryData?.participation_average ?? 0,
    );
    let sessionLengthAverage = $derived(
        summaryData?.session_length_average ?? 0,
    );

    const podiumOrder = [
        { place: 1, label: "1°" },
        { place: 2, label: "2°" },
        { place: 3, label: "3°" },
    ];
    let podiumByPlace = $derived(
        podiumOrder.map((p) => ({
            ...p,
            entry: summaryData?.podium?.[p.place - 1] ?? null,
        })),
    );

    let podiumDisplayOrder = $derived(
        [1, 0, 2].map((i) => podiumByPlace[i]).filter((p) => p !== undefined),
    );
    let maxPodiumScore = $derived(
        Math.max(1, ...(summaryData?.podium?.map((p) => p.quiz_score) ?? [0])),
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
                <div class="podium-wrapper">
                    <h3>Podio de participación</h3>
                    {#if !summaryData?.podium?.length}
                        <div class="empty">
                            <EmptyDashboard size={80} />
                            <p>Aún no hay puntajes registrados.</p>
                        </div>
                    {:else}
                        <div class="podium">
                            {#each podiumDisplayOrder as p (p.place)}
                                <div
                                    class="podium-slot"
                                    class:empty-slot={!p.entry}
                                >
                                    {#if p.entry}
                                        <div class="podium-profile">
                                            <div
                                                class="avatar"
                                                class:gold={p.place === 1}
                                                class:silver={p.place === 2}
                                                class:bronze={p.place === 3}
                                            >
                                                {initials(p.entry.username)}
                                            </div>
                                            <span class="podium-username"
                                                >{p.entry.username}</span
                                            >
                                        </div>
                                    {/if}
                                    <div
                                        class="bar"
                                        class:gold={p.place === 1}
                                        class:silver={p.place === 2}
                                        class:bronze={p.place === 3}
                                        style:height={p.entry
                                            ? `${Math.max(
                                                  20,
                                                  (p.entry.quiz_score /
                                                      maxPodiumScore) *
                                                      100,
                                              )}%`
                                            : "20%"}
                                    >
                                        <span class="place-label"
                                            >{p.label}</span
                                        >
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
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
    .podium-wrapper,
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

    /* Podium */
    .podium {
        flex: 1;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 1.5rem;
        padding: 2rem 1rem 0;
    }

    .podium-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        width: 90px;
        height: 100%;
    }

    .podium-profile {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
    }

    .podium-username {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-color);
        max-width: 90px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    .avatar.gold {
        background-color: #d4af37;
    }
    .avatar.silver {
        background-color: #a8a8a8;
    }
    .avatar.bronze {
        background-color: #b08d57;
    }
    .avatar.small {
        width: 32px;
        height: 32px;
        font-size: 0.7rem;
        background-color: var(--secondary-color);
    }

    .bar {
        width: 100%;
        border-radius: var(--radius) var(--radius) 0 0;
        background-color: var(--primary-color);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 8px;
        transition: height 0.3s ease;
    }
    .bar.gold {
        background-color: #d4af37;
    }
    .bar.silver {
        background-color: #a8a8a8;
    }
    .bar.bronze {
        background-color: #b08d57;
    }

    .place-label {
        font-weight: 700;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
    }

    .empty-slot .bar {
        opacity: 0.3;
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
</style>
