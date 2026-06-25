<script lang="ts">
    import { Robot, Send } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { type ExampleSpec } from "$lib/generation/sharedTypes";
    import { tryParseExampleSpec } from "$lib/generation/utils";

    interface Props {
        sessionName: string;
        onShareExample?: (example: ExampleSpec) => void;
    }
    const { sessionName, onShareExample }: Props = $props();

    interface Msg {
        role: "user" | "assistant";
        content: string;
        id: number;
        hasExample?: boolean;
        isError?: boolean;
    }

    type ApiMsg = { role: "user" | "assistant"; content: string };

    const MAX_AUTO_RETRIES = 2;
    const RETRY_DELAY_MS = 2_500;

    let messages = $state<Msg[]>([]);
    let draft = $state("");
    let loading = $state(false);
    let retryAttempt = $state(0);
    let uid = $state(0);
    let boxEl: HTMLElement | undefined;
    let outgoingMsgs = $state<ApiMsg[] | null>(null);

    function sleep(ms: number) {
        return new Promise<void>((r) => setTimeout(r, ms));
    }

    async function send() {
        const text = draft.trim();
        if (!text || loading) return;

        messages = [...messages, { role: "user", content: text, id: uid++ }];
        draft = "";

        const snapshot: ApiMsg[] = messages.map(({ role, content }) => ({
            role,
            content,
        }));
        outgoingMsgs = snapshot;
        loading = true;
        retryAttempt = 0;
        scrollDown();

        await doRequest(snapshot, 0);

        loading = false;
        scrollDown();
    }

    async function retryManual() {
        if (!outgoingMsgs || loading) return;
        messages = messages.filter((m) => !m.isError);
        loading = true;
        retryAttempt = 0;
        scrollDown();
        await doRequest(outgoingMsgs, 0);
        loading = false;
        scrollDown();
    }

    async function doRequest(apiMessages: ApiMsg[], attempt: number) {
        try {
            const res = await fetch("/api/gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMessages,
                    sessionContext: sessionName,
                }),
            });

            if (res.status === 504 && attempt < MAX_AUTO_RETRIES) {
                retryAttempt = attempt + 1;
                await sleep(RETRY_DELAY_MS);
                return doRequest(apiMessages, attempt + 1);
            }

            if (!res.ok) {
                const errData = (await res.json().catch(() => ({}))) as Record<
                    string,
                    string
                >;
                pushError(
                    res.status === 504
                        ? "timeout"
                        : (errData.error ?? "unknown"),
                );
                return;
            }

            const { message } = (await res.json()) as { message: string };
            const parsed = tryParseExampleSpec(message);

            if (parsed) onShareExample?.(parsed);

            messages = [
                ...messages,
                {
                    role: "assistant",
                    content: message,
                    id: uid++,
                    hasExample: !!parsed,
                },
            ];
        } catch {
            if (attempt < MAX_AUTO_RETRIES) {
                retryAttempt = attempt + 1;
                await sleep(RETRY_DELAY_MS);
                return doRequest(apiMessages, attempt + 1);
            }
            pushError("network");
        }
    }

    function pushError(type: string) {
        const label: Record<string, string> = {
            timeout: "La solicitud tardó demasiado.",
            network: "Error de red al conectar.",
            upstream_error: "El modelo no respondió correctamente.",
        };
        messages = [
            ...messages,
            {
                role: "assistant",
                content: label[type] ?? "Ocurrió un error inesperado.",
                id: uid++,
                isError: true,
            },
        ];
    }

    function scrollDown() {
        setTimeout(() => {
            if (boxEl) boxEl.scrollTop = boxEl.scrollHeight;
        }, 40);
    }

    function onKey(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }
</script>

