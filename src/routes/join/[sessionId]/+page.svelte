<script lang="ts">
    import { sessions, profile } from "$lib/api";
    import { tick } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { onDestroy } from "svelte";

    const sessionId = $derived(page.params.sessionId);

    let password = $state("");

    let uiState = $state<"form" | "waiting" | "approved">("form");

    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    let myId = $state<string | null>(null);
    let unsubscribeRealtime = $state<(() => void) | null>(null);

    async function handleJoin() {
        isSubmitting = true;
        errorMessage = null;
        if (!sessionId) return;

        try {
            if (!myId) {
                const me = await profile.me();
                myId = me.id;
            }
            if (!myId) return;
            const res = await sessions.join(sessionId, password);

            if (res.status === "approved") {
                uiState = "approved";
                goto(`/session/${sessionId}`);
            } else if (res.status === "waiting") {
                uiState = "waiting";

                if (unsubscribeRealtime) unsubscribeRealtime();
                unsubscribeRealtime = sessions.subscribeToParticipant(
                    sessionId,
                    myId,
                    async (newDatabaseStatus) => {
                        console.log(
                            "[JOIN] onStatusChange called with:",
                            newDatabaseStatus,
                        );
                        if (newDatabaseStatus === "approved") {
                            uiState = "approved";
                            if (unsubscribeRealtime) unsubscribeRealtime();
                            await tick();
                            console.log(
                                "[JOIN] calling goto:",
                                `/session/${sessionId}`,
                            );
                            goto(`/session/${sessionId}`);
                            console.log("[JOIN] goto called");
                        } else if (newDatabaseStatus === "left") {
                            uiState = "form";
                            errorMessage =
                                "Has sido removido de la sala de espera.";
                            if (unsubscribeRealtime) unsubscribeRealtime();
                        }
                    },
                );
            }
        } catch (error: any) {
            errorMessage =
                error?.message || "Error al intentar unirse a la sesión.";
            uiState = "form";
        } finally {
            isSubmitting = false;
        }
    }

    onDestroy(() => {
        if (unsubscribeRealtime) unsubscribeRealtime();
    });
</script>

<div class="join-container">
    {#if uiState === "form"}
        <div class="join-card">
            <h1 class="display-title">Unirse a la Sesión</h1>
            <p class="subtitle">
                Introduce las credenciales si el docente las solicita.
            </p>

            <div class="input-group">
                <label for="session-pass">Contraseña de acceso (Opcional)</label
                >
                <input
                    id="session-pass"
                    type="password"
                    bind:value={password}
                    placeholder="**********"
                    disabled={isSubmitting}
                />
            </div>

            {#if errorMessage}
                <div class="error-banner">⚠️ {errorMessage}</div>
            {/if}

            <VariantButton
                class="submit-btn"
                onclick={handleJoin}
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <WaveLoader size={16} />
                    <span>Validando acceso...</span>
                {:else}
                    <span>Ingresar a la clase</span>
                {/if}
            </VariantButton>
        </div>
    {:else}
        <div class="waiting-card">
            <WaveLoader size={42} />
            <h2 class="display-title animate-pulse">En la sala de espera...</h2>
            <p class="waiting-text">
                Te has conectado con éxito. Por favor, aguarda a que el docente
                apruebe tu ingreso desde su panel de control.
            </p>
        </div>
    {/if}
</div>

<style>
    .join-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        font-family: var(--font-body);
        color: var(--text-color);
        padding: 20px;
    }

    .join-card,
    .waiting-card {
        background-color: var(--neutral-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 40px;
        width: 100%;
        max-width: 460px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .waiting-card {
        align-items: center;
        text-align: center;
        padding: 60px 40px;
    }

    .display-title {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
    }

    .subtitle {
        font-size: 0.95rem;
        opacity: 0.7;
        margin: 0;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .input-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--border-color);
    }

    .input-group input {
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        font-family: var(--font-body);
        font-size: 1rem;
    }

    .input-group input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
    }

    .error-banner {
        color: var(--error-color);
        background-color: var(--error-container-color);
        border: 1px solid var(--error-color);
        border-radius: var(--radius);
        padding: 12px;
        font-size: 0.85rem;
    }

    :global(.submit-btn) {
        background-color: var(--primary-color) !important;
        color: var(--text-color-light) !important;
        justify-content: center;
        padding: 14px !important;
        font-weight: 600;
    }

    .waiting-text {
        font-size: 1rem;
        line-height: 1.6;
        opacity: 0.8;
    }

    .animate-pulse {
        animation: pulse 1.8s infinite ease-in-out;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
