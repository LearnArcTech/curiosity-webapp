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
        gap: 0.45rem;
        width: 100%;
    }

    .input-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    label {
        color: color-mix(in srgb, var(--text-color) 84%, transparent);
        font-size: 0.94rem;
        font-weight: 700;
        letter-spacing: 0;
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
        min-height: 3.25rem;
        padding: 0.95rem 1rem;
        border: 1px solid var(--soft-border-color, #d1d5db);
        border-radius: 14px;
        width: 100%;
        background: var(--field-surface, rgba(255, 255, 255, 0.82));
        color: var(--text-color);
        font-family: inherit;
        font-size: 1rem;
        outline: none;
        box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 10px 24px rgba(22, 38, 49, 0.04);
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;
    }

    input::placeholder {
        color: color-mix(in srgb, var(--border-color) 70%, white);
    }

    input:focus {
        border-color: var(--primary-color, #3b82f6);
        background: var(--field-surface, #ffffff);
        box-shadow:
            0 0 0 4px color-mix(in srgb, var(--primary-container-color) 48%, transparent),
            0 14px 30px rgba(22, 38, 49, 0.08);
    }

    input.input-error {
        border-color: var(--error-color, #ef4444);
    }
</style>
