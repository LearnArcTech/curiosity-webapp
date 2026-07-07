<script lang="ts">
    import { animate, utils } from "animejs";
    import { pushState } from "$app/navigation";
    import { page } from "$app/state";

    import { auth } from "$lib/api";
    import { goto, invalidateAll } from "$app/navigation";

    import loginImg from "$lib/assets/pexels-august-de-richelieu-4260483 1.png";
    import registerImg from "$lib/assets/pexels-diva-plavalaguna-6937717 1.png";
    import registerCourseImg from "$lib/assets/pexels-roman-odintsov-11025029 1.png";

    import { fly } from "svelte/transition";
    import Checkbox from "$lib/components/basic/checkbox.svelte";
    import Input from "$lib/components/basic/input.svelte";
    import VariantButton from "$lib/components/basic/variant-button.svelte";
    import Link from "$lib/components/basic/link.svelte";
    import WaveLoader from "$lib/components/basic/wave-loader.svelte";

    let email = $state("");
    let password = $state("");
    let courseCode = $state("");
    let rememberMe = $state(false);
    let error = $state("");

    let isSubmitting = $state(false);
    let isGuestLoading = $state(false);

    let currentView = $derived(
        page.state.view || page.url.searchParams.get("view") || "login",
    );

    let imageSlogan = $derived(
        currentView === "register"
            ? "Comienza tu ruta de aprendizaje."
            : currentView === "login-code"
              ? "Entra a tu curso con tu código."
              : "Aprende, participa y avanza.",
    );

    let previousView = "login";
    let directionView = "login";
    let directionMultiplier = $state(1);

    let sloganEl: HTMLElement | undefined = $state();

    function changeView(e: Event, view: "login" | "register" | "login-code") {
        e.preventDefault();
        error = "";
        pushState(`?view=${view}`, {
            view: view,
        });
    }

    async function handleLogin(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        isSubmitting = true;
        try {
            const data = await auth.login(email, password);
            await invalidateAll();
            if (!data) return;
            goto(data.onboarding_required ? "/onboarding" : "/courses");
        } catch (err: any) {
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function handleRegister(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        isSubmitting = true;
        try {
            const data = await auth.register(email, password);
            if (!data) return;
            goto("/onboarding");
        } catch (err: any) {
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function handleCourseCodeLogin(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        isSubmitting = true;
        try {
            const data = await auth.loginWithCourseCode(courseCode);
            await invalidateAll();
            if (!data) return;
            goto(`/courses`);
        } catch (err: any) {
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function handleGuestLogin() {
        error = "";
        isGuestLoading = true;
        try {
            const data = await auth.loginAsGuest();
            await invalidateAll();
            if (!data) return;
            goto("/courses");
        } catch (err: any) {
            error = err.message;
        } finally {
            isGuestLoading = false;
        }
    }

    $effect.pre(() => {
        const current = currentView;

        if (current !== directionView) {
            if (directionView === "login") {
                directionMultiplier = 1;
            } else if (current === "login") {
                directionMultiplier = -1;
            } else {
                directionMultiplier = 1;
            }

            directionView = current;
        }
    });

    $effect(() => {
        utils.remove(".bg-img");

        const containerWidth =
            document.querySelector(".left")?.clientWidth || 600;

        document.querySelectorAll(".bg-img").forEach((img) => {
            const view = img.getAttribute("data-view");

            if (view === currentView) {
                // @ts-ignore
                img.style.zIndex = "10";

                animate(img, {
                    x: [containerWidth * directionMultiplier, 0],
                    duration: 500,
                    ease: "outCubic",
                });
            } else if (view === previousView) {
                // @ts-ignore
                img.style.zIndex = "5";
                // @ts-ignore
                img.style.transform = "translateX(0px)";
            } else {
                // @ts-ignore
                img.style.zIndex = "1";
                // @ts-ignore
                img.style.transform = `translateX(${containerWidth * directionMultiplier}px)`;
            }
        });

        previousView = currentView;
    });

    $effect(() => {
        const text = imageSlogan;
        if (!sloganEl) return;

        const words = text.split(" ");

        sloganEl.innerHTML = words
            .map((word) => {
                const lettersHtml = word.replace(
                    /(\S)/g,
                    "<span class='slogan-letter' style='display: inline-block; will-change: transform, opacity;'>$1</span>",
                );
                return `<span class="slogan-word" style="display: inline-block; white-space: nowrap;">${lettersHtml}</span>`;
            })
            .join(" ");

        const letters = sloganEl.querySelectorAll(".slogan-letter");

        animate(letters, {
            translateY: ["110%", "0%"],
            opacity: [0, 1],
            duration: 450,
            ease: "outCubic",
            delay: (el: HTMLElement, i: number) => i * 18,
        });
    });
</script>

<main class="login-layout-container">
    <div class="left">
        <div class="bg-images-container">
            <img
                src={loginImg}
                class="bg-img"
                data-view="login"
                alt="Login Background"
            />
            <img
                src={registerImg}
                class="bg-img"
                data-view="register"
                alt="Register Background"
            />
            <img
                src={registerCourseImg}
                class="bg-img"
                data-view="login-code"
                alt="Code Background"
            />
            <div class="bg-overlay"></div>
            <div class="image-copy" aria-hidden="true">
                <strong bind:this={sloganEl}></strong>
            </div>
        </div>
    </div>

    <div class="right">
        <div class="form-container-stack">
            {#if currentView === "login"}
                <div
                    class="form-wrapper"
                    in:fly={{
                        x: 20 * directionMultiplier,
                        duration: 300,
                        delay: 150,
                    }}
                    out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
                >
                    <h1 class="login-header">Iniciar sesión</h1>
                    <p class="sub-header">
                        ¿No tienes una cuenta? <Link
                            href="/register"
                            onclick={(e: Event) => changeView(e, "register")}
                        >
                            Registrate
                        </Link><br />
                        <Link
                            href="/register"
                            onclick={(e: Event) => changeView(e, "login-code")}
                        >
                            Ingresa con código del curso
                        </Link>
                    </p>
                    <form onsubmit={handleLogin}>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            label="E-mail"
                            placeholder="usuario@ejemplo.com"
                            bind:value={email}
                            required
                            disabled={isSubmitting || isGuestLoading}
                        />

                        <Input
                            type="password"
                            id="password"
                            name="password"
                            label="Contraseña"
                            placeholder=""
                            bind:value={password}
                            required
                            disabled={isSubmitting || isGuestLoading}
                        />

                        <Checkbox
                            id="remember"
                            name="remember"
                            label="Recordarme"
                            bind:checked={rememberMe}
                            disabled={isSubmitting || isGuestLoading}
                        />

                        {#if error && currentView === "login"}
                            <p class="error">{error}</p>
                        {/if}

                        <div class="button-group">
                            <VariantButton
                                type="submit"
                                disabled={isSubmitting || isGuestLoading}
                            >
                                {#if isSubmitting}
                                    <WaveLoader size={21} />
                                {:else}
                                    <span>Ingresa</span>
                                {/if}
                            </VariantButton>

                            <VariantButton
                                type="button"
                                variant="primary-light"
                                onclick={handleGuestLogin}
                                disabled={isSubmitting || isGuestLoading}
                            >
                                {#if isGuestLoading}
                                    <WaveLoader size={21} />
                                {:else}
                                    <span>Ingresa como invitado</span>
                                {/if}
                            </VariantButton>
                        </div>
                    </form>
                </div>
            {/if}

            {#if currentView === "register"}
                <div
                    class="form-wrapper"
                    in:fly={{
                        x: 20 * directionMultiplier,
                        duration: 300,
                        delay: 150,
                    }}
                    out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
                >
                    <h1 class="login-header">Regístrate</h1>
                    <p class="sub-header">
                        ¿Ya tienes cuenta?
                        <Link
                            href="/"
                            onclick={(e: Event) => changeView(e, "login")}
                        >
                            Inicia sesión
                        </Link>
                    </p>
                    <form onsubmit={handleRegister}>
                        <Input
                            type="email"
                            id="reg-email"
                            name="email"
                            label="E-mail"
                            placeholder="usuario@ejemplo.com"
                            bind:value={email}
                            required
                            disabled={isSubmitting}
                        />
                        <Input
                            type="password"
                            id="reg-password"
                            name="password"
                            label="Contraseña"
                            bind:value={password}
                            required
                            disabled={isSubmitting}
                        />

                        {#if error && currentView === "register"}
                            <p class="error">{error}</p>
                        {/if}

                        <div class="button-group">
                            <VariantButton
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {#if isSubmitting}
                                    <WaveLoader size={21} />
                                {:else}
                                    <span>Crear Cuenta</span>
                                {/if}
                            </VariantButton>
                        </div>
                    </form>
                </div>
            {/if}

            {#if currentView === "login-code"}
                <div
                    class="form-wrapper"
                    in:fly={{
                        x: 20 * directionMultiplier,
                        duration: 300,
                        delay: 150,
                    }}
                    out:fly={{ x: -20 * directionMultiplier, duration: 150 }}
                >
                    <h1 class="login-header">Código de Curso</h1>
                    <p class="sub-header">
                        <Link
                            href="/"
                            onclick={(e: Event) => changeView(e, "login")}
                        >
                            Regresar a iniciar sesión
                        </Link>
                    </p>
                    <form onsubmit={handleCourseCodeLogin}>
                        <Input
                            type="text"
                            id="course-code"
                            name="course_code"
                            label="Código del Curso"
                            placeholder="ABC-123"
                            bind:value={courseCode}
                            required
                            disabled={isSubmitting}
                        />
                        {#if error && currentView === "login-code"}
                            <p class="error">{error}</p>
                        {/if}
                        <div class="button-group">
                            <VariantButton
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {#if isSubmitting}
                                    <WaveLoader size={21} />
                                {:else}
                                    <span>Validar Código</span>
                                {/if}
                            </VariantButton>
                        </div>
                    </form>
                </div>
            {/if}
        </div>
    </div>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 100%;
    }

    .left {
        position: relative;
        min-width: 0;
        overflow: hidden;
        background: #17120f;
    }

    .right {
        position: relative;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        margin-left: -15px;
        padding: clamp(2rem, 4vw, 3.5rem);
        background: var(--auth-panel-bg, #ffffff);
        border-radius: 15px 0 0 15px;
        box-shadow: -34px 0 80px rgba(0, 0, 0, 0.2);
    }

    .form-container-stack {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        align-items: start;
        width: 100%;
        overflow: hidden;
        min-height: 380px;
    }

    .form-wrapper {
        grid-area: 1 / 1 / 2 / 2;
        width: 100%;
    }

    .login-header {
        color: var(--primary-color);
        font-size: 2.5rem;
    }

    .sub-header {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.85rem;
    }

    .bg-images-container {
        position: absolute;
        inset: 0;
        z-index: 1;
    }

    .bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 1;
        will-change: transform;
    }

    .bg-overlay {
        position: absolute;
        inset: 0;
        z-index: 20;
        pointer-events: none;
        background:
            radial-gradient(
                circle at 40% 28%,
                transparent 0,
                transparent 7rem,
                rgba(255, 255, 255, 0.08) 7.1rem,
                transparent 7.2rem
            ),
            radial-gradient(
                circle at 40% 28%,
                transparent 0,
                transparent 12rem,
                rgba(255, 255, 255, 0.06) 12.1rem,
                transparent 12.2rem
            ),
            linear-gradient(
                to bottom,
                rgba(23, 18, 15, 0.2),
                rgba(23, 18, 15, 0.65)
            );
    }

    .image-copy {
        position: absolute;
        z-index: 26;
        left: clamp(3rem, 7vw, 7rem);
        top: clamp(8rem, 20vh, 14rem);
        right: 35%;
        color: #ffffff;
        pointer-events: none;
    }

    .image-copy strong {
        display: block;
        max-width: 430px;
        font-family: var(--font-display, sans-serif);
        font-size: clamp(2rem, 3.45vw, 3.45rem);
        line-height: 1.05;
        font-weight: 800;
        text-wrap: balance;
        overflow: hidden;
    }

    .error {
        color: var(--error-color);
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }

    @media (max-width: 900px) {
        main.login-layout-container {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(280px, 35vh) auto;
            min-height: auto;
        }

        .right {
            margin-left: 0;
            margin-top: -42px;
            border-radius: 36px 36px 0 0;
            padding: 2.5rem 1.5rem;
        }
    }

    @media (min-width: 901px) and (max-height: 740px) {
        .right {
            padding-block: 1.5rem;
        }

        .login-header {
            font-size: clamp(2.2rem, 3.5vw, 2.75rem);
            margin-bottom: 0.5rem;
        }

        .sub-header {
            margin-bottom: 1rem;
            font-size: 0.85rem;
        }

        form {
            gap: 0.75rem;
        }

        .button-group {
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
    }

    @media (max-width: 560px) {
        main.login-layout-container {
            grid-template-rows: minmax(220px, 30vh) auto;
        }

        .right {
            padding: 2rem 1.25rem;
        }

        .image-copy {
            display: none;
        }
    }
</style>
