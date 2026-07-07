<script lang="ts">
    interface Props {
        username: string;
        onDismiss: () => void;
    }
    const { username, onDismiss }: Props = $props();
    let paused = $state(false);

    $effect(() => {
        if (paused) return;
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    });
</script>

<div
    class="toast-notification"
    role="status"
    onmouseenter={() => (paused = true)}
    onmouseleave={() => (paused = false)}
    onfocusin={() => (paused = true)}
    onfocusout={() => (paused = false)}
>
    <div class="hand-icon" aria-hidden="true">✋</div>
    <div class="content">
        <span class="user">@{username}</span> ha levantado la mano.
    </div>
    <button
        onclick={onDismiss}
        class="close-btn"
        type="button"
        aria-label="Cerrar"
    >
        &times;
    </button>
</div>

<style>
    .toast-notification {
        background-color: var(--primary-color);
        color: var(--text-color-light);
        padding: 0.625rem 0.875rem;
        border-radius: var(--radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-family: var(--font-body);
        font-size: calc(0.82rem * var(--font-scale));
        pointer-events: auto;
        animation: slideIn var(--motion-duration) cubic-bezier(0.16, 1, 0.3, 1);
        border-left: 4px solid var(--secondary-color);
    }
    .hand-icon {
        font-size: calc(1.1rem * var(--font-scale));
        animation: wave 0.5s ease-in-out infinite alternate;
    }
    @media (prefers-reduced-motion: reduce) {
        .hand-icon {
            animation: none;
        }
    }
    .content .user {
        font-weight: 700;
        color: var(--text-color-light);
    }
    .close-btn {
        background: none;
        border: none;
        color: var(--text-color-light);
        opacity: 0.6;
        font-size: calc(1.2rem * var(--font-scale));
        cursor: pointer;
        padding: 0 0.25rem;
        line-height: 1;
        margin-left: auto;
        transition: opacity var(--motion-duration);
    }
    .close-btn:hover {
        opacity: 1;
    }
    .close-btn:focus-visible {
        outline: var(--border-width) solid var(--text-color-light);
        outline-offset: 2px;
        opacity: 1;
    }
    @keyframes slideIn {
        from {
            transform: translateX(100%) translateY(10px);
            opacity: 0;
        }
        to {
            transform: translateX(0) translateY(0);
            opacity: 1;
        }
    }
    @keyframes wave {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(15deg);
        }
    }
</style>
