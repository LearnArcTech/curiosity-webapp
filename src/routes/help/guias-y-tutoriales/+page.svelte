<script lang="ts">
    import Card from "$lib/components/basic/card.svelte";

    const tutorials = [
        {
            id: "t1",
            title: "Cómo crear un curso",
            image: "/help/tutorial-create-course.jpg",
        },
        {
            id: "t2",
            title: "Cómo iniciar sesión",
            image: "/help/tutorial-start-session.jpg",
        },
        {
            id: "t3",
            title: "Tipos de sesiones",
            image: "/help/tutorial-session-types.jpg",
        },
    ];

    const guides = [
        {
            id: "g1",
            title: "Utilizando el escáner de notas",
            image: "/help/guide-scanner.jpg",
        },
        {
            id: "g2",
            title: "Manual de salones para estudiantes",
            image: "/help/guide-classrooms.jpg",
        },
        {
            id: "g3",
            title: "Tipo de uso de widgets dinámicos",
            image: "/help/guide-widgets.jpg",
        },
    ];
</script>

<section>
    <h2>Tutoriales</h2>
    <div class="grid">
        {#each tutorials as item (item.id)}
            <Card class="tile">
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
            </Card>
        {/each}
    </div>
</section>

<section>
    <h2>Guías</h2>
    <div class="grid">
        {#each guides as item (item.id)}
            <Card class="tile">
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
            </Card>
        {/each}
    </div>
</section>

<style>
    h2 {
        color: var(--text-color);
        font-size: 1.4rem;
        margin-bottom: 1rem;
    }
    section {
        margin-bottom: 2rem;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
    }
    :global(.tile) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.5rem;
    }
    :global(.tile) img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border-radius: var(--radius);
    }
    :global(.tile) span {
        color: var(--text-color);
        font-size: 0.85rem;
    }
</style>
