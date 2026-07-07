<script lang="ts" generics="T extends Record<string, any>">
    import type { Snippet } from "svelte";
    import Sidebar from "$lib/components/basic/sidebar.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { goto } from "$app/navigation";
    import { animate } from "animejs";
    import { ContentCopy } from "@material-symbols-svg/svelte";

    type Role = "teacher" | "student";

    interface SubNavItem {
        key: string;
        label: string;
        roles: Role[];
    }

    interface NavGroup {
        key: string;
        label: string;
        subs: SubNavItem[];
    }

    interface Props {
        courseName: string;
        role: Role;
        section?: string;
        subsection?: string;
        subHref: (sectionKey: string, subKey: string) => string;
        settingsHref: string;
        courseId?: string;
    }

    let {
        courseName,
        role,
        section,
        subsection,
        subHref,
        settingsHref,
        courseId,
    }: Props = $props();

    const GROUPS: NavGroup[] = [
        {
            key: "progreso",
            label: "Progreso",
            subs: [
                {
                    key: "resumen",
                    label: "Resumen",
                    roles: ["teacher", "student"],
                },
                {
                    key: "ranking-quizzes",
                    label: "Ranking de quizes",
                    roles: ["teacher"],
                },
                {
                    key: "participacion",
                    label: "Participacion",
                    roles: ["teacher"],
                },
                { key: "reportes", label: "Reportes", roles: ["teacher"] },
                { key: "logros", label: "Logros", roles: ["student"] },
                {
                    key: "ranking-quizzes",
                    label: "Rankings",
                    roles: ["student"],
                },
                {
                    key: "participacion",
                    label: "Calificaciones",
                    roles: ["student"],
                },
            ],
        },
        {
            key: "sesiones",
            label: "Sesiones",
            subs: [
                {
                    key: "crear-sesion",
                    label: "Crear sesion",
                    roles: ["teacher"],
                },
                {
                    key: "historial",
                    label: "Historial de sesiones",
                    roles: ["teacher", "student"],
                },
            ],
        },
        {
            key: "repositorio",
            label: "Repositorio",
            subs: [
                {
                    key: "busqueda-archivos",
                    label: "Busqueda de archivos",
                    roles: ["teacher", "student"],
                },
                {
                    key: "administrador-descargas",
                    label: "Administrador de descargas",
                    roles: ["teacher", "student"],
                },
            ],
        },
    ];

    let override = $state<string | null | undefined>(undefined);

    const expandedSection = $derived(
        override !== undefined ? override : section,
    );

    function toggleSection(key: string) {
        override = expandedSection === key ? null : key;
    }

    $effect(() => {
        section;
        override = undefined;
    });

    let copyStatus = $state<"idle" | "copied">("idle");
    let copyTimeout: ReturnType<typeof setTimeout>;

    function handleCopyID() {
        if (!courseId || !navigator) return;
        navigator.clipboard.writeText(courseId);
        copyStatus = "copied";
        clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => (copyStatus = "idle"), 2000);
    }

    function collapse(node: HTMLElement, expanded: boolean) {
        let isExpanded = expanded;
        let current: ReturnType<typeof animate> | undefined;

        node.style.overflow = "hidden";
        node.style.height = isExpanded ? "auto" : "0px";
        node.toggleAttribute("inert", !isExpanded);
        node.toggleAttribute("aria-hidden", !isExpanded);

        const duration = () =>
            parseFloat(
                getComputedStyle(node).getPropertyValue("--motion-duration"),
            ) * 1000 || 0;

        return {
            update(nextExpanded: boolean) {
                if (nextExpanded === isExpanded) return;
                isExpanded = nextExpanded;
                current?.pause();
                const d = duration();

                if (nextExpanded) {
                    node.toggleAttribute("inert", false);
                    node.removeAttribute("aria-hidden");
                    const target = node.scrollHeight;
                    node.style.height = "0px";
                    current = animate(node, {
                        height: [0, target],
                        duration: d,
                        ease: "inOutExpo",
                        onComplete: () => {
                            node.style.height = "auto";
                        },
                    });
                } else {
                    const start = node.scrollHeight;
                    node.style.height = `${start}px`;
                    current = animate(node, {
                        height: [start, 0],
                        duration: d,
                        ease: "inOutExpo",
                        onComplete: () => {
                            node.toggleAttribute("inert", true);
                            node.setAttribute("aria-hidden", "true");
                        },
                    });
                }
            },
            destroy() {
                current?.pause();
            },
        };
    }
</script>

<Sidebar background="var(--secondary-container-color)" breakpoint="950px">
    {#snippet header()}
        <h1 id="course-nav-title" class="sidebar-title">{courseName}</h1>
    {/snippet}
    {#snippet children()}
        {#each GROUPS as group (group.key)}
            {@const visibleSubs = group.subs.filter((s) =>
                s.roles.includes(role),
            )}
            <VariantButton
                variant="secondary-dark"
                aria-expanded={expandedSection === group.key}
                aria-controls="subnav-{group.key}"
                onclick={() => toggleSection(group.key)}
            >
                {group.label}
            </VariantButton>

            <div
                id="subnav-{group.key}"
                class="subnav-group"
                class:is-collapsed={expandedSection !== group.key}
                use:collapse={expandedSection === group.key}
            >
                {#each visibleSubs as sub (sub.key)}
                    <VariantButton
                        variant="secondary-light"
                        aria-current={section === group.key &&
                        subsection === sub.key
                            ? "page"
                            : undefined}
                        onclick={() => goto(subHref(group.key, sub.key))}
                    >
                        {sub.label}
                    </VariantButton>
                {/each}
            </div>
        {/each}
    {/snippet}
    {#snippet footer()}
        {#if role === "teacher"}
            <VariantButton variant="secondary-light" onclick={handleCopyID}>
                {copyStatus === "copied" ? "ID copiado" : "Copy course ID"}
                <ContentCopy />
            </VariantButton>
            <span class="visually-hidden" role="status">
                {copyStatus === "copied"
                    ? "ID del curso copiado al portapapeles."
                    : ""}
            </span>
        {/if}

        <VariantButton
            variant="secondary-dark"
            onclick={() => goto(settingsHref)}
        >
            Configuración
        </VariantButton>
    {/snippet}
</Sidebar>

<style>
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .sidebar-title {
        color: var(--secondary-color);
        font-size: calc(1.25rem * var(--font-scale));
        font-weight: bold;
        user-select: none;
    }

    .subnav-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow: hidden;
        height: auto;
    }

    .subnav-group.is-collapsed {
        height: 0px;
    }
</style>
