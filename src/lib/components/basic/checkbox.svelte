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
        color: color-mix(in srgb, var(--text-color) 82%, transparent);
        font-size: 0.92rem;
        cursor: pointer;
    }

    .label-error {
        color: var(--error-color);
    }

    input[type="checkbox"] {
        appearance: none;
        cursor: pointer;
        width: 1.1rem;
        height: 1.1rem;
        border: 1px solid color-mix(in srgb, var(--border-color) 65%, white);
        border-radius: 5px;
        background: var(--field-surface, #ffffff);
        display: grid;
        place-items: center;
        transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    input[type="checkbox"]::before {
        content: "";
        width: 0.45rem;
        height: 0.7rem;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transform-origin: center;
        transition: transform 0.15s ease;
    }

    input[type="checkbox"]:checked {
        border-color: var(--primary-color);
        background: var(--primary-color);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-container-color) 45%, transparent);
    }

    input[type="checkbox"]:checked::before {
        transform: rotate(45deg) scale(1);
    }

    .error-text {
        color: var(--error-color);
        font-size: 0.75rem;
    }
</style>
