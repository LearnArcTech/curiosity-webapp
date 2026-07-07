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
        class="switch-input"
    />
    <label for={id} class="switch-slider">
        <span class="switch-knob"></span>
    </label>
</div>

<style>
    .switch-wrapper {
        display: inline-block;
        vertical-align: middle;
        position: relative;
    }

    .switch-input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    .switch-slider {
        display: block;
        width: 44px;
        height: 24px;
        background-color: var(--primary-container-color);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--radius);
        position: relative;
        cursor: pointer;
        transition: background-color var(--motion-duration)
            cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
    }
    .switch-knob {
        display: block;
        width: 18px;
        height: 18px;
        background-color: var(--white);
        border-radius: var(--radius);
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform var(--motion-duration)
            cubic-bezier(0.4, 0, 0.2, 1);
    }
    input[type="checkbox"]:checked + .switch-slider {
        background-color: var(--primary-color);
    }
    input[type="checkbox"]:checked + .switch-slider .switch-knob {
        transform: translateX(20px);
    }
    /* Now reachable, because the input is genuinely focusable again */
    input[type="checkbox"]:focus-visible + .switch-slider {
        outline: var(--border-width) solid var(--primary-color);
        outline-offset: 2px;
    }
    .disabled {
        opacity: 0.6;
        pointer-events: none;
    }
</style>
