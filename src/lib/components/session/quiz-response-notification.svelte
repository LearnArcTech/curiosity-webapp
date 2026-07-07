<script lang="ts">
    interface Props {
        username: string;
        isCorrect: boolean;
        answer: string;
        onDismiss: () => void;
    }
    const { username, isCorrect, answer, onDismiss }: Props = $props();
</script>

<div class="notif" class:correct={isCorrect} role="status">
    <span class="icon" aria-hidden="true">{isCorrect ? "✓" : "✗"}</span>
    <div class="body">
        <span class="name">{username}</span>
        <span class="result"
            >{isCorrect
                ? "respondió correctamente"
                : "respondió incorrectamente"}</span
        >
        <span class="answer">Respuesta: {answer}</span>
    </div>
    <button
        class="dismiss"
        type="button"
        onclick={onDismiss}
        aria-label="Cerrar"
    >
        ×
    </button>
</div>

<style>
    .notif {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        background: var(--error-color);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        padding: 0.625rem 0.75rem;
        pointer-events: all;
        min-width: 230px;
        max-width: 290px;
        animation: slide-in var(--motion-duration) ease;
    }
    @media (prefers-reduced-motion: reduce) {
        .notif {
            animation: none;
        }
    }
    .notif.correct {
        background: var(--secondary-color);
    }
    .icon {
        font-weight: 700;
        font-size: calc(0.85rem * var(--font-scale));
        color: var(--text-color-light);
        flex-shrink: 0;
        margin-top: 0.125rem;
    }
    .body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
    }
    .name {
        font-size: calc(0.8rem * var(--font-scale));
        font-weight: 700;
        color: var(--text-color-light);
    }
    .result {
        font-size: calc(0.74rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.82;
    }
    .answer {
        font-size: calc(0.72rem * var(--font-scale));
        color: var(--text-color-light);
        opacity: 0.62;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: normal;
    }
    .dismiss {
        background: none;
        border: none;
        color: var(--text-color-light);
        opacity: 0.5;
        font-size: calc(1rem * var(--font-scale));
        cursor: pointer;
        padding: 0 0.125rem;
        flex-shrink: 0;
        line-height: 1;
        transition: opacity var(--motion-duration);
    }
    .dismiss:hover {
        opacity: 1;
    }
    .dismiss:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
        opacity: 1;
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