<div class="panel">
    <div class="header">
        <div class="ai-orb"><Robot /></div>
        <div>
            <p class="title">Asistente IA</p>
            <p class="sub" title={sessionName}>{sessionName}</p>
        </div>
    </div>

    <div class="msgs" bind:this={boxEl}>
        {#if messages.length === 0}
            <div class="welcome">
                Hola 👋 Soy tu asistente para esta sesión. Puedo ayudarte con
                preguntas del tema, crear ejemplos interactivos, y mucho más.
            </div>
        {/if}

        {#each messages as m (m.id)}
            {#if m.role === "assistant" && m.hasExample}
                <div class="bubble bot example-sent">
                    <span class="example-sent-icon">✦</span>
                    Ejemplo enviado al escenario principal
                </div>
            {:else if m.role === "assistant" && m.isError}
                <div class="bubble bot error">
                    <span>⚠ {m.content}</span>
                    <button class="retry-btn" onclick={retryManual}>
                        Reintentar
                    </button>
                </div>
            {:else}
                <div
                    class="bubble"
                    class:user={m.role === "user"}
                    class:bot={m.role === "assistant"}
                >
                    {m.content}
                </div>
            {/if}
        {/each}

        {#if loading}
            <div class="bubble bot typing">
                {#if retryAttempt > 0}
                    <span class="retry-label">
                        Reintentando {retryAttempt}/{MAX_AUTO_RETRIES}…
                    </span>
                {:else}
                    <span></span><span></span><span></span>
                {/if}
            </div>
        {/if}
    </div>

    <div class="input-row">
        <textarea
            bind:value={draft}
            onkeydown={onKey}
            placeholder="Pregunta algo o pide un ejemplo interactivo…"
            rows={2}
            disabled={loading}></textarea>
        <VariantButton
            onclick={send}
            disabled={loading || !draft.trim()}
            aria-label="Enviar"
        >
            <Send />
        </VariantButton>
    </div>
</div>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--background-color-dark);
        border-radius: var(--radius);
        overflow: hidden;
        border: 1px solid var(--border-color);
    }

    .header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 14px;
        border-bottom: 1px solid var(--white);
        flex-shrink: 0;
        background-color: var(--primary-color);
    }

    .ai-orb {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(
            135deg,
            var(--primary-color),
            var(--secondary-color)
        );
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        color: white;
        flex-shrink: 0;
        border: 1px solid white;
    }

    .title {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--white);
        margin: 0;
    }

    .sub {
        font-size: 0.7rem;
        color: var(--white);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 170px;
    }

    .msgs {
        flex: 1;
        overflow-y: auto;
        padding: 11px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: var(--white) transparent;
    }

    .welcome {
        background-color: var(--primary-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 11px 12px;
        font-size: 0.81rem;
        color: var(--white);
        line-height: 1.55;
    }

    .bubble {
        padding: 8px 11px;
        border-radius: var(--radius);
        font-size: 0.81rem;
        line-height: 1.55;
        max-width: 90%;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .bubble.user {
        background-color: var(--primary-color);
        color: var(--white);
        align-self: flex-end;
    }

    .bubble.bot {
        background-color: var(--primary-container-color);
        color: var(--text-color);
        align-self: flex-start;
    }

    .bubble.example-sent {
        display: flex;
        align-items: center;
        gap: 7px;
        background-color: var(--secondary-container-color);
        color: var(--secondary-color);
        font-weight: 600;
        font-size: 0.78rem;
        align-self: flex-start;
        max-width: 90%;
    }

    .example-sent-icon {
        font-size: 0.9rem;
        flex-shrink: 0;
    }

    .bubble.error {
        background-color: var(--error-container-color);
        color: var(--error-color);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-self: flex-start;
        max-width: 90%;
    }

    .retry-btn {
        align-self: flex-start;
        padding: 4px 12px;
        border-radius: var(--radius);
        border: 1px solid var(--error-color);
        background: transparent;
        color: var(--error-color);
        font-family: var(--font-body);
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.12s;
    }
    .retry-btn:hover {
        background-color: var(--error-color);
        color: var(--white);
    }

    .bubble.typing {
        display: flex;
        gap: 5px;
        align-items: center;
        padding: 13px 14px;
        min-height: 42px;
    }

    .bubble.typing span:not(.retry-label) {
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--text-color);
        animation: dot 1.3s infinite;
    }
    .bubble.typing span:nth-child(2) {
        animation-delay: 0.22s;
    }
    .bubble.typing span:nth-child(3) {
        animation-delay: 0.44s;
    }

    .retry-label {
        font-size: 0.76rem;
        color: var(--primary-color);
        font-style: italic;
    }

    @keyframes dot {
        0%,
        80%,
        100% {
            transform: scale(0.65);
            opacity: 0.42;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    /* ── Input ── */
    .input-row {
        display: flex;
        gap: 8px;
        padding: 9px 11px;
        border-top: 1px solid var(--border-color);
        flex-shrink: 0;
        align-items: center;
    }

    .input-row textarea {
        flex: 1;
        background-color: var(--primary-container-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        color: var(--text-color);
        padding: 8px 10px;
        font-family: var(--font-body);
        font-size: 0.81rem;
        resize: none;
        outline: none;
        line-height: 1.45;
        transition: border-color 0.13s;
    }
    .input-row textarea::placeholder {
        color: var(--primary-color);
    }
    .input-row textarea:focus {
        border-color: var(--primary-color);
    }
</style>
