<script>
    import Tooltip from "./tooltip.svelte";

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
            <span class="desktop-error">{error}</span>

            <div class="mobile-error">
                <Tooltip text={error}>
                    <div class="error-icon-badge" aria-label="Error">✕</div>
                </Tooltip>
            </div>
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
    }

    label {
        font-size: 1rem;
        font-weight: 500;
    }

    /* --- Responsive Visibility Strategy --- */

    .desktop-error {
        display: inline-block;
        color: var(--error-color, #ef4444);
        font-size: 1rem;
    }

    .mobile-error {
        display: none; /* Hidden on wider desktop screens */
    }

    /* Small visual indicator badge for the 'X' */
    .error-icon-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--error-color, #ef4444);
        color: white;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: bold;
    }

    /* When viewport drops below 500px, seamlessly swap layouts */
    @media (max-width: 500px) {
        .desktop-error {
            display: none;
        }
        .mobile-error {
            display: inline-block;
        }
    }

    /* --- Native Input Styling Core --- */
    input {
        padding: 0.8rem 1.5rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: var(--radius, 4px);
        width: 100%;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
    }

    input:focus {
        border-color: var(--primary-color, #3b82f6);
    }

    input.input-error {
        border-color: var(--error-color, #ef4444);
    }
</style>
