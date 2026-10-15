const COLOR_KEY = "kiosco-color";
const COLOR_DEFECTO = "#2b4bd6";
const TEMA_KEY = "kiosco-tema";

if (localStorage.getItem(TEMA_KEY) === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
}

document.addEventListener("DOMContentLoaded", () => {
    const btnTema = document.getElementById("btnTema");
    if (!btnTema) return;
    const html = document.documentElement;

    const pintarIcono = () => {
        const oscuro = html.getAttribute("data-bs-theme") === "dark";
        btnTema.classList.toggle("bi-moon", !oscuro);
        btnTema.classList.toggle("bi-sun", oscuro);
    };

    btnTema.addEventListener("click", () => {
        const oscuro = html.getAttribute("data-bs-theme") !== "dark";
        if (oscuro) html.setAttribute("data-bs-theme", "dark");
        else html.removeAttribute("data-bs-theme");
        localStorage.setItem(TEMA_KEY, oscuro ? "dark" : "light");
        pintarIcono();
    });

    pintarIcono();
});



const colorGuardado = localStorage.getItem(COLOR_KEY) || COLOR_DEFECTO;
document.documentElement.style.setProperty("--portal-color", colorGuardado);

document.addEventListener("DOMContentLoaded", () => {
    const colorDots = document.querySelectorAll(".color-dot");

    colorDots.forEach((dot) => {
        dot.classList.toggle("active", dot.dataset.color === colorGuardado);

        dot.addEventListener("click", () => {
            colorDots.forEach((d) => d.classList.remove("active"));
            dot.classList.add("active");

            const color = dot.dataset.color;
            document.documentElement.style.setProperty("--portal-color", color);
            localStorage.setItem(COLOR_KEY, color);
        });
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    var menu = document.querySelector(".sidebar .nav");
    if (!menu) return;
    try {
        var host = window.location.hostname || "localhost";
        var r = await fetch("http://" + host + ":3000/api/admin/yo", { credentials: "include" });
        var datos = await r.json();
        if (!datos.ok) return;
    } catch (e) { return; }

    var li = document.createElement("li");
    li.className = "nav-item";
    li.innerHTML = '<a href="admin.html" class="nav-link d-flex align-items-center gap-2">' +
                   '<i class="bi bi-pencil-square"></i> Administrar</a>';
    menu.appendChild(li);
});