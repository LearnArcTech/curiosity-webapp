<script lang="ts">
    import { Error } from "@material-symbols-svg/svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import type { Snippet } from "svelte";

    let {
        loading,
        error = "",
        loadingMessage = "Cargando...",
        errorFallback = "Algo salió mal!",
        onRetry,
        children,
    }: {
        loading: boolean;
        error?: string;
        loadingMessage?: string;
        errorFallback?: string;
        onRetry?: () => void;
        children: Snippet;
    } = $props();
</script>

{#if loading}
    <div class="status-container loading-state">
        <WaveLoader size={24} />
        <p>{loadingMessage}</p>
    </div>
{:else if error}
    <div class="status-container error-state">
        <Error size={100} color="#ba1a1a" />
        <p class="error-text">
            {error.trim() === "" ? errorFallback : error}
        </p>
        <VariantButton onclick={onRetry ?? (() => window.location.reload())}>
            Reintentar
        </VariantButton>
    </div>
{:else}
    <div class="content-enter">
        {@render children()}
    </div>
{/if}

<style>
    .status-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-height: 0;
        text-align: center;
        color: var(--text-color);
        font-size: calc(2rem * var(--font-scale));
    }

    .loading-state p {
        margin-top: 12px;
        color: var(--text-color);
    }

    .error-state {
        border-color: var(--border-color);
        background-color: var(--error-container-color);
    }

    .error-text {
        color: var(--error-color);
        font-weight: 500;
        margin: 0 0 16px 0;
    }

    .content-enter {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        animation: scale-up-fade-in var(--motion-duration, 220ms) ease-out;
        transform-origin: center;
    }

    @keyframes scale-up-fade-in {
        from {
            opacity: 0;
            transform: scale(0.96);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .content-enter {
            animation: none;
        }
    }
</style>
