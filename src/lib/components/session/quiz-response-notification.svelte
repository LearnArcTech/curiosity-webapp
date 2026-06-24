<script lang="ts">
    interface Props {
        username: string;
        isCorrect: boolean;
        answer: string;
        onDismiss: () => void;
    }

    const { username, isCorrect, answer, onDismiss }: Props = $props();
</script>

<div class="notif" class:correct={isCorrect}>
    <span class="icon">{isCorrect ? "✓" : "✗"}</span>
    <div class="body">
        <span class="name">{username}</span>
        <span class="result"
            >{isCorrect
                ? "respondió correctamente"
                : "respondió incorrectamente"}</span
        >
        <span class="answer" title={answer}>Respuesta: {answer}</span>
    </div>
    <button class="dismiss" onclick={onDismiss}>×</button>
</div>

<style>
    .notif {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        background: var(--error-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 10px 12px;
        pointer-events: all;
        min-width: 230px;
        max-width: 290px;
        animation: slide-in 0.2s ease;
    }

    .notif.correct {
        background: var(--secondary-color);
    }

    .icon {
        font-weight: 700;
        font-size: 0.85rem;
        color: white;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .name {
        font-size: 0.8rem;
        font-weight: 700;
        color: white;
    }

    .result {
        font-size: 0.74rem;
        color: rgba(255, 255, 255, 0.82);
    }

    .answer {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.62);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dismiss {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1rem;
        cursor: pointer;
        padding: 0 2px;
        flex-shrink: 0;
        line-height: 1;
    }
    .dismiss:hover {
        color: white;
    }

    @keyframes slide-in {
        from {
            opacity: 0;
            transform: translateX(8px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
