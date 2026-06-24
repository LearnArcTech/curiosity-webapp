<script lang="ts">
    import { Robot, Send } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    interface Props {
        sessionName: string;
    }
    const { sessionName }: Props = $props();

    interface Msg {
        role: "user" | "assistant";
        content: string;
        id: number;
    }

    let messages = $state<Msg[]>([]);
    let draft = $state("");
    let loading = $state(false);
    let uid = $state(0);
    let boxEl: HTMLElement | undefined;

    async function send() {
        const text = draft.trim();
        if (!text || loading) return;

        messages = [...messages, { role: "user", content: text, id: uid++ }];
        draft = "";
        loading = true;
        tick();

        try {
            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages.map(({ role, content }) => ({
                        role,
                        content,
                    })),
                    sessionContext: sessionName,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { message } = await res.json();
            messages = [
                ...messages,
                { role: "assistant", content: message, id: uid++ },
            ];
        } catch {
            messages = [
                ...messages,
                {
                    role: "assistant",
                    content: "Error al conectar con el asistente.",
                    id: uid++,
                },
            ];
        } finally {
            loading = false;
            tick();
        }
    }

    function tick() {
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
                preguntas del tema, crear actividades, y mucho más.
            </div>
        {/if}

        {#each messages as m (m.id)}
            <div
                class="bubble"
                class:user={m.role === "user"}
                class:bot={m.role === "assistant"}
            >
                {m.content}
            </div>
        {/each}

        {#if loading}
            <div class="bubble bot typing">
                <span></span><span></span><span></span>
            </div>
        {/if}
    </div>

    <div class="input-row">
        <textarea
            bind:value={draft}
            onkeydown={onKey}
            placeholder="Pregunta algo sobre la sesión…"
            rows={2}
            disabled={loading}></textarea>
        <VariantButton
            onclick={send}
            disabled={loading || !draft.trim()}
            aria-label="Enviar"><Send /></VariantButton
        >
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

    .bubble.typing {
        display: flex;
        gap: 5px;
        align-items: center;
        padding: 13px 14px;
    }

    .bubble.typing span {
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--white);
        animation: dot 1.3s infinite;
    }
    .bubble.typing span:nth-child(2) {
        animation-delay: 0.22s;
    }
    .bubble.typing span:nth-child(3) {
        animation-delay: 0.44s;
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
