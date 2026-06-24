<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { invalidateAll } from "$app/navigation";
    import { auth } from "$lib/api";
    import Sidebar from "./Sidebar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    interface ProfileItem {
        key: string;
        label: string;
        href: string;
    }

    let {
        username,
        userId,
    }: {
        username: string;
        userId?: string;
    } = $props();

    const items: ProfileItem[] = [
        {
            key: "password",
            label: "Cambiar contraseña",
            href: "/profile/cambiar-contrasena",
        },
        {
            key: "sessions",
            label: "Sesiones activas",
            href: "/profile/sesiones-activas",
        },
        { key: "edit", label: "Editar perfil", href: "/profile/editar-perfil" },
        { key: "security", label: "Seguridad", href: "/profile/seguridad" },
    ];

    let loggingOut = $state(false);

    async function handleLogout() {
        if (loggingOut) return;
        loggingOut = true;
        try {
            await auth.logout();
            await invalidateAll();
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            loggingOut = false;
            goto("/");
        }
    }
</script>

<Sidebar
    {items}
    itemKey={(item) => item.key}
    itemLabel={(item) => item.label}
    isActive={(item) => page.url.pathname.startsWith(item.href)}
    onItemClick={(item) => goto(item.href)}
>
    {#snippet header()}
        <div class="profile-header">
            <span class="username">{username}</span>
        </div>
    {/snippet}
    {#snippet footer()}
        <VariantButton
            variant="secondary-light"
            onclick={handleLogout}
            disabled={loggingOut}
        >
            {#if loggingOut}
                <WaveLoader size={21}></WaveLoader>
            {:else}
                Cerrar sesión
            {/if}
        </VariantButton>
    {/snippet}
</Sidebar>

<style>
    .profile-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .username {
        color: var(--primary-color);
        font-size: 1.1rem;
        font-weight: bold;
        line-height: 1.2;
        word-break: break-word;
    }
</style>
