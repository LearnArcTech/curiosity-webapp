<script lang="ts">
    import {
        sessions,
        profile,
        scores,
        students,
        repository,
        type StudentRow,
        type SessionDetail,
        type Role,
    } from "$lib/api";
    import { page } from "$app/state";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import WaitingRoomPanel from "$lib/components/session/waiting-room-panel.svelte";
    import AIChatPanel from "$lib/components/session/ai-chat-panel.svelte";
    import RepositoryPanel from "$lib/components/session/repository-panel.svelte";
    import SessionToolbar from "$lib/components/session/session-toolbar.svelte";
    import HandNotification from "$lib/components/session/hand-notification.svelte";
    import {
        CloudAlert,
        CloseSmall,
        WifiOff,
    } from "@material-symbols-svg/svelte";
    import type { Panel } from "$lib/sharedTypes";
    import { goto } from "$app/navigation";
    import { untrack } from "svelte";
    import type { ExampleSpec } from "$lib/generation/sharedTypes";
    import ConfirmDialog from "$lib/components/dialog/confirm-dialog.svelte";
    import AlertDialog from "$lib/components/dialog/alert-dialog.svelte";

    import { quizzes, type SessionQuiz, type QuizResponseRow } from "$lib/api";
    import QuizEditorModal from "$lib/components/session/quiz-editor-modal.svelte";
    import QuizResponseNotification from "$lib/components/session/quiz-response-notification.svelte";

    import ParticipantsPanel from "$lib/components/session/participants-panel.svelte";
    import SessionStage from "$lib/components/session/session-stage.svelte";

    import { fly, fade } from "svelte/transition";

    const sessionId = $derived(page.params.sessionId);

    let userRole = $state<Role | null>(null);
    let sessionData = $state<SessionDetail | null>(null);
    let myId = $state<string | null>(null);
    let isLoading = $state(true);
    let errorMessage = $state<string | null>(null);
    let activePanel = $state<Panel | null>("participants");
    let micEnabled = $state(true);
    let cameraEnabled = $state(true);
    let pendingExample = $state<ExampleSpec | null>(null);
    let pendingExampleStreaming = $state(false);
    let sharedExample = $state<ExampleSpec | null>(null);
    let confirmExitOpen = $state(false);

    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    let browserOffline = $state(
        typeof navigator !== "undefined" ? !navigator.onLine : false,
    );
    let heartbeatFailing = $state(false);
    let consecutiveHeartbeatFailures = 0;
    const HEARTBEAT_FAILURE_THRESHOLD = 2;

    let isDisconnected = $derived(browserOffline || heartbeatFailing);

    let overlayEl = $state<HTMLDivElement | undefined>();
    let elementFocusedBeforeOverlay: Element | null = null;

    let copiedField = $state<"phone" | "code" | null>(null);
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;

    const RECONNECT_PHONE = "40593-29394-2345";
    const SESSION_USER_CODE = "4534";

    async function copyToClipboard(text: string, field: "phone" | "code") {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = field;
            if (copyTimeout) clearTimeout(copyTimeout);
            copyTimeout = setTimeout(() => {
                copiedField = null;
            }, 2000);
        } catch (err) {
            console.error("No se pudo copiar al portapapeles:", err);
            showAlert("No se pudo copiar. Copia el valor manualmente.");
        }
    }

    $effect(() => {
        if (isDisconnected) {
            elementFocusedBeforeOverlay = document.activeElement;
            queueMicrotask(() => overlayEl?.focus());
        } else if (elementFocusedBeforeOverlay instanceof HTMLElement) {
            elementFocusedBeforeOverlay.focus();
            elementFocusedBeforeOverlay = null;
        }
    });

    function handleOnline() {
        browserOffline = false;
    }
    function handleOffline() {
        browserOffline = true;
    }

    let handNotifications = $state<{ id: string; username: string }[]>([]);
    let knownRaisedHandIds = $state(new Set<string>());
    const approvedParticipants = $derived(
        sessionData?.participants.filter((p) => p.status === "approved") ?? [],
    );
    const isHandRaised = $derived(
        sessionData?.participants.find((p) => p.id === myId)?.hand_raised ??
            false,
    );

    let participantCount: number = $derived(
        sessionData?.participant_count ?? 0,
    );

    let activeQuiz = $state<SessionQuiz | null>(null);
    let showQuizEditor = $state(false);
    let studentData = $state<Map<string, StudentRow>>(new Map());
    let quizResponses = $state<QuizResponseRow[]>([]);

    let alertMsg = $state("");
    let alertTitle = $state("Error");
    let alertOpen = $state(false);

    function showAlert(msg: string, title = "Error") {
        alertMsg = msg;
        alertTitle = title;
        alertOpen = true;
    }

    interface QuizResponseNotif {
        id: string;
        username: string;
        isCorrect: boolean;
        answer: string;
    }
    let quizResponseNotifications = $state<QuizResponseNotif[]>([]);

    $effect(() => {
        const currentApproved = approvedParticipants;
        if (currentApproved.length === 0 || userRole !== "teacher") return;
        const currentRaisedIds = new Set(
            currentApproved.filter((p) => p.hand_raised).map((p) => p.id),
        );

        untrack(() => {
            for (const p of currentApproved) {
                if (
                    currentRaisedIds.has(p.id) &&
                    !knownRaisedHandIds.has(p.id)
                ) {
                    if (!handNotifications.some((n) => n.id === p.id)) {
                        handNotifications.push({
                            id: p.id,
                            username: p.username,
                        });
                    }
                }
            }
            for (const notif of handNotifications) {
                if (!currentRaisedIds.has(notif.id)) {
                    dismissNotification(notif.id);
                }
            }

            knownRaisedHandIds = currentRaisedIds;
        });
    });

    function dismissNotification(id: string) {
        handNotifications = handNotifications.filter((n) => n.id !== id);
    }

    $effect(() => {
        if (!sessionId) return;
        const currentSessionId = sessionId;
        let unsubscribe: (() => void) | null = null;

        untrack(() => {
            init().then(() => {
                if (sessionData?.is_active) {
                    unsubscribe = sessions.subscribe(
                        currentSessionId,
                        async () => {
                            try {
                                const freshData =
                                    await sessions.get(currentSessionId);
                                if (
                                    currentSessionId === page.params.sessionId
                                ) {
                                    sessionData = freshData;
                                }
                            } catch (err) {
                                console.error(
                                    "Error updating real-time session state:",
                                    err,
                                );
                            }
                        },
                    );
                }
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    });

    $effect(() => {
        if (sessionData && !sessionData.is_active) {
            goto(`/courses/${sessionData.course_id}`);
        }
    });

    $effect(() => {
        if (!sessionId) return;
        const sid = sessionId;
        const unsub = quizzes.subscribeToQuizzes(sid, async () => {
            activeQuiz = await quizzes.getActive(sid).catch(() => null);
        });
        return unsub;
    });

    $effect(() => {
        if (!sessionId || userRole !== "teacher") return;
        const sid = sessionId;
        const unsub = quizzes.subscribeToResponses(sid, (row) => {
            const existing = quizResponses.findIndex(
                (r) => r.student_id === row.student_id,
            );
            if (existing >= 0) {
                quizResponses[existing] = row;
            } else {
                quizResponses.push(row);
            }

            const participant = sessionData?.participants.find(
                (p) => p.id === row.student_id,
            );
            const answerText = Array.isArray(row.answer)
                ? (row.answer as string[]).join(", ")
                : String(row.answer);

            const notif: QuizResponseNotif = {
                id: row.id,
                username: participant?.username ?? "Estudiante",
                isCorrect: row.is_correct,
                answer: answerText,
            };
            quizResponseNotifications.push(notif);

            setTimeout(() => {
                quizResponseNotifications = quizResponseNotifications.filter(
                    (n) => n.id !== notif.id,
                );
            }, 8000);
        });
        return unsub;
    });

    $effect(() => {
        if (!sessionId) return;
        const sid = sessionId;
        const unsub = sessions.subscribeToExamples(sid, (spec) => {
            sharedExample = spec as ExampleSpec | null;
        });
        return unsub;
    });

    $effect(() => {
        if (activeQuiz) quizResponses = [];
    });

    function dismissQuizResponseNotif(id: string) {
        quizResponseNotifications = quizResponseNotifications.filter(
            (n) => n.id !== id,
        );
    }

    async function handleSetParticipation(studentId: string, value: number) {
        if (!sessionData) return;
        await scores.setParticipation(sessionData.course_id, studentId, value);
        const updated = await students.list(sessionData.course_id);
        studentData = new Map(updated.map((s) => [s.id, s]));
    }

    async function handleClearParticipation(studentId: string) {
        if (!sessionData) return;
        await scores.clearParticipationOverride(
            sessionData.course_id,
            studentId,
        );
        const updated = await students.list(sessionData.course_id);
        studentData = new Map(updated.map((s) => [s.id, s]));
    }

    async function handleShareExample() {
        if (!sessionId || !pendingExample) return;
        const specToShare = pendingExample;
        try {
            await sessions.shareExample(sessionId, specToShare);
            sharedExample = specToShare;
            pendingExample = null;
        } catch (e: any) {
            showAlert("Error al compartir el ejemplo: " + e.message);
        }
    }

    async function handleSaveToRepo(spec: ExampleSpec) {
        if (!sessionData) return;
        try {
            const json = JSON.stringify(spec, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const timestamp = new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", "_");
            const file = new File([blob], `ejemplo-${timestamp}.json`, {
                type: "application/json",
            });
            await repository.add(sessionData.course_id, file);
            showAlert("Ejemplo guardado en el repositorio.", "Guardado");
        } catch (e: any) {
            showAlert("Error al guardar en el repositorio: " + e.message);
        }
    }

    async function handleClearSharedExample() {
        if (!sessionId) return;
        try {
            await sessions.clearSharedExample(sessionId);
            sharedExample = null;
        } catch (e: any) {
            showAlert("Error al retirar el ejemplo: " + e.message);
        }
    }

    async function init() {
        isLoading = true;
        errorMessage = null;
        if (!sessionId) return;

        try {
            const [userProfile] = await Promise.all([
                profile.me(),
                sessions.join(sessionId),
            ]);
            const session = await sessions.get(sessionId);

            userRole = userProfile.role;
            myId = userProfile.id;
            sessionData = session;

            if (userProfile.role === "teacher") {
                const studentList = await students.list(sessionData.course_id);
                studentData = new Map(studentList.map((s) => [s.id, s]));
            }

            [activeQuiz, sharedExample] = await Promise.all([
                quizzes.getActive(sessionId).catch(() => null),
                sessions
                    .getActiveExample(sessionId)
                    .then((s) => s as ExampleSpec | null)
                    .catch(() => null),
            ]);
        } catch (error: any) {
            errorMessage = error?.message ?? "No se pudo conectar a la sesión.";
        } finally {
            isLoading = false;
            heartbeatInterval = setInterval(async () => {
                if (!sessionId) return;
                try {
                    await sessions.heartbeat(sessionId);
                    consecutiveHeartbeatFailures = 0;
                    heartbeatFailing = false;
                } catch (err) {
                    console.error(err);
                    consecutiveHeartbeatFailures += 1;
                    if (
                        consecutiveHeartbeatFailures >=
                        HEARTBEAT_FAILURE_THRESHOLD
                    ) {
                        heartbeatFailing = true;
                    }
                }
            }, 15000);
        }
    }

    async function handleToggleHand() {
        if (!sessionId || !myId || !sessionData) return;
        const targetState = !isHandRaised;

        try {
            sessionData.participants = sessionData.participants.map((p) =>
                p.id === myId ? { ...p, hand_raised: targetState } : p,
            );
            await sessions.toggleHand(sessionId, targetState);
        } catch (error: any) {
            sessionData.participants = sessionData.participants.map((p) =>
                p.id === myId ? { ...p, hand_raised: !targetState } : p,
            );
            showAlert(
                "Error al cambiar el estado de la mano: " + error.message,
            );
        }
    }

    async function handleApprove(studentId: string) {
        if (!sessionData || !sessionId) return;
        try {
            await sessions.approveParticipant(sessionId, studentId);
            sessionData.participants = sessionData.participants.map((p) =>
                p.id === studentId ? { ...p, status: "approved" as const } : p,
            );
            sessionData.waiting_count = Math.max(
                0,
                sessionData.waiting_count - 1,
            );
            sessionData.participant_count += 1;
        } catch (error: any) {
            showAlert("Error al admitir alumno: " + error.message);
        }
    }

    async function handleDeny(studentId: string) {
        if (!sessionData || !sessionId || !studentId) return;
        try {
            await sessions.rejectParticipant(sessionId, studentId);
            sessionData.participants = sessionData.participants.filter(
                (p) => p.id !== studentId,
            );
            sessionData.waiting_count = Math.max(
                0,
                sessionData.waiting_count - 1,
            );
        } catch (error: any) {
            showAlert("Error al rechazar alumno: " + error.message);
        }
    }

    async function handleEndSession() {
        if (!sessionId) return;
        try {
            await sessions.end(sessionId);
            if (sessionData) sessionData.is_active = false;
        } catch (e: any) {
            showAlert("Error: " + e.message);
        }
    }

    async function handleLeaveSession() {
        if (!sessionId || !sessionData) return;
        try {
            await sessions.leave(sessionId, false);
        } catch (e: any) {
            showAlert("Error al salir de la sesión: " + e.message);
            return;
        }
        goto(`/courses/${sessionData.course_id}`);
    }

    function handleSetPanel(panel: Panel) {
        if (
            userRole !== "teacher" &&
            (panel === "waitingRoom" || panel === "aiChat")
        )
            return;
        activePanel = activePanel === panel ? null : panel;
    }

    function handleCanonicalExit() {
        if (!userRole) return;
        if (userRole === "teacher") handleEndSession();
        if (userRole === "student") handleLeaveSession();
    }
</script>

<svelte:window ononline={handleOnline} onoffline={handleOffline} />

<div class="session-root">
    <div class="notification-container">
        {#each handNotifications as notification (notification.id)}
            <HandNotification
                username={notification.username}
                onDismiss={() => dismissNotification(notification.id)}
            />
        {/each}
        {#each quizResponseNotifications as notif (notif.id)}
            <QuizResponseNotification
                username={notif.username}
                isCorrect={notif.isCorrect}
                answer={notif.answer}
                onDismiss={() => dismissQuizResponseNotif(notif.id)}
            />
        {/each}
    </div>

    {#if isLoading}
        <div class="center-state">
            <WaveLoader size={28} />
            <p>Conectando con la sesión...</p>
        </div>
    {:else if errorMessage}
        <div class="center-state error">
            <CloudAlert size={36} />
            <h2>Conexión fallida</h2>
            <p>{errorMessage}</p>
        </div>
    {:else if sessionData}
        <div class="session-body">
            <SessionStage
                {activeQuiz}
                {userRole}
                participants={sessionData.participants}
                {quizResponses}
                onQuizAnswered={(correct) => {}}
                {pendingExample}
                {sharedExample}
                onShareExample={handleShareExample}
                onDiscardExample={() => (pendingExample = null)}
                onSaveToRepo={handleSaveToRepo}
                onClearExample={handleClearSharedExample}
                {pendingExampleStreaming}
            />

            {#if activePanel}
                <button
                    class="panel-backdrop"
                    aria-label="Cerrar panel"
                    onclick={() => (activePanel = null)}
                    transition:fade={{ duration: 150 }}
                ></button>

                <aside
                    class="right-panel"
                    transition:fly={{ x: 300, duration: 200 }}
                >
                    <button
                        type="button"
                        class="panel-close"
                        aria-label="Cerrar panel"
                        onclick={() => (activePanel = null)}
                    >
                        <CloseSmall />
                    </button>

                    {#if activePanel === "participants"}
                        <ParticipantsPanel
                            participants={approvedParticipants}
                        />
                    {:else if activePanel === "waitingRoom" && userRole === "teacher"}
                        <WaitingRoomPanel
                            participants={sessionData.participants}
                            waitingCount={sessionData.waiting_count}
                            {studentData}
                            onApprove={handleApprove}
                            onDeny={handleDeny}
                            onSetParticipation={handleSetParticipation}
                            onClearParticipation={handleClearParticipation}
                        />
                    {:else if activePanel === "aiChat" && userRole === "teacher"}
                        <AIChatPanel
                            sessionName={sessionData.name}
                            onLiveExample={(spec, streaming) => {
                                pendingExample = spec;
                                pendingExampleStreaming = streaming;
                            }}
                        />
                    {:else if activePanel === "repository"}
                        <RepositoryPanel
                            courseId={sessionData.course_id}
                            {userRole}
                            onSendExample={(spec) => {
                                pendingExample = spec;
                                pendingExampleStreaming = false;
                            }}
                        />
                    {/if}
                </aside>
            {/if}
        </div>

        <SessionToolbar
            {userRole}
            {activePanel}
            {micEnabled}
            {cameraEnabled}
            {isHandRaised}
            courseId={sessionData.course_id}
            onToggleHand={handleToggleHand}
            waitingCount={sessionData.waiting_count}
            isActive={sessionData.is_active}
            sessionName={sessionData.name}
            onToggleMic={() => (micEnabled = !micEnabled)}
            onToggleCamera={() => (cameraEnabled = !cameraEnabled)}
            onSetPanel={handleSetPanel}
            onLeaveSession={() => (confirmExitOpen = true)}
            onEndSession={() => (confirmExitOpen = true)}
            {participantCount}
            onCreateQuiz={() => (showQuizEditor = true)}
        />
    {/if}

    {#if sessionData}
        <QuizEditorModal
            sessionId={sessionData.id}
            bind:open={showQuizEditor}
        />
    {/if}

    <ConfirmDialog
        bind:open={confirmExitOpen}
        title="Salir"
        onAccept={handleCanonicalExit}
    >
        {#snippet content()}
            {#if userRole === "teacher"}
                Estas seguro que quieres salir? Tambien terminaras la sesion
                para todos los participantes
            {:else}
                Estas seguro que quieres salir?
            {/if}
        {/snippet}
    </ConfirmDialog>

    <AlertDialog
        bind:open={alertOpen}
        title={alertTitle}
        onClose={() => (alertOpen = false)}
    >
        {#snippet content()}
            <p>{alertMsg}</p>
        {/snippet}
    </AlertDialog>

    {#if isDisconnected}
        <div
            class="disconnect-overlay"
            role="alert"
            aria-live="assertive"
            tabindex="-1"
            bind:this={overlayEl}
        >
            <WifiOff size={48} />
            <p class="disconnect-message">
                Llamada desconectada, por favor verifique su internet
            </p>
            <p class="disconnect-message">
                Puede llamar a
                <button
                    type="button"
                    class="copy-value"
                    onclick={() => copyToClipboard(RECONNECT_PHONE, "phone")}
                    aria-label={copiedField === "phone"
                        ? "Número copiado al portapapeles"
                        : `Copiar número ${RECONNECT_PHONE} al portapapeles`}
                >
                    {RECONNECT_PHONE}
                </button>
                {copiedField === "phone" ? "✓ Copiado" : ""} para reconectarse en
                modo limitado usando una llamada tradicional
            </p>
            <p class="disconnect-message">
                Codigo de sesion y usuario:
                <button
                    type="button"
                    class="copy-value"
                    onclick={() => copyToClipboard(SESSION_USER_CODE, "code")}
                    aria-label={copiedField === "code"
                        ? "Código copiado al portapapeles"
                        : `Copiar código ${SESSION_USER_CODE} al portapapeles`}
                >
                    {SESSION_USER_CODE}
                </button>
                {copiedField === "code" ? "✓ Copiado" : ""}
            </p>
            <p class="disconnect-message">
                No comparta este codigo con otros usuarios
            </p>
        </div>
    {/if}
</div>

<style>
    .session-root {
        width: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--background-color-dark);
        color: var(--text-color-light);
        font-family: var(--font-body);
        flex: 1;
        overflow: hidden;
        height: 100%;
        position: relative;
    }

    .notification-container {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1100;
        pointer-events: none;
        max-width: 300px;
    }

    .center-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.6);
    }

    .center-state.error {
        color: var(--error-color);
    }

    .center-state h2 {
        font-family: var(--font-display);
        margin: 0;
    }

    .center-state p {
        margin: 0;
        font-size: 0.9rem;
    }

    .session-body {
        flex: 1;
        display: flex;
        gap: 8px;
        padding: 12px 12px 8px;
        min-height: 0;
    }

    .right-panel {
        width: 268px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
    }

    .panel-close {
        display: none;
    }

    .panel-backdrop {
        display: none;
    }

    .disconnect-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background-color: rgba(0, 0, 0, 0.85);
        color: var(--text-color-light);
        text-align: center;
        padding: 2rem;
    }

    .disconnect-message {
        font-size: 1.1rem;
        font-weight: 500;
        max-width: 24rem;
    }

    .copy-value {
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        font-weight: 700;
        text-decoration: underline dotted;
        cursor: pointer;
        padding: 0 0.15rem;
    }
    .copy-value:hover,
    .copy-value:focus-visible {
        text-decoration: underline solid;
    }
    .copy-value:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
    }

    @media (max-width: 770px) {
        .session-body {
            position: relative;
            max-height: 550px;
        }
        .right-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(85vw, 320px);
            z-index: 1200;
            background-color: var(--background-color-dark);
            box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4);
            padding-top: 2.5rem;
        }
        .panel-close {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 8px;
            width: 100%;
            height: 32px;
            background: rgba(255, 255, 255, 0.08);
            border: none;
            color: var(--text-color-light);
            cursor: pointer;
            z-index: 1;
        }
        .panel-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            padding: 0;
            margin: 0;
            z-index: 1150;
            cursor: pointer;
        }
    }
</style>
