<script lang="ts">
    import type { Snippet } from "svelte";

    type PodiumEntry = {
        username: string;
        quiz_score: number;
    };

    let {
        title,
        podium,
        emptyMessage = "Aún no hay puntajes registrados.",
        emptyIcon,
    }: {
        title: string;
        podium: PodiumEntry[] | null | undefined;
        emptyMessage?: string;
        emptyIcon?: Snippet;
    } = $props();

    const podiumOrder = [
        { place: 1, label: "1°" },
        { place: 2, label: "2°" },
        { place: 3, label: "3°" },
    ];

    let podiumByPlace = $derived(
        podiumOrder.map((p) => ({
            ...p,
            entry: podium?.[p.place - 1] ?? null,
        })),
    );

    let podiumDisplayOrder = $derived(
        [1, 0, 2].map((i) => podiumByPlace[i]).filter((p) => p !== undefined),
    );

    let maxPodiumScore = $derived(
        Math.max(1, ...(podium?.map((p) => p.quiz_score) ?? [0])),
    );

    function initials(username: string): string {
        return username.slice(0, 2).toUpperCase();
    }
</script>

<div class="podium-wrapper">
    <h3>{title}</h3>
    {#if !podium?.length}
        <div class="empty">
            {@render emptyIcon?.()}
            <p>{emptyMessage}</p>
        </div>
    {:else}
        <div class="podium">
            {#each podiumDisplayOrder as p (p.place)}
                <div class="podium-slot" class:empty-slot={!p.entry}>
                    {#if p.entry}
                        <div class="podium-profile">
                            <div
                                class="avatar"
                                class:gold={p.place === 1}
                                class:silver={p.place === 2}
                                class:bronze={p.place === 3}
                                aria-hidden="true"
                            >
                                {initials(p.entry.username)}
                            </div>
                            <span class="podium-username"
                                >{p.entry.username}</span
                            >
                            <span class="visually-hidden"
                                >Puntaje: {p.entry.quiz_score}</span
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
                                  (p.entry.quiz_score / maxPodiumScore) * 100,
                              )}%`
                            : "20%"}
                    >
                        <span class="place-label">{p.label}</span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .podium-wrapper {
        text-align: center;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .empty {
        color: var(--text-color);
        font-size: 1rem;
        margin: auto;
    }

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

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: var(--text-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .avatar.gold {
        background-color: #d4af37;
        color: var(--text-color);
    }

    .avatar.silver {
        background-color: #a8a8a8;
        color: var(--text-color);
    }

    .avatar.bronze {
        background-color: #b08d57;
        color: var(--text-color);
    }

    .bar {
        width: 100%;
        border-radius: var(--radius) var(--radius) 0 0;
        background-color: var(--primary-color);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 8px;
        transition: height var(--motion-duration) ease;
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
        font-size: 1rem;
        color: var(--text-color-light);
    }

    .bar.gold .place-label,
    .bar.silver .place-label,
    .bar.bronze .place-label {
        color: var(--text-color);
    }

    .empty-slot .bar {
        opacity: 0.3;
    }
</style>
