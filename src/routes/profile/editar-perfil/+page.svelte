<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Avatar from "$lib/components/basic/avatar.svelte";
    import { profile } from "$lib/api";

    let {
        data,
    }: { data: { profile: { id: string; username: string; email: string } } } =
        $props();

    let username = $state("");
    const email = $derived(data.profile.email);

    let previewUrl = $state<string | null>(null);
    let selectedFile = $state<File | null>(null);

    let fileInput = $state<HTMLInputElement | null>(null);
    let avatarVersion = $state<number | string>(Date.now());

    $effect(() => {
        username = data.profile.username;
    });

    function handlePhotoSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        selectedFile = file;

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
    }

    function triggerFilePicker() {
        fileInput?.click();
    }

    let saving = $state(false);
    let successMessage = $state("");
    let formError = $state("");

    async function handleSubmit(e: Event) {
        e.preventDefault();
        formError = "";
        successMessage = "";
        saving = true;

        try {
            await profile.update(username);

            if (selectedFile) {
                await profile.uploadAvatar(selectedFile);
                avatarVersion = Date.now();
                selectedFile = null;
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    previewUrl = null;
                }
            }

            successMessage = "Perfil actualizado correctamente";
            await invalidateAll();
        } catch (err) {
            formError =
                err instanceof Error
                    ? err.message
                    : "No se pudo actualizar el perfil";
        } finally {
            saving = false;
        }
    }
</script>

<h1>Editar perfil</h1>

<form onsubmit={handleSubmit}>
    <Input
        id="username"
        name="username"
        label="Nombre de usuario"
        bind:value={username}
        required
    />

    <Input
        id="email"
        name="email"
        type="email"
        label="E-Mail"
        value={email}
        disabled
    />

    <div class="photo-field">
        <span class="field-label">Foto de perfil</span>
        <div class="photo-row">
            <Avatar
                src={previewUrl}
                name={username}
                userId={data.profile.id}
                size={56}
                version={avatarVersion}
            />

            <input
                bind:this={fileInput}
                type="file"
                accept="image/*"
                onchange={handlePhotoSelect}
                class="visually-hidden"
            />

            <VariantButton
                type="button"
                variant="secondary-dark"
                onclick={triggerFilePicker}
            >
                Subir foto
            </VariantButton>
        </div>
    </div>

    {#if formError}
        <p class="form-error">{formError}</p>
    {/if}
    {#if successMessage}
        <p class="form-success">{successMessage}</p>
    {/if}

    <VariantButton type="submit" disabled={saving}>
        {saving ? "Guardando…" : "Confirmar cambios"}
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

    .photo-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .field-label {
        font-weight: 500;
        color: var(--text-color);
    }

    .photo-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
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
