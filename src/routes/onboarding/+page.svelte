<script>
    import { pushState } from "$app/navigation";
    import { page } from "$app/state";
    import { fly } from "svelte/transition";

    import { onboarding } from "$lib/api";
    import { goto } from "$app/navigation";

    import RoleStep from "$lib/components/onboarding/rolestep.svelte";
    import NameStep from "$lib/components/onboarding/namestep.svelte";
    import CourseStep from "$lib/components/onboarding/coursestep.svelte";

    /** @type {null | string} */
    let userRole = $state(null);
    let userName = $state("");
    /** @type {string[]} */
    let courseName = $state([]);

    let error = $state("");
    let loading = $state(false);

    let currentStep = $derived(
        // @ts-ignore
        parseInt(page.state.step || page.url.searchParams.get("step")) || 1,
    );

    let directionStep = 1;
    let directionMultiplier = $state(1);

    $effect.pre(() => {
        const current = currentStep;

        if (current !== directionStep) {
            directionMultiplier = current > directionStep ? 1 : -1;
            directionStep = current;
        }
    });

    /**
     * Helper to navigate between steps using browser history
     * @param {number} step
     */
    function goToStep(step) {
        pushState(`?step=${step}`, {
            // @ts-ignore
            step: step,
        });
    }

    /** @param {string | null} role */
    async function handleRoleContinue(role) {
        error = "";
        loading = true;
        try {
            await onboarding.setRole(/** @type {'teacher'|'student'} */ (role));
            userRole = role;
            goToStep(2);
        } catch (err) {
            error = /** @type {Error} */ (err).message;
        } finally {
            loading = false;
        }
    }

    async function handleNameContinue() {
        error = "";
        loading = true;
        try {
            await onboarding.setUsername(userName);
            if (userRole === "teacher") {
                goToStep(3);
            } else {
                goto("/courses");
            }
        } catch (err) {
            error = /** @type {Error} */ (err).message;
        } finally {
            loading = false;
        }
    }

    async function handleCourseContinue() {
        error = "";
        loading = true;
        try {
            for (const name of courseName) {
                await onboarding.createCourse(name);
            }
            goto("/courses");
        } catch (err) {
            error = /** @type {Error} */ (err).message;
        } finally {
            loading = false;
        }
    }

    function finishOnboarding() {
        goto("/courses");
    }
</script>

<main class="main-content">
    {#if error}
        <p class="error">{error}</p>
    {/if}

    <div class="step-container-stack">
        {#if currentStep === 1}
            <div
                class="step-wrapper"
                in:fly={{
                    x: 20 * directionMultiplier,
                    duration: 300,
                    delay: 150,
                }}
                out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
            >
                <RoleStep onContinue={handleRoleContinue} />
            </div>
        {/if}

        {#if currentStep === 2}
            <div
                class="step-wrapper"
                in:fly={{
                    x: 20 * directionMultiplier,
                    duration: 300,
                    delay: 150,
                }}
                out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
            >
                <NameStep
                    bind:name={userName}
                    onContinue={handleNameContinue}
                    onSkip={handleNameContinue}
                />
            </div>
        {/if}

        {#if currentStep === 3}
            <div
                class="step-wrapper"
                in:fly={{
                    x: 20 * directionMultiplier,
                    duration: 300,
                    delay: 150,
                }}
                out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
            >
                <CourseStep
                    bind:courses={courseName}
                    onSubmit={handleCourseContinue}
                    onSkip={finishOnboarding}
                />
            </div>
        {/if}
    </div>
</main>

<style>
    .main-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 120px);
    }

    .step-container-stack {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        align-items: center;
        justify-items: center;
        width: 100%;
        flex: 1;
        overflow: hidden;
    }

    .step-wrapper {
        grid-area: 1 / 1 / 2 / 2;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error {
        color: var(--error-color, #c0392b);
        text-align: center;
        padding: 0.5rem;
    }
</style>
