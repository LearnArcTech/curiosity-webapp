<script lang="ts">
    import Card from "$lib/components/basic/card.svelte";
    let { cardTitle = "CardTitle", cardValue = "" } = $props();
</script>

<Card>
    <p class="title">{cardTitle}</p>
    <p class="content">{cardValue}</p>
</Card>

<style>
    .title {
        color: var(--border-color);
    }

    .content {
        color: var(--primary-color);
        font-weight: bold;
    }
</style>
