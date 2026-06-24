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

    let currentView = $derived(
        page.state.view || page.url.searchParams.get("view") || "login",
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

<main>
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
                            <VariantButton type="button"
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
    </div>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 100%;
    }

    .login-header {
        color: var(--primary-color);
        font-size: 2.5rem;
    }

    .sub-header {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .left {
        position: relative;
        overflow: hidden;
        border-right: 1px solid var(--border-color);
    }

    .right {
        padding: 5rem;
        display: flex;
        justify-content: center;
        align-items: center;
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

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .bg-images-container {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
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

    .error {
        color: var(--error-color);
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }
</style>
