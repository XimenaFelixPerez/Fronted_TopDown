// Guardia de sesión: va en el <head> de TODAS las páginas internas.
// Si el servidor dice que no hay sesión, manda al login. El navegador no decide quién eres.
(function () {
    const API = `http://${location.hostname || "localhost"}:3000/api`;
    const MIN_SESION = 5;

    // Oculta la página hasta confirmar la sesión (evita que se vea un instante sin permiso)
    document.documentElement.style.visibility = "hidden";

    const alLogin = () => location.replace("index.html");

    const pintarUsuario = (u) => {
        const iniciales = String(u.nombre || "").split(/\s+/).filter(Boolean)
            .map((p) => p[0]).slice(0, 2).join("").toUpperCase();
        const avatar = document.querySelector(".sidebar .avatar-circle");
        if (avatar) {
            avatar.textContent = iniciales;
            const datos = avatar.nextElementSibling;
            if (datos && datos.children.length >= 2) {
                datos.children[0].textContent = u.nombre;
                datos.children[1].textContent = u.numero ? `Emp. ${u.numero}` : u.correo;
            }
        }
    };

    // Revisa cuando la sesión debería haber expirado; si ya no existe, manda al login
    const vigilar = () => setTimeout(async () => {
        try {
            const r = await fetch(`${API}/yo`, { credentials: "include" });
            if (r.status === 401) { alert("Tu sesión expiró. Vuelve a iniciar sesión."); return alLogin(); }
        } catch (e) { /* servidor caído: se revisa en la siguiente vuelta */ }
        vigilar();
    }, MIN_SESION * 60 * 1000 + 3000);

    fetch(`${API}/yo`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((u) => {
            window.USUARIO = u;
            document.documentElement.style.visibility = "";
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => pintarUsuario(u));
            } else {
                pintarUsuario(u);
            }
            vigilar();
        })
        .catch(alLogin);
})();
