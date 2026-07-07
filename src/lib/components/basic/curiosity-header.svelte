<script lang="ts">
    import { slide } from "svelte/transition";
    import { goto } from "$app/navigation";
    import { Close, Menu } from "@material-symbols-svg/svelte";
    import Avatar from "$lib/components/basic/avatar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

    const { isAuthenticated = false, username = "" } = $props();

    let mobileMenuOpen = $state(false);

    const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const menuTransitionDuration = reduceMotion ? 0 : 250;

    function toggleMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMenu() {
        mobileMenuOpen = false;
    }
</script>

<header class="header">
    <div class="nav-wrapper">
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
            <span class="desktop-only-btn">
                <VariantButton
                    onclick={() => {
                        goto("/");
                    }}>Ingresar</VariantButton
                >
            </span>
        {/if}
        <button
            class="hamburger"
            onclick={toggleMenu}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
        >
            {#if mobileMenuOpen}
                <Close />
            {:else}
                <Menu />
            {/if}
        </button>
    </div>
</header>

{#if mobileMenuOpen}
    <div
        class="mobile-menu"
        transition:slide={{ duration: menuTransitionDuration }}
    >
        <p class="mobile-menu-title">Menú Principal</p>

        {#if isAuthenticated}
            <div class="mobile-user-block">
                <button
                    type="button"
                    onclick={() => {
                        goto("/profile");
                        closeMenu();
                    }}
                    class="mobile-user-icon"
                    aria-label="Ir a mi perfil"
                >
                    <Avatar size={30}></Avatar>
                </button>
                <span class="mobile-username">{username}</span>
            </div>
            <hr class="mobile-divider" />
        {/if}

        <nav class="mobile-nav">
            {#if isAuthenticated}
                <VariantButton
                    onclick={() => {
                        goto("/help");
                        closeMenu();
                    }}
                >
                    Ayuda
                </VariantButton>
                <VariantButton
                    onclick={() => {
                        goto("/courses");
                        closeMenu();
                    }}
                >
                    Cursos
                </VariantButton>
                <VariantButton
                    onclick={() => {
                        goto("/profile");
                        closeMenu();
                    }}
                >
                    Perfil
                </VariantButton>
            {:else}
                <VariantButton
                    onclick={() => {
                        goto("/");
                        closeMenu();
                    }}
                >
                    Ingresar
                </VariantButton>
            {/if}
        </nav>
    </div>
{/if}

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background-color: var(--white);
        border-bottom: var(--border-width) solid var(--border-color);
        user-select: none;
        z-index: 100;
        position: sticky;
        top: 0;
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
    .logo:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }

    .nav-links {
        display: flex;
        gap: 1rem;
        color: var(--text-color);
        font-weight: 500;
    }
    .nav-links a:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
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
    .user-icon:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
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
    }

    .mobile-menu-title {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 1.5rem;
    }

    .mobile-nav {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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
        border-top: var(--border-width) solid var(--border-color);
        margin-bottom: 1.25rem;
    }

    .mobile-user-icon {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
    }

    @media (max-width: 768px) {
        .header {
            padding: 0.5rem 1.25rem;
            z-index: 999;
        }

        .logo {
            font-size: 1.25rem;
        }

        .hamburger {
            display: block;
        }

        .nav-links,
        .user-icon,
        .username,
        .desktop-only-btn {
            display: none;
        }

        .mobile-menu {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 99;
            background-color: var(--white);
            padding: 5rem 2rem 2rem;
            overflow-y: auto;
        }

        .mobile-nav :global(button),
        .mobile-nav :global(a) {
            width: 100%;
            justify-content: center;
            font-size: 1.1rem;
            padding: 1rem;
        }
    }

    .mobile-user-block {
        display: flex;
        gap: 20px;
    }
</style>
