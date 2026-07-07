<script lang="ts">
    import type { Snippet } from "svelte";
    import type { Profile } from "$lib/api";
    import ProfileSidebar from "$lib/components/sidebar/ProfileSidebar.svelte";

    let {
        data,
        children,
    }: {
        data: {
            profile: Profile;
            avatarUrl: string | null;
        };
        children: Snippet;
    } = $props();
</script>

<div class="profile-layout">
    <div>
        <ProfileSidebar username={data.profile.username ?? "User"} />
    </div>
    <div class="content">
        {@render children()}
    </div>
</div>

<style>
    .profile-layout {
        display: flex;
        height: 100%;
        min-height: 0;
        flex: 1;
    }
    .content {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
    }

    @media (max-width: 770px) {
        .profile-layout {
            flex-direction: column;
        }
    }
</style>
