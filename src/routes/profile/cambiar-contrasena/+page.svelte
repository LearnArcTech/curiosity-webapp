<script lang="ts">
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import { auth } from "$lib/api";

    let currentPassword = $state("");
    let newPassword = $state("");
    let confirmPassword = $state("");
    let formError = $state("");
    let successMessage = $state("");
    let submitting = $state(false);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        formError = "";
        successMessage = "";

        if (newPassword !== confirmPassword) {
            formError = "Las contraseñas nuevas no coinciden";
            return;
        }

        submitting = true;
        try {
            await auth.changePassword(currentPassword, newPassword);
            successMessage = "Contraseña actualizada correctamente";
            currentPassword = "";
            newPassword = "";
            confirmPassword = "";
        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "No se pudo cambiar la contraseña";
        } finally {
            submitting = false;
        }
    }
</script>

<h1>Cambiar contraseña</h1>

<form onsubmit={handleSubmit}>
    <Input
        id="current-password"
        name="current-password"
        type="password"
        label="Contraseña actual"
        bind:value={currentPassword}
        required
    />
    <Input
        id="new-password"
        name="new-password"
        type="password"
        label="Nueva contraseña"
        bind:value={newPassword}
        required
    />
    <Input
        id="confirm-password"
        name="confirm-password"
        type="password"
        label="Confirmar nueva contraseña"
        bind:value={confirmPassword}
        required
    />

    {#if formError}
        <p class="form-error">{formError}</p>
    {/if}
    {#if successMessage}
        <p class="form-success">{successMessage}</p>
    {/if}

    <VariantButton type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Confirmar cambios"}
    </VariantButton>
</form>

<style>
    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
    }
    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 24rem;
    }
    .form-error {
        color: var(--error-color);
        margin: 0;
    }
    .form-success {
        color: var(--primary-color);
        margin: 0;
    }
</style>
