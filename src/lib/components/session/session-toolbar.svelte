<script lang="ts">
    import type { Role } from "$lib/api";
    import type { Panel } from "$lib/sharedTypes";
    import {
        Mic,
        MicOff,
        Videocam,
        VideocamOff,
        BackHand,
        ScreenShare,
        MoreHoriz,
        CallEnd,
        Group,
        HourglassEmpty,
        SmartToy,
        FolderOpen,
        Ballot,
    } from "@material-symbols-svg/svelte";

    interface Props {
        userRole: Role | null;
        activePanel: Panel | null;
        micEnabled: boolean;
        cameraEnabled: boolean;
        waitingCount: number;
        courseId: string;
        isActive: boolean;
        sessionName?: string;
        isHandRaised: boolean;
        onToggleMic: () => void;
        onToggleCamera: () => void;
        onToggleHand: () => void;
        onSetPanel: (panel: Panel) => void;
        onEndSession: () => void;
        onLeaveSession: () => void;
        onCreateQuiz?: () => void;
        participantCount: number;
    }

    const {
        userRole,
        activePanel,
        micEnabled,
        cameraEnabled,
        waitingCount,
        courseId,
        isActive,
        sessionName = "",
        isHandRaised,
        onToggleMic,
        onToggleCamera,
        onToggleHand,
        onSetPanel,
        onEndSession,
        onLeaveSession,
        participantCount,
        onCreateQuiz,
    }: Props = $props();

    let currentTime = $state(fmt());
    let showMoreControls = $state(false);

    $effect(() => {
        const t = setInterval(() => (currentTime = fmt()), 1000);
        return () => clearInterval(t);
    });

    function fmt() {
        return new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function handleCopyId() {
        if (!courseId || !navigator) return;
        navigator.clipboard.writeText(courseId);
    }

    function toggleMoreControls() {
        showMoreControls = !showMoreControls;
    }
</script>

<div class="toolbar">
    <div class="t-left">
        <span class="clock">{currentTime}</span>
        {#if sessionName}
            <span class="sep">|</span>
            <span class="sess-label">{sessionName}</span>
            <span class="sep">|</span>
        {/if}
        <span class="pcount">
            {participantCount}
            {participantCount === 1 ? "participante" : "participantes"}
        </span>
        {#if courseId}
            <span class="sep">|</span>
            <button class="sess-id-btn" onclick={handleCopyId}
                >Copy course Id</button
            >
        {/if}
    </div>

    <div class="t-center">
        <button
            class="ctrl"
            class:off={!micEnabled}
            onclick={onToggleMic}
            title={micEnabled ? "Silenciar" : "Activar micrófono"}
        >
            {#if micEnabled}<Mic size={20} />{:else}<MicOff size={20} />{/if}
        </button>

        <button
            class="ctrl"
            class:off={!cameraEnabled}
            onclick={onToggleCamera}
            title={cameraEnabled ? "Apagar cámara" : "Encender cámara"}
        >
            {#if cameraEnabled}
                <Videocam size={20} />
            {:else}
                <VideocamOff size={20} />
            {/if}
        </button>

        <button
            class="ctrl"
            class:hand-active={isHandRaised}
            onclick={onToggleHand}
            title={isHandRaised ? "Bajar la mano" : "Levantar la mano"}
        >
            <BackHand size={20} />
        </button>

        <div class="overflow-group">
            {#if userRole === "teacher"}
                <button class="ctrl" onclick={onCreateQuiz} title="Crear Quiz">
                    <Ballot />
                </button>
            {/if}

            <button class="ctrl" title="Compartir pantalla">
                <ScreenShare size={20} />
            </button>
        </div>

        <div class="more-wrap">
            <button
                class="ctrl more-trigger"
                onclick={toggleMoreControls}
                title="Más opciones"
                aria-expanded={showMoreControls}
            >
                <MoreHoriz size={20} />
            </button>

            {#if showMoreControls}
                <div class="more-popover">
                    {#if userRole === "teacher"}
                        <button
                            class="more-item"
                            onclick={() => {
                                onCreateQuiz?.();
                                showMoreControls = false;
                            }}
                        >
                            <Ballot size={18} />
                            <span>Crear Quiz</span>
                        </button>
                    {/if}
                    <button
                        class="more-item"
                        onclick={() => (showMoreControls = false)}
                    >
                        <ScreenShare size={18} />
                        <span>Compartir pantalla</span>
                    </button>
                </div>
            {/if}
        </div>

        {#if isActive}
            <button
                class="ctrl end-call"
                onclick={() => {
                    if (userRole === "teacher") {
                        onEndSession();
                    } else {
                        onLeaveSession();
                    }
                }}
                title="Finalizar sesión"
            >
                <CallEnd size={20} />
            </button>
        {/if}
    </div>

    <div class="t-right">
        <button
            class="pnl"
            class:active={activePanel === "participants"}
            onclick={() => onSetPanel("participants")}
            title="Participantes"
        >
            <Group size={20} />
        </button>

        {#if userRole === "teacher"}
            <div class="pnl-wrap">
                <button
                    class="pnl"
                    class:active={activePanel === "waitingRoom"}
                    onclick={() => onSetPanel("waitingRoom")}
                    title="Sala de espera"
                >
                    <HourglassEmpty size={20} />
                </button>
                {#if waitingCount > 0}
                    <span class="notif"
                        >{waitingCount > 9 ? "9+" : waitingCount}</span
                    >
                {/if}
            </div>

            <button
                class="pnl"
                class:active={activePanel === "aiChat"}
                onclick={() => onSetPanel("aiChat")}
                title="Asistente IA"
            >
                <SmartToy size={20} />
            </button>
        {/if}

        <button
            class="pnl"
            class:active={activePanel === "repository"}
            onclick={() => onSetPanel("repository")}
            title="Repositorio del curso"
        >
            <FolderOpen size={20} />
        </button>
    </div>
</div>

<style>
    .toolbar {
        display: flex;
        align-items: center;
        padding: 0 16px;
        height: 58px;
        flex-shrink: 0;
        background-color: rgba(0, 0, 0, 0.38);
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        gap: 12px;
    }

    /* Left */
    .t-left {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
        min-width: 0;
    }
    .clock {
        font-size: calc(1rem * var(--font-scale));
        color: rgba(255, 255, 255, 0.72);
        white-space: nowrap;
    }
    .sep {
        color: rgba(255, 255, 255, 0.22);
        font-size: calc(1rem * var(--font-scale));
    }
    .sess-label {
        font-size: calc(1rem * var(--font-scale));
        color: rgba(255, 255, 255, 0.42);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .pcount {
        font-size: calc(1rem * var(--font-scale));
        color: rgba(255, 255, 255, 0.35);
        white-space: nowrap;
    }

    /* Center */
    .t-center {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .ctrl {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.11);
        color: rgba(255, 255, 255, 0.82);
        transition: background-color 0.14s;
        flex-shrink: 0;
    }
    .ctrl:hover {
        background-color: rgba(255, 255, 255, 0.19);
    }
    .ctrl.off {
        background-color: rgba(186, 26, 26, 0.55);
        color: white;
    }
    .ctrl.off:hover {
        background-color: rgba(186, 26, 26, 0.75);
    }
    .ctrl.end-call {
        background-color: var(--error-color);
        color: white;
    }
    .ctrl.end-call:hover {
        background-color: #d32f2f;
    }

    .overflow-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .more-wrap {
        position: relative;
        display: none;
    }
    .more-popover {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background-color: #262626;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 190px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 1200;
    }
    .more-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.85);
        font-size: calc(1rem * var(--font-scale));
        cursor: pointer;
        white-space: nowrap;
        text-align: left;
    }
    .more-item:hover {
        background-color: rgba(255, 255, 255, 0.08);
    }

    /* Right */
    .t-right {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
        min-width: 0;
    }

    .pnl-wrap {
        position: relative;
        display: inline-flex;
    }

    .pnl {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.58);
        transition:
            background-color 0.14s,
            color 0.14s;
        flex-shrink: 0;
    }
    .pnl:hover {
        background-color: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.88);
    }
    .pnl.active {
        background-color: var(--primary-color);
        color: white;
    }

    .notif {
        position: absolute;
        top: -2px;
        right: -2px;
        background-color: var(--error-color);
        color: white;
        border-radius: 50%;
        min-width: 16px;
        height: 16px;
        font-size: calc(1rem * var(--font-scale));
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 2px;
        pointer-events: none;
    }

    .sess-id-btn {
        background: transparent;
        font-size: calc(1rem * var(--font-scale));
        color: rgba(255, 255, 255, 0.42);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: none;
        cursor: pointer;
    }

    /* ---- Responsive ---- */

    @media (max-width: 900px) {
        .sess-label,
        .toolbar .t-left .sep:last-of-type {
            display: none;
        }
    }

    @media (max-width: 700px) {
        .toolbar {
            height: auto;
            min-height: 58px;
            padding: 8px 10px;
            flex-wrap: wrap;
            justify-content: center;
            row-gap: 8px;
        }
        .t-left {
            order: 3;
            flex: 1 1 100%;
            justify-content: center;
            gap: 6px;
        }
        .t-left .sep {
            display: none;
        }
        .t-center {
            order: 1;
            flex: 1 1 100%;
            justify-content: center;
        }
        .t-right {
            order: 2;
            flex: 1 1 100%;
            justify-content: center;
        }
        .ctrl {
            width: 38px;
            height: 38px;
        }
        .overflow-group {
            display: none;
        }
        .more-wrap {
            display: inline-flex;
        }
    }

    @media (max-width: 380px) {
        .pcount {
            display: none;
        }
        .ctrl {
            width: 36px;
            height: 36px;
        }
        .pnl {
            width: 34px;
            height: 34px;
        }
    }
</style>
