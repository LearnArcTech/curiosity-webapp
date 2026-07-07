<script lang="ts">
    import { slide } from "svelte/transition";
    import { goto } from "$app/navigation";
    import Avatar from "$lib/components/basic/avatar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    const { isAuthenticated = false, username = "" } = $props();

    let mobileMenuOpen = $state(false);
    let darkMode = $state(false);

    function applyTheme(isDark: boolean) {
        document.documentElement.dataset.theme = isDark ? "dark" : "light";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    function toggleTheme() {
        darkMode = !darkMode;
        applyTheme(darkMode);
    }

    function toggleMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMenu() {
        mobileMenuOpen = false;
    }

    $effect(() => {
        const savedTheme = localStorage.getItem("theme");
        darkMode =
            savedTheme === "dark" ||
            (!savedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        applyTheme(darkMode);
    });
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
        <button
            class="theme-toggle"
            type="button"
            onclick={toggleTheme}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
        >
            <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
        </button>
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
        padding: 0.9rem 1.6rem;
        background: var(--header-surface);
        border-bottom: 1px solid var(--soft-border-color);
        box-shadow: 0 12px 36px rgba(21, 39, 53, 0.06);
        backdrop-filter: blur(16px);
        user-select: none;
        z-index: 50;
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
        letter-spacing: 0;
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

    .theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.85rem;
        height: 2.85rem;
        min-width: 2.85rem;
        padding: 0;
        border: 1px solid var(--soft-border-color);
        border-radius: 14px;
        background: var(--panel-surface);
        color: var(--primary-color);
        font-size: 1.15rem;
        font-weight: 800;
        box-shadow: 0 10px 24px rgba(19, 40, 56, 0.08);
        transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
    }

    .theme-toggle:hover {
        border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
        transform: translateY(-1px);
    }

    .mobile-menu {
        display: none;
        background: var(--header-surface);
        border-bottom: 1px solid var(--soft-border-color);
        padding: 1.5rem 2rem;
        backdrop-filter: blur(16px);
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
