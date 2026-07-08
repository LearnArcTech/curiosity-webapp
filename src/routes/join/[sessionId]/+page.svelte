<script lang="ts">
    import { sessions, profile } from "$lib/api";
    import { tick, onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import { onDestroy } from "svelte";

    import LetterField from "$lib/components/eye-candy/letter-field.svelte";

    import ImageMask from "$lib/assets/pexels-ruben-boekeloo-521336009-37148217.jpg";
    import ImageMask2 from "$lib/assets/pexels-justus-menke-3490295-5393415.jpg";
    import ImageMask3 from "$lib/assets/pexels-wwarby-19673910.jpg";

    import WaitingAudio1 from "$lib/assets/sleeping-snow.mp3";
    import WaitingAudio2 from "$lib/assets/leberch-piano-516448.mp3";
    import WaitingAudio3 from "$lib/assets/atlasaudio-nature-piano-519619.mp3";

    const waitingPlaylist = [WaitingAudio1, WaitingAudio2, WaitingAudio3];

    const PASSWORD_REQUIRED_MESSAGE = "Contraseña de acceso incorrecta.";

    const sessionId = $derived(page.params.sessionId);

    let password = $state("");

    let uiState = $state<"checking" | "form" | "waiting" | "approved">(
        "checking",
    );

    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    let myId = $state<string | null>(null);
    let unsubscribeRealtime = $state<(() => void) | null>(null);

    let audioEl = $state<HTMLAudioElement | null>(null);
    let isMuted = $state(false);

    let trackIndex = $state(0);
    let playOrder = $state<number[]>([]);

    function shuffledIndices(length: number) {
        const arr = Array.from({ length }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function playCurrentTrack() {
        if (!audioEl || playOrder.length === 0) return;
        audioEl.src = waitingPlaylist[playOrder[trackIndex]];
        audioEl.currentTime = 0;
        audioEl.play().catch((err) => {
            console.warn("[JOIN] Audio autoplay blocked:", err);
        });
    }

    function handleTrackEnded() {
        trackIndex = (trackIndex + 1) % playOrder.length;
        if (trackIndex === 0)
            playOrder = shuffledIndices(waitingPlaylist.length);
        playCurrentTrack();
    }

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let lowpass: BiquadFilterNode | null = null;
    let highpass: BiquadFilterNode | null = null;
    let graphReady = false;

    function setupAudioGraph() {
        if (graphReady || !audioEl) return;
        audioCtx = new AudioContext();
        sourceNode = audioCtx.createMediaElementSource(audioEl);

        lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 2200;
        lowpass.Q.value = 0.7;

        highpass = audioCtx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 300;
        highpass.Q.value = 0.7;

        sourceNode
            .connect(highpass)
            .connect(lowpass)
            .connect(audioCtx.destination);

        graphReady = true;
    }

    onMount(() => {
        const saved = localStorage.getItem("waitingRoomMuted");
        if (saved !== null) isMuted = saved === "true";
    });

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem("waitingRoomMuted", String(isMuted));
        if (audioEl) audioEl.muted = isMuted;
    }

    $effect(() => {
        if (!audioEl) return;

        if (uiState === "waiting") {
            setupAudioGraph();
            if (audioCtx?.state === "suspended") audioCtx.resume();
            audioEl.muted = isMuted;

            if (playOrder.length === 0) {
                playOrder = shuffledIndices(waitingPlaylist.length);
                trackIndex = 0;
            }
            playCurrentTrack();
        } else {
            audioEl.pause();
        }
    });

    async function handleJoinResult(res: {
        status: "waiting" | "approved";
        message: string;
    }) {
        if (res.status === "approved") {
            uiState = "approved";
            goto(`/session/${sessionId}`);
        } else if (res.status === "waiting") {
            uiState = "waiting";

            if (!myId) {
                const me = await profile.me();
                myId = me.id;
            }
            if (!myId || !sessionId) return;

            if (unsubscribeRealtime) unsubscribeRealtime();
            unsubscribeRealtime = sessions.subscribeToParticipant(
                sessionId,
                myId,
                async (newDatabaseStatus) => {
                    if (newDatabaseStatus === "approved") {
                        uiState = "approved";
                        if (unsubscribeRealtime) unsubscribeRealtime();
                        await tick();
                        goto(`/session/${sessionId}`);
                    } else if (newDatabaseStatus === "left") {
                        uiState = "form";
                        errorMessage =
                            "Has sido removido de la sala de espera.";
                        if (unsubscribeRealtime) unsubscribeRealtime();
                    }
                },
            );
        }
    }

    async function attemptSilentJoin() {
        if (!sessionId) {
            uiState = "form";
            return;
        }

        try {
            if (!myId) {
                const me = await profile.me();
                myId = me.id;
            }

            const res = await sessions.join(sessionId, "");
            await handleJoinResult(res);
        } catch (error: any) {
            const message: string = error?.message || "";

            if (message.includes(PASSWORD_REQUIRED_MESSAGE)) {
                uiState = "form";
            } else {
                errorMessage =
                    message || "Error al intentar unirse a la sesión.";
                uiState = "form";
            }
        }
    }

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
            await handleJoinResult(res);
        } catch (error: any) {
            errorMessage =
                error?.message || "Error al intentar unirse a la sesión.";
            uiState = "form";
        } finally {
            isSubmitting = false;
        }
    }

    onMount(() => {
        attemptSilentJoin();
    });

    onDestroy(() => {
        if (unsubscribeRealtime) unsubscribeRealtime();
        if (audioEl) audioEl.pause();
        if (audioCtx) audioCtx.close();
    });
</script>

<div class="join-container">
    <LetterField
        text=""
        maskImages={[ImageMask, ImageMask2, ImageMask3]}
        maskCycleMs={5000}
        maskContrast={2}
        maskFloor={0.05}
        targetCellCount={3500}
    />

    <div class="content-layer">
        {#if uiState === "checking"}
            <div class="join-card checking-card">
                <WaveLoader size={32} />
                <p class="subtitle">Verificando acceso...</p>
            </div>
        {:else if uiState === "form"}
            <div class="join-card">
                <h1 class="display-title">Unirse a la Sesión</h1>
                <p class="subtitle">
                    Introduce las credenciales si el docente las solicita.
                </p>

                <div class="input-group">
                    <label for="session-pass"
                        >Contraseña de acceso (Opcional)</label
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
                <h2 class="display-title animate-pulse">
                    En la sala de espera...
                </h2>
                <p class="waiting-text">
                    Te has conectado con éxito. Por favor, aguarda a que el
                    docente apruebe tu ingreso desde su panel de control.
                </p>

                <VariantButton
                    onclick={toggleMute}
                    type="button"
                    variant={isMuted ? "primary-dark" : "primary-light"}
                >
                    {isMuted ? "Sonido desactivado" : "Sonido activado"}
                </VariantButton>

                <audio
                    bind:this={audioEl}
                    preload="auto"
                    volume={0.5}
                    onended={handleTrackEnded}
                ></audio>
            </div>
        {/if}
    </div>
</div>

<style>
    .join-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        font-family: var(--font-body);
        color: var(--text-color);
        padding: 20px;
        overflow: hidden;
    }

    .checking-card {
        align-items: center;
        text-align: center;
        gap: 16px;
        padding: 60px 40px;
    }

    .content-layer {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
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
