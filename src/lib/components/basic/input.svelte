<script>
    /** * @type {import('svelte/elements').HTMLInputAttributes & {
     * id: string;
     * name: string;
     * label?: string;
     * error?: string;
     * }}
     */
    let {
        id,
        name,
        label = undefined,
        type = "text",
        placeholder = "",
        value = $bindable(""),
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
    /** @param {Event} e */
    function handleInvalid(e) {
        e.preventDefault();
        checkValidity();
    }
    function handleInput() {
        if (error) checkValidity();
    }
</script>

<div class="form-group">
    <div class="input-header">
        {#if label}
            <label for={id}>{label}</label>
        {/if}
        {#if error}
            <span id="{id}-error" class="error-text" role="alert">{error}</span>
        {/if}
    </div>
    <input
        {...rest}
        {type}
        {id}
        {name}
        {placeholder}
        bind:value
        bind:this={inputRef}
        oninvalid={handleInvalid}
        onblur={checkValidity}
        oninput={handleInput}
        class:input-error={error}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
    />
</div>

<style>
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
    }
    .input-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        gap: 0.5rem;
    }
    label {
        font-size: calc(1rem * var(--font-scale));
        font-weight: 500;
    }
    .error-text {
        color: var(--error-color, #ef4444);
        font-size: calc(0.85rem * var(--font-scale));
        text-align: right;
    }
    input {
        padding: calc(0.8rem * var(--font-scale))
            calc(1.5rem * var(--font-scale));
        border: var(--border-width) solid var(--border-color, #d1d5db);
        border-radius: var(--radius, 4px);
        width: 100%;
        font-family: inherit;
        font-size: calc(1rem * var(--font-scale));
        outline: none;
        transition: border-color var(--motion-duration);
    }
    input:focus {
        border-color: var(--primary-color, #3b82f6);
        outline: var(--border-width) solid var(--primary-color, #3b82f6);
        outline-offset: 1px;
    }
    input.input-error {
        border-color: var(--error-color, #ef4444);
    }
</style>
