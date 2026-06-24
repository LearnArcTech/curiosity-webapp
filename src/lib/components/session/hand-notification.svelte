<script lang="ts">
    interface Props {
        username: string;
        onDismiss: () => void;
    }

    const { username, onDismiss }: Props = $props();

    $effect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    });
</script>

<div class="toast-notification">
    <div class="hand-icon">✋</div>
    <div class="content">
        <span class="user">@{username}</span> ha levantado la mano.
    </div>
    <button onclick={onDismiss} class="close-btn" title="Cerrar">&times;</button
    >
</div>

<style>
    .toast-notification {
        background-color: var(--primary-color);
        color: white;
        padding: 10px 14px;
        border-radius: var(--radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-body);
        font-size: 0.82rem;
        pointer-events: auto; /* Permite interactuar dentro del contenedor */
        animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        border-left: 4px solid var(--secondary-color);
    }

    .hand-icon {
        font-size: 1.1rem;
        animation: wave 0.5s ease-in-out infinite alternate;
    }

    .content .user {
        font-weight: 700;
        color: #fff;
    }

    .close-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        margin-left: auto;
        transition: color 0.1s;
    }

    .close-btn:hover {
        color: white;
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
