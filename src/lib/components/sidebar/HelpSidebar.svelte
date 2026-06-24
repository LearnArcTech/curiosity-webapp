<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import Sidebar from "./Sidebar.svelte";

    interface HelpItem {
        key: string;
        label: string;
        href: string;
        authOnly?: boolean;
    }

    let {
        isAuthenticated = false,
    }: {
        isAuthenticated?: boolean;
    } = $props();

    const allItems: HelpItem[] = [
        {
            key: "onboarding",
            label: "Onboarding",
            href: "/help/onboarding",
            authOnly: true,
        },
        {
            key: "modo-simplificado",
            label: "Modo Simplificado",
            href: "/help/modo-simplificado",
        },
        {
            key: "accesibilidad",
            label: "Accesibilidad",
            href: "/help/accesibilidad",
        },
        {
            key: "guias-y-tutoriales",
            label: "Guías y tutoriales",
            href: "/help/guias-y-tutoriales",
        },
    ];

    const items = $derived(
        allItems.filter((item) => !item.authOnly || isAuthenticated),
    );
</script>

<Sidebar
    {items}
    itemKey={(item) => item.key}
    itemLabel={(item) => item.label}
    isActive={(item) => page.url.pathname.startsWith(item.href)}
    onItemClick={(item) => goto(item.href)}
>
    {#snippet header()}
        <h1 class="sidebar-title">Ayuda</h1>
    {/snippet}
</Sidebar>

<style>
    .sidebar-title {
        color: var(--primary-color);
        font-size: 1.5rem;
        font-weight: bold;
    }
</style>
