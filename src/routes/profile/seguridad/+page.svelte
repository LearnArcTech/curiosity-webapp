<script lang="ts">
    import Switch from "$lib/components/basic/switch.svelte";
    let emailVerification = $state(true);
    let twoFactorAuth = $state(false);
</script>

<h1>Seguridad</h1>

<div class="security-card">
    <h2>Verificación por correo</h2>
    <p>Recibe un correo de verificación para acciones sensibles.</p>
    <div class="setting-row">
        <Switch bind:checked={emailVerification} id="email-verification" />
        <label for="email-verification">
            {emailVerification ? "Habilitado" : "Deshabilitado"}
        </label>
    </div>
</div>

<div class="security-card">
    <h2>Autenticación 2FA</h2>
    <p>Añade una capa extra de seguridad a tu cuenta.</p>
    <div class="setting-row">
        <Switch bind:checked={twoFactorAuth} id="two-factor-auth" />
        <label for="two-factor-auth">
            {twoFactorAuth ? "Habilitado" : "Deshabilitado"}
        </label>
    </div>
</div>

<p class="hint">
    Ten en cuenta las acciones de seguridad de la cuenta, ya que pueden afectar
    tu acceso.
</p>

<style>
    h1 {
        color: var(--text-color);
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
    }
    .security-card {
        background: var(--white);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
        max-width: 28rem;
    }
    .security-card h2 {
        font-size: 1.1rem;
        color: var(--text-color);
        margin: 0 0 0.25rem;
    }
    .security-card p {
        color: var(--text-color);
        font-size: 0.9rem;
        margin: 0 0 0.75rem;
        opacity: 0.8;
    }
    .setting-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    label {
        color: var(--text-color);
        font-size: 0.9rem;
    }
    .hint {
        color: var(--text-color);
        font-size: 0.85rem;
        opacity: 0.7;
        max-width: 28rem;
    }
</style>
