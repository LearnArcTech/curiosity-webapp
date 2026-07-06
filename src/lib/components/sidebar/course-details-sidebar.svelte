<script lang="ts">
    import { goto } from "$app/navigation";
    import { animate } from "animejs";
    import {
        ContentCopy,
        KeyboardArrowDown,
    } from "@material-symbols-svg/svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";

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
    let mobileOpen = $state(false);

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
                { key: "rankings", label: "Rankings", roles: ["student"] },
                {
                    key: "calificaciones",
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

    function collapse(node: HTMLElement, expanded: boolean) {
        let isExpanded = expanded;
        let current: ReturnType<typeof animate> | undefined;

        node.style.overflow = "hidden";
        node.style.height = isExpanded ? "auto" : "0px";
        if (!isExpanded) node.toggleAttribute("inert", true);

        return {
            update(nextExpanded: boolean) {
                if (nextExpanded === isExpanded) return;
                isExpanded = nextExpanded;
                current?.pause();

                if (nextExpanded) {
                    node.toggleAttribute("inert", false);
                    const target = node.scrollHeight;
                    node.style.height = "0px";
                    current = animate(node, {
                        height: [0, target],
                        duration: 500,
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
                        duration: 500,
                        ease: "inOutExpo",
                        onComplete: () => {
                            node.toggleAttribute("inert", true);
                        },
                    });
                }
            },
            destroy() {
                current?.pause();
            },
        };
    }

    function handleCopyID() {
        if (!courseId || !navigator) return;
        navigator.clipboard.writeText(courseId);
    }
</script>

<aside class="course-sidebar" aria-label="Navegación del curso">
    <div class="sidebar-header-row">
        <h1 id="course-nav-title" class="sidebar-title">{courseName}</h1>
        <button
            type="button"
            class="mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="course-nav-collapsible"
            onclick={() => (mobileOpen = !mobileOpen)}
        >
            <KeyboardArrowDown />
        </button>
    </div>

    <div
        id="course-nav-collapsible"
        class="collapsible"
        class:is-collapsed={!mobileOpen}
    >
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
                inert={expandedSection !== group.key}
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
    </div>

    <div class="sidebar-footer">
        {#if role === "teacher"}
            <VariantButton variant="secondary-light" onclick={handleCopyID}>
                Copy course ID
                <ContentCopy />
            </VariantButton>
        {/if}

        <VariantButton
            variant="secondary-dark"
            onclick={() => goto(settingsHref)}
        >
            Configuración
        </VariantButton>
    </div>
</aside>

<style>
    .course-sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        padding: 1rem;
        background: var(--secondary-container-color);
        border-right: 1px solid var(--border-color);
        height: 100%;
        width: 100%;
    }

    .sidebar-title {
        color: var(--secondary-color);
        font-size: 1.25rem;
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

    .sidebar-footer {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 0.5rem;
    }

    .sidebar-footer :global(button) {
        width: 100%;
    }

    .sidebar-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .mobile-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0.25rem;
        color: inherit;
        cursor: pointer;
        flex-shrink: 0;
    }

    .collapsible {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        overflow: hidden;
    }

    @media (max-width: 950px) {
        .course-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            height: auto;
        }

        .mobile-toggle {
            display: flex;
        }

        .collapsible {
            max-height: 50vh;
            overflow-y: auto;
        }

        .collapsible.is-collapsed {
            height: 0;
            max-height: 0;
            gap: 0;
        }
    }
</style>
