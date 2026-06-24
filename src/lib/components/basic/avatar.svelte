<script lang="ts">
    import { Person } from "@material-symbols-svg/svelte";
    import { profile } from "$lib/api";
    let {
        src = null,
        name = "",
        size = 48,
        userId = null,
        version = "",
    }: {
        src?: string | null;
        name?: string;
        size?: number;
        userId?: string | null;
        version?: string | number;
    } = $props();

    let fetchedProfile = $state<any>(null);
    let imageFailed = $state(false);
    let internalBuster = $state(Date.now());

    $effect(() => {
        if (!src && !name && !userId) {
            let unsubscribe: (() => void) | void;

            const initProfile = async () => {
                try {
                    const data = await profile.me();
                    fetchedProfile = data;
                    unsubscribe = profile.subscribe(data.id, async () => {
                        try {
                            fetchedProfile = await profile.me();
                            internalBuster = Date.now();
                        } catch (e) {
                            console.error("Failed to refresh profile:", e);
                        }
                    });
                } catch (error) {
                    fetchedProfile = null;
                }
            };

            initProfile();

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    });

    $effect(() => {
        if (displaySrc) imageFailed = false;
    });

    function appendCacheBuster(url: string | null, buster: string | number) {
        if (!url) return null;
        return buster ? `${url}?v=${buster}` : url;
    }

    const displaySrc = $derived.by(() => {
        if (src) return src;

        if (userId) {
            const url = profile.getAvatarUrlByUserId(userId);
            return appendCacheBuster(url, version);
        }

        if (fetchedProfile) {
            const url = profile.getAvatarUrlByUserId(fetchedProfile.id);
            return appendCacheBuster(url, version || internalBuster);
        }

        return null;
    });

    const displayName = $derived(
        name || (fetchedProfile ? fetchedProfile.username : ""),
    );

    const initials = $derived(
        displayName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase() ?? "")
            .join(""),
    );

    const showImage = $derived(displaySrc && !imageFailed);
</script>

{#if showImage}
    <img
        class="avatar"
        src={displaySrc}
        alt={displayName
            ? `Foto de perfil de ${displayName}`
            : "Foto de perfil"}
        style:width="{size}px"
        style:height="{size}px"
        onerror={() => (imageFailed = true)}
    />
{:else}
    <div
        class="avatar avatar-placeholder"
        style:width="{size}px"
        style:height="{size}px"
        style:font-size="{size * 0.4}px"
        aria-hidden="true"
    >
        {#if initials}
            {initials}
        {:else}
            <Person size={size * 0.55} />
        {/if}
    </div>
{/if}

<style>
    .avatar {
        border-radius: 50%;
        flex-shrink: 0;
        object-fit: cover;
    }
    .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
        color: var(--text-color-light);
        font-weight: bold;
        user-select: none;
    }
</style>
