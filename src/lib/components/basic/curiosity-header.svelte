<script lang="ts">
    import { slide } from "svelte/transition";
    import { goto } from "$app/navigation";
    import Avatar from "$lib/components/basic/avatar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    const { isAuthenticated = false, username = "" } = $props();

    let mobileMenuOpen = $state(false);

    function toggleMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMenu() {
        mobileMenuOpen = false;
    }
</script>

<header class="header">
    <div class="nav-wrapper">
        <!-- svelte-ignore a11y_missing_attribute -->
        <a class="logo" href="https://curiosity-learnarc.netlify.app/"
            >Curiosity</a
        >
        <nav class="nav-links">
            {#if isAuthenticated}
                <a href="/help">Ayuda</a>
                <a href="/courses">Cursos</a>
            {/if}
        </nav>
    </div>

    <div class="user-area">
        {#if isAuthenticated}
            <span class="username">{username}</span>
            <a href="/profile" class="user-icon">
                <Avatar size={30}></Avatar>
            </a>
        {:else}
            <VariantButton
                onclick={() => {
                    goto("/");
                }}>Ingresar</VariantButton
            >
        {/if}
        <!-- svelte-ignore a11y_missing_attribute -->
        <button
            class="hamburger"
            onclick={toggleMenu}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
        >
            {mobileMenuOpen ? "✕" : "☰"}
        </button>
    </div>
</header>

{#if mobileMenuOpen}
    <div class="mobile-menu" transition:slide={{ duration: 250 }}>
        {#if isAuthenticated}
            <span class="mobile-username">{username}</span>
            <hr class="mobile-divider" />
        {/if}
        <nav class="mobile-nav">
            <a href="/help" onclick={closeMenu}>Ayuda</a>
            {#if isAuthenticated}
                <a href="/courses" onclick={closeMenu}>Cursos</a>
            {/if}
            <a href="/profile" onclick={closeMenu}>Perfil</a>
        </nav>
    </div>
{/if}

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background-color: var(--header-background-color);
        border-bottom: 1px solid var(--border-color);
        user-select: none;
    }

    .nav-wrapper {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
    }

    .nav-links {
        display: flex;
        gap: 1rem;
        color: var(--text-color);
        font-weight: 500;
    }

    .user-area {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .user-icon {
        display: flex;
        align-items: center;
        color: var(--text-color);
        background-color: transparent;
    }

    .username {
        font-family: var(--font-body);
        font-size: 1rem;
        font-weight: bold;
        color: var(--text-color);
    }

    .hamburger {
        display: none;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
        padding: 0.25rem;
        line-height: 1;
    }

    .mobile-menu {
        display: none;
        background-color: var(--header-background-color);
        border-bottom: 1px solid var(--border-color);
        padding: 1.5rem 2rem;
    }

    .mobile-nav {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .mobile-nav a {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--text-color);
        text-decoration: none;
    }

    .mobile-username {
        display: block;
        font-size: 1rem;
        font-weight: bold;
        color: var(--text-color);
        margin-bottom: 1rem;
    }

    .mobile-divider {
        border: none;
        border-top: 1px solid var(--border-color);
        margin-bottom: 1.25rem;
    }

    @media (max-width: 768px) {
        .hamburger {
            display: block;
        }

        .nav-links {
            display: none;
        }

        .user-icon {
            display: none;
        }

        .username {
            display: none;
        }

        .mobile-menu {
            display: block;
        }
    }
</style>
