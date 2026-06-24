<script>
    /** * @type {import('svelte/elements').HTMLInputAttributes & {
     * id: string;
     * name: string;
     * label: string;
     * error?: string;
     * }}
     */
    let {
        id,
        name,
        label,
        checked = $bindable(false),
        error = $bindable(""),
        ...rest
    } = $props();

    /** @type {HTMLInputElement} */
    let inputRef;

    function checkValidity() {
        if (inputRef) {
            error = inputRef.validationMessage;
        }
    }

    /** * @param {Event} e
     */
    function handleInvalid(e) {
        e.preventDefault();
        checkValidity();
    }

    function handleChange() {
        if (error) checkValidity();
    }
</script>

<div class="checkbox-container">
    <div class="checkbox-group">
        <input
            {...rest}
            type="checkbox"
            {id}
            {name}
            bind:checked
            bind:this={inputRef}
            oninvalid={handleInvalid}
            onchange={handleChange}
        />
        <label for={id} class:label-error={error}>{label}</label>
    </div>
    {#if error}
        <span class="error-text">{error}</span>
    {/if}
</div>

<style>
    .checkbox-container {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    label {
        font-size: 0.875rem;
        cursor: pointer;
    }

    .label-error {
        color: var(--error-color);
    }

    input[type="checkbox"] {
        cursor: pointer;
        width: 1rem;
        height: 1rem;
    }

    .error-text {
        color: var(--error-color);
        font-size: 0.75rem;
    }
</style>
