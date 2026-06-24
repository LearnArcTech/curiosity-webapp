<script lang="ts">
    let {
        checked = $bindable(false),
        disabled = false,
        id = `switch-${Math.random().toString(36).substring(2, 9)}`,
    } = $props<{
        checked: boolean;
        disabled?: boolean;
        id?: string;
    }>();
</script>

<div class="switch-wrapper {disabled ? 'disabled' : ''}">
    <input
        type="checkbox"
        {id}
        bind:checked
        {disabled}
        aria-checked={checked}
        role="switch"
    />
    <label for={id} class="switch-slider">
        <span class="switch-knob"></span>
    </label>
</div>

<style>
    .switch-wrapper {
        display: inline-block;
        vertical-align: middle;
    }

    input[type="checkbox"] {
        display: none;
    }

    .switch-slider {
        display: block;
        width: 44px;
        height: 24px;
        background-color: var(--primary-container-color);
        border-radius: var(--radius);
        position: relative;
        cursor: pointer;
        transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .switch-knob {
        display: block;
        width: 18px;
        height: 18px;
        background-color: var(--white);
        border-radius: var(--radius);
        position: absolute;
        top: 3px;
        left: 3px;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Estado Activo / Encendido (Azul de la marca) */
    input[type="checkbox"]:checked + .switch-slider {
        background-color: var(--primary-color);
    }

    input[type="checkbox"]:checked + .switch-slider .switch-knob {
        transform: translateX(20px);
    }

    /* Estado Deshabilitado */
    .disabled {
        opacity: 0.6;
        pointer-events: none;
    }
</style>
