<script lang="ts">
    import DataTable from "$lib/components/data/data-table.svelte";
    import { rankings } from "$lib/api";
    import { page } from "$app/state";
    import { Person } from "@material-symbols-svg/svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import SummaryCard from "$lib/components/cards/summary-card.svelte";

    let { data } = $props();

    let role = $derived(data.user?.role ?? "student");
    let isStudent = $derived(role === "student");

    let studentRankings = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    let currentUserScore = $derived(
        studentRankings.find((student) => student.user_id === data.user?.id)
            ?.participation_value ?? 0,
    );

    const columns = [
        {
            key: "profile",
            label: "Perfil",
            width: "80px",
            align: "center" as const,
        },
        { key: "username", label: "Nombre" },
        {
            key: "quiz_score",
            label: "Puntaje",
            align: "right" as const,
            width: "120px",
        },
    ];

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
                cardValue={currentUserScore}
            ></SummaryCard>
        </div>
    {/if}

    {#if loading}
        <div class="status-container loading-state">
            <WaveLoader size={24} />
            <p>Cargando tabla de posiciones...</p>
        </div>
    {:else if errorMsg}
        <div class="status-container error-state">
            <p class="error-text">{errorMsg}</p>
            <VariantButton onclick={() => window.location.reload()}>
                Reintentar
            </VariantButton>
        </div>
    {:else}
        {#if isStudent}
            <h2>Puntaje de tus compañeros</h2>
        {/if}
        <DataTable
            items={studentRankings}
            {columns}
            searchKeys={["username"]}
            searchPlaceholder="Buscar estudiante..."
        >
            {#snippet cell({ column, value })}
                {#if column.key === "profile"}
                    <div class="avatar-cell">
                        <Person size={14} />
                    </div>
                {:else}
                    <span
                        class={column.key === "score"
                            ? "score-bold"
                            : "text-regular"}
                    >
                        {value}
                    </span>
                {/if}
            {/snippet}
        </DataTable>
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }

    .title {
        color: var(--primary-color);
    }

    .status-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 64px 32px;
        text-align: center;
        color: var(--text-color);
        font-size: calc(1rem * var(--font-scale));
    }

    .loading-state p {
        margin-top: 12px;
        color: var(--text-color);
    }

    .error-state {
        border-color: var(--border-color);
        background-color: var(--error-container-color);
    }

    .error-text {
        color: var(--error-color);
        font-weight: 500;
        margin: 0 0 16px 0;
    }

    .avatar-cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
        width: 26px;
        height: 26px;
        border-radius: 50%;
    }

    .text-regular {
        font-weight: 500;
        color: var(--text-color);
    }

    .score-bold {
        font-family: monospace;
        font-weight: 700;
        color: var(--text-color);
        font-size: calc(1rem * var(--font-scale));
    }
</style>
