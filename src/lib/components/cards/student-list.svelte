<script lang="ts">
    import { Person, PersonRemove, Search } from "@material-symbols-svg/svelte";
    import Avatar from "$lib/components/basic/avatar.svelte";

    type StudentLike = { id: string; username: string };

    let {
        students = [],
        isTeacher = false,
        removingId = null,
        onRemove,
    }: {
        students: StudentLike[];
        isTeacher?: boolean;
        removingId?: string | null;
        onRemove?: (studentId: string, username: string) => void;
    } = $props();

    let query = $state("");

    let uniqueStudents = $derived(
        Array.from(new Map(students.map((s) => [s.id, s])).values()),
    );

    let filteredStudents = $derived(
        query.trim()
            ? uniqueStudents.filter((s) =>
                  s.username.toLowerCase().includes(query.trim().toLowerCase()),
              )
            : uniqueStudents,
    );
</script>

<div class="classmates-wrapper">
    <h3>Lista de participantes</h3>

    {#if uniqueStudents.length > 0}
        <div class="search-bar">
            <input
                type="text"
                placeholder="Buscar participante..."
                bind:value={query}
                aria-label="Buscar participante por nombre de usuario"
            />
        </div>
    {/if}

    {#if !uniqueStudents.length}
        <div class="empty">
            <Person size={80} />
            <p>No hay participantes todavia.</p>
        </div>
    {:else if !filteredStudents.length}
        <div class="empty">
            <p>Ningun participante coincide con "{query}".</p>
        </div>
    {:else}
        <ul class="participant-list">
            {#each filteredStudents as s (s.id)}
                <li class="participant-row">
                    <Avatar userId={s.id} name={s.username} size={32} />
                    <span class="participant-username">{s.username}</span>
                    {#if isTeacher}
                        <button
                            type="button"
                            class="remove-btn"
                            aria-label="Quitar a {s.username} del curso"
                            disabled={removingId === s.id}
                            onclick={() => onRemove?.(s.id, s.username)}
                        >
                            <PersonRemove size={18} />
                        </button>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
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
    .search-bar {
        display: flex;
        align-items: center;
        background-color: var(--primary-container-color);
        padding: 0.25rem;
        border-radius: var(--radius);
        margin-bottom: 1rem;
        margin-top: 1rem;
    }
    .search-bar input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
        color: var(--text-color);
        outline: none;
    }
    .search-bar input:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: -2px;
    }
    .search-bar input::placeholder {
        color: var(--primary-color);
    }
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
        background-color: color-mix(in srgb, var(--text-color) 5%, transparent);
    }
    .participant-username {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }
    .remove-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: var(--error-color);
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        border-radius: var(--radius);
        flex-shrink: 0;
    }
    .remove-btn:hover:not(:disabled) {
        background-color: color-mix(
            in srgb,
            var(--error-color) 12%,
            transparent
        );
    }
    .remove-btn:focus-visible {
        outline: var(--border-width) solid var(--error-color);
        outline-offset: 2px;
    }
    .remove-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
</style>
