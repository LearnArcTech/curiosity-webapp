<script>
    let {
        href = null,
        class: className = "",
        children,
        onclick,
        ...rest
    } = $props();
</script>

<a {href} class="styled-link {className}" {onclick} {...rest}>
    {@render children?.()}
</a>

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
</style>
