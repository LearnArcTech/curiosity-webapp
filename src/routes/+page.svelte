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

    let email = $state("");
    let password = $state("");
    let courseCode = $state("");
    let rememberMe = $state(false);
    let error = $state("");
    let darkMode = $state(false);

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

    function changeView(e: Event, view: "login" | "register" | "login-code") {
        e.preventDefault();
        error = "";
        pushState(`?view=${view}`, {
            view: view,
        });
    }

    function applyTheme(isDark: boolean) {
        document.documentElement.dataset.theme = isDark ? "dark" : "light";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    function toggleTheme() {
        darkMode = !darkMode;
        applyTheme(darkMode);
    }

    async function handleLogin(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        try {
            const data = await auth.login(email, password);
            await invalidateAll();
            if (!data) return;
            goto(data.onboarding_required ? "/onboarding" : "/courses");
        } catch (err: any) {
            error = err.message;
        }
    }

    async function handleGuestLogin() {
        error = "";
        try {
            const data = await auth.loginAsGuest();
            await invalidateAll();
            if (!data) return;
            goto(data.onboarding_required ? "/onboarding" : "/courses");
        } catch (err: any) {
            error = err.message;
        }
    }

    async function handleRegister(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        try {
            const data = await auth.register(email, password);
            if (!data) return;
            goto("/onboarding");
        } catch (err: any) {
            error = err.message;
        }
    }

    async function handleCourseCodeLogin(e: SubmitEvent) {
        e.preventDefault();
        error = "";
        try {
            console.log("Validating course code:", courseCode);
        } catch (err: any) {
            error = err.message;
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
        const savedTheme = localStorage.getItem("theme");
        darkMode =
            savedTheme === "dark" ||
            (!savedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        applyTheme(darkMode);
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
</script>

<main class="login-page">
    <section class="auth-shell">
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
                <a class="image-brand" href="/">Curiosity</a>
                <div class="image-copy" aria-hidden="true">
                    <strong>{imageSlogan}</strong>
                </div>
                <div class="image-accent" aria-hidden="true"></div>
            </div>
        </div>

        <div class="right">
            <header class="panel-header">
                <span class="panel-header-spacer" aria-hidden="true"></span>
                <div class="top-actions">
                    <button
                        class="theme-toggle"
                        type="button"
                        onclick={toggleTheme}
                        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                        title={darkMode ? "Modo claro" : "Modo oscuro"}
                    >
                        <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
                    </button>
                    <button class="top-login" type="button">Ingresar</button>
                </div>
            </header>

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
                                Regístrate
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
                            />

                            <Input
                                type="password"
                                id="password"
                                name="password"
                                label="Contraseña"
                                placeholder=""
                                bind:value={password}
                                required
                            />

                            <Checkbox
                                id="remember"
                                name="remember"
                                label="Recordarme"
                                bind:checked={rememberMe}
                            />

                            {#if error && currentView === "login"}
                                <p class="error">{error}</p>
                            {/if}

                            <div class="button-group">
                                <VariantButton type="submit">Ingresa</VariantButton>
                                <VariantButton
                                    type="button"
                                    variant="primary-light"
                                    onclick={handleGuestLogin}
                                    >Ingresa como invitado</VariantButton
                                >
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
                            />
                            <Input
                                type="password"
                                id="reg-password"
                                name="password"
                                label="Contraseña"
                                bind:value={password}
                                required
                            />

                            {#if error && currentView === "register"}
                                <p class="error">{error}</p>
                            {/if}

                            <div class="button-group">
                                <VariantButton type="submit"
                                    >Crear Cuenta</VariantButton
                                >
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
                            />
                            {#if error && currentView === "login-code"}
                                <p class="error">{error}</p>
                            {/if}
                            <div class="button-group">
                                <VariantButton type="submit"
                                    >Validar Código</VariantButton
                                >
                            </div>
                        </form>
                    </div>
                {/if}
            </div>

            <footer class="panel-footer">
                <span>© 2026 Curiosity</span>
                <nav>
                    <a href="/meta/Privacy">Política de Privacidad</a>
                    <a href="/meta/TOS">Términos de Servicio</a>
                </nav>
            </footer>
        </div>
    </section>
</main>

<style>
    main.login-page {
        min-height: 100dvh;
        height: 100dvh;
        width: 100%;
        overflow: hidden;
        background: var(--page-background);
    }

    .auth-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(440px, 39vw);
        width: 100%;
        height: 100dvh;
        min-height: 100dvh;
        overflow: hidden;
        background: #17120f;
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
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        min-width: 0;
        margin-left: -74px;
        padding: clamp(2rem, 4vw, 3.5rem);
        background: var(--auth-panel-bg, #ffffff);
        border-radius: 56px 0 0 56px;
        box-shadow: -34px 0 80px rgba(0, 0, 0, 0.2);
    }

    .panel-header,
    .panel-footer {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .panel-header-spacer {
        width: 1px;
        height: 1px;
    }

    .image-brand {
        position: absolute;
        z-index: 27;
        top: clamp(2rem, 5vw, 4.2rem);
        left: clamp(3rem, 7vw, 7rem);
        color: var(--primary-color);
        font-size: 1.35rem;
        font-weight: 800;
    }

    .image-brand {
        color: #ffffff;
        text-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    }

    .image-brand:hover {
        color: var(--primary-container-color);
    }

    .top-actions {
        display: flex;
        align-items: center;
        gap: 0.7rem;
    }

    .theme-toggle,
    .top-login {
        height: 3rem;
        border: 1px solid var(--soft-border-color);
        border-radius: 16px;
        font-weight: 800;
        box-shadow: 0 14px 30px rgba(19, 40, 56, 0.08);
    }

    .theme-toggle {
        display: grid;
        place-items: center;
        width: 3rem;
        background: var(--panel-surface);
        color: var(--primary-color);
        font-size: 1.05rem;
    }

    .top-login {
        padding: 0 1.55rem;
        background: var(--primary-color);
        color: var(--text-color-light);
    }

    .form-container-stack {
        position: relative;
        align-self: center;
        justify-self: center;
        display: grid;
        grid-template: 1fr / 1fr;
        width: min(100%, 440px);
        height: min(68dvh, 610px);
        min-height: min(540px, calc(100dvh - 12rem));
        overflow: visible;
    }

    .form-wrapper {
        grid-area: 1 / 1;
        align-self: start;
        width: 100%;
    }

    .login-header {
        color: var(--primary-color);
        font-size: clamp(3.25rem, 5vw, 4.65rem);
        line-height: 0.96;
        letter-spacing: 0;
        margin-bottom: 1.35rem;
    }

    .sub-header {
        margin-bottom: 2.2rem;
        color: var(--muted-text-color);
        line-height: 1.55;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1.15rem;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.85rem;
    }

    .panel-footer {
        color: color-mix(in srgb, var(--text-color) 68%, transparent);
        font-size: 0.82rem;
        min-height: 1.5rem;
    }

    .panel-footer nav {
        display: flex;
        gap: 1rem;
    }

    .panel-footer a:hover {
        color: var(--primary-color);
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
            radial-gradient(circle at 40% 28%, transparent 0, transparent 7rem, rgba(255, 255, 255, 0.08) 7.1rem, transparent 7.2rem),
            radial-gradient(circle at 40% 28%, transparent 0, transparent 12rem, rgba(255, 255, 255, 0.06) 12.1rem, transparent 12.2rem),
            var(--image-overlay);
    }

    .image-copy {
        position: absolute;
        z-index: 26;
        left: clamp(3rem, 7vw, 7rem);
        top: clamp(10rem, 24vh, 16rem);
        right: 35%;
        color: #ffffff;
        pointer-events: none;
    }

    .image-copy strong {
        display: block;
        max-width: 430px;
        font-family: var(--font-display);
        font-size: clamp(2rem, 3.45vw, 3.45rem);
        line-height: 1.02;
        font-weight: 800;
        letter-spacing: 0;
        text-wrap: balance;
    }

    .image-accent {
        position: absolute;
        z-index: 25;
        left: clamp(3rem, 7vw, 7rem);
        right: 12%;
        bottom: clamp(4rem, 8vh, 6.5rem);
        height: 5px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-container-color));
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    }

    .error {
        color: var(--error-color);
        font-size: 0.9rem;
        margin-top: 0.5rem;
        padding: 0.8rem 1rem;
        border: 1px solid color-mix(in srgb, var(--error-color) 35%, transparent);
        border-radius: 14px;
        background: color-mix(in srgb, var(--error-container-color) 55%, white);
    }

    @media (max-width: 900px) {
        main.login-page {
            overflow: auto;
        }

        .auth-shell {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(280px, 38vh) minmax(620px, auto);
            height: auto;
            min-height: 100%;
            overflow: visible;
        }

        .right {
            margin-left: 0;
            margin-top: -42px;
            border-radius: 36px 36px 0 0;
            padding: 1.5rem;
            min-height: 620px;
        }

        .form-container-stack {
            align-self: start;
            height: auto;
            min-height: 420px;
            margin-top: 1.5rem;
        }

        .panel-footer {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 0.85rem;
        }

        .panel-footer nav {
            flex-direction: column;
            align-items: flex-end;
            text-align: right;
            gap: 0.35rem;
        }
    }

    @media (min-width: 901px) and (max-height: 700px) {
        .right {
            padding-block: 1.35rem;
        }

        .form-container-stack {
            align-self: start;
            height: auto;
            min-height: 0;
            margin-top: 0.75rem;
        }

        .login-header {
            font-size: clamp(2.35rem, 4vw, 3rem);
            margin-bottom: 0.8rem;
        }

        .sub-header {
            margin-bottom: 1rem;
            font-size: 0.78rem;
            line-height: 1.35;
        }

        form {
            gap: 0.7rem;
        }

        .button-group {
            gap: 0.5rem;
            margin-top: 0.45rem;
        }

        .panel-footer {
            font-size: 0.72rem;
        }
    }

    @media (max-width: 560px) {
        .auth-shell {
            grid-template-rows: minmax(250px, 30vh) auto;
        }

        .right {
            min-height: auto;
            padding: 1rem 1.25rem 2rem;
        }

        .panel-header {
            align-items: center;
            min-height: 3.1rem;
        }

        .top-actions {
            gap: 0.5rem;
        }

        .theme-toggle,
        .top-login {
            height: 2.75rem;
            border-radius: 14px;
        }

        .theme-toggle {
            width: 2.75rem;
        }

        .top-login {
            padding: 0 1rem;
        }

        .form-container-stack {
            width: 100%;
            min-height: 0;
            margin-top: 1rem;
            margin-bottom: 1.75rem;
        }

        .login-header {
            max-width: calc(100vw - 2.5rem);
            font-size: clamp(2.25rem, 11vw, 2.75rem);
            line-height: 1;
            margin-bottom: 1rem;
        }

        .sub-header {
            margin-bottom: 1.65rem;
            font-size: 0.95rem;
        }

        form {
            gap: 1rem;
        }

        .button-group {
            margin-top: 0.65rem;
        }

        .image-copy {
            display: none;
        }

        .image-brand {
            top: 2rem;
            left: 2.5rem;
            font-size: 1.2rem;
        }

        .image-accent {
            left: 2.5rem;
            right: 2.5rem;
            bottom: 2.2rem;
            height: 4px;
        }

        .panel-footer {
            margin-top: 1.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.76rem;
            line-height: 1.65;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 0.75rem;
        }

        .panel-footer nav {
            align-items: flex-end;
            flex-direction: column;
            gap: 0.25rem;
            text-align: right;
        }

        .panel-footer a {
            width: fit-content;
        }
    }
</style>
