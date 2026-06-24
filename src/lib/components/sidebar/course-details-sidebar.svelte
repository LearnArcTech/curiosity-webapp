<script lang="ts">
    import { goto } from "$app/navigation";
    import { animate } from "animejs";
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
    }

    let {
        courseName,
        role,
        section,
        subsection,
        subHref,
        settingsHref,
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
                        duration: 250,
                        ease: "outQuad",
                        onComplete: () => {
                            node.style.height = "auto";
                        },
                    });
                } else {
                    const start = node.scrollHeight;
                    node.style.height = `${start}px`;
                    current = animate(node, {
                        height: [start, 0],
                        duration: 200,
                        ease: "outQuad",
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
</script>

<aside class="course-sidebar" aria-label="Navegación del curso">
    <h1 id="course-nav-title" class="sidebar-title">{courseName}</h1>

    <div class="course-nav" aria-labelledby="course-nav-title">
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
        min-width: 250px;
        max-width: 250px;
        border-right: 1px solid var(--border-color);
        height: 100%;
    }

    .sidebar-title {
        color: var(--secondary-color);
        font-size: 1.25rem;
        font-weight: bold;
        user-select: none;
    }

    .course-nav {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .subnav-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        overflow: hidden;
        height: auto;
    }

    .subnav-group.is-collapsed {
        height: 0px;
    }

    .sidebar-footer {
        margin-top: auto;
    }

    .sidebar-footer :global(button) {
        width: 100%;
    }
</style>
