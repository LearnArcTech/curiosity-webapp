<script>
    let {
        href = null,
        class: className = "",
        children,
        onclick,
        ...rest
    } = $props();
</script>

{#if href}
    <a {href} class="styled-link {className}" {onclick} {...rest}>
        {@render children?.()}
    </a>
{:else}
    <button type="button" class="styled-link {className}" {onclick} {...rest}>
        {@render children?.()}
    </button>
{/if}

<style>
    .styled-link {
        background: none;
        border: none;
        color: var(--primary-color);
        text-decoration: underline;
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
        font-family: inherit;
    }
    .styled-link:focus-visible {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }
</style>
