// Fechas especiales iniciales: comunidad-admin.js las usa para sembrar la pestaña de fechas
const fechasEspeciales = [
    { titulo: "Aniversario de la empresa", fecha: "15 Sep 2026", texto: "12 años de Desarrollo Eslabón. Celebramos juntos." },
    { titulo: "Día de la Independencia",   fecha: "16 Sep 2026", texto: "Día de descanso oficial. Que disfrutes el día." },
    { titulo: "Evento de integración Q3",  fecha: "13 Sep 2026", texto: "Evento presencial. Confirma tu asistencia antes del 5 de septiembre." },
    { titulo: "Cierre de nómina Sep",      fecha: "25 Sep 2026", texto: "Fecha límite de captura de incidencias." },
];

(function () {
const $ = (id) => document.getElementById(id);
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fechaBonita = (iso) => { const [a, m, d] = String(iso || "").slice(0, 10).split("-"); return a ? `${d} ${MES[Number(m) - 1]} ${a}` : ""; };
const iniciales = (n) => String(n || "").split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const corto = (n) => String(n || "").split(/\s+/).slice(0, 2).join(" ");

const cuando = (min) => {
    if (min < 1) return "Ahora";
    if (min < 60) return `Hace ${min} min`;
    if (min < 1440) return `Hace ${Math.floor(min / 60)} h`;
    const d = Math.floor(min / 1440);
    return d === 1 ? "Ayer" : `Hace ${d} días`;
};

const CLASE_CATEGORIA = {
    "Comunicado": "tag-comunicado",
    "Evento": "tag-evento",
    "Reconocimiento": "tag-reconocimiento",
    "Capacitación": "tag-capacitacion-rosa",
    "Beneficio": "tag-beneficio",
};

/* ============================ CUMPLEAÑOS Y FELICITACIONES ============================ */
const modalFel = new bootstrap.Modal($("modalFelicitacion"));
const destinatario = $("destinatario");
const mensajeFel = $("mensajeFel");
const btnEnviarFel = $("btnEnviarFel");
const muro = $("muroFelicitaciones");
let datos = { cumpleHoy: [], proximos: [], companeros: [], felicitaciones: [] };

function abrirFelicitar(id) {
    if (!datos.companeros.length) return alert("No hay compañeros a quién felicitar.");
    destinatario.value = String(id || destinatario.options[0].value);
    mensajeFel.value = "";
    btnEnviarFel.disabled = true;
    modalFel.show();
}

mensajeFel.addEventListener("input", () => {
    btnEnviarFel.disabled = mensajeFel.value.trim() === "";
});

btnEnviarFel.addEventListener("click", async () => {
    btnEnviarFel.disabled = true;
    try {
        const r = await api("/felicitaciones", {
            method: "POST",
            body: { para: Number(destinatario.value), mensaje: mensajeFel.value.trim() },
        });
        modalFel.hide();
        await cargarComunidad();
        avisoMuro(r.puntos ? `¡Felicitación enviada! Ganaste +${r.puntos} pts` : "¡Felicitación enviada!");
    } catch (e) {
        alert(e.mensaje || "No se pudo enviar la felicitación.");
        btnEnviarFel.disabled = false;
    }
});

function avisoMuro(texto) {
    const a = document.createElement("div");
    a.className = "alert alert-success py-2 small";
    a.textContent = texto;
    muro.before(a);
    setTimeout(() => a.remove(), 4000);
}

$("btnNuevaFel").addEventListener("click", () => abrirFelicitar());

function pintarBanner() {
    const hoy = datos.cumpleHoy;
    const btn = $("btnFelicitarHoy");
    const banner = btn.closest(".banner-cumple");
    const etiqueta = banner.querySelector("small");

    if (hoy.length) {
        const nombres = hoy.map((p) => p.esYo ? "¡Tú!" : corto(p.nombre));
        const soyYo = hoy.length === 1 && hoy[0].esYo;
        etiqueta.textContent = "Hoy celebramos";
        $("cumpleHoyTitulo").textContent = soyYo
            ? "¡Feliz cumpleaños! 🎂"
            : `${nombres.join(" y ")} cumple${hoy.length > 1 ? "n" : ""} años hoy`;
        $("cumpleHoyDepto").textContent = hoy.map((p) => p.depto).filter(Boolean).join(" · ");
        const aQuien = hoy.find((p) => !p.esYo);
        btn.classList.toggle("d-none", !aQuien);
        btn.onclick = () => abrirFelicitar(aQuien?.id);
    } else if (datos.proximos.length) {
        const p = datos.proximos[0];
        etiqueta.textContent = "Próximo cumpleaños";
        $("cumpleHoyTitulo").textContent = `${p.esYo ? "¡El tuyo!" : corto(p.nombre)} en ${p.dias} día${p.dias === 1 ? "" : "s"}`;
        $("cumpleHoyDepto").textContent = p.depto;
        btn.classList.toggle("d-none", p.esYo);
        btn.onclick = () => abrirFelicitar(p.id);
    } else {
        etiqueta.textContent = "Cumpleaños";
        $("cumpleHoyTitulo").textContent = "Sin cumpleaños próximos";
        $("cumpleHoyDepto").textContent = "";
        btn.classList.add("d-none");
    }
}

function pintarProximos() {
    const cont = $("proximosCumples");
    cont.innerHTML = datos.proximos.length ? "" : `<p class="text-secondary">No hay cumpleaños próximos registrados.</p>`;
    datos.proximos.forEach((p) => {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML = `
            <div class="panel">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="avatar-circle avatar-lg">${esc(iniciales(p.nombre))}</div>
                    <div>
                        <div class="fw-semibold">${esc(corto(p.nombre))}${p.esYo ? ' <small class="text-secondary">(tú)</small>' : ""}</div>
                        <small class="text-secondary">${esc(p.depto)}</small>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="pill-dias">${p.dias === 1 ? "Mañana" : `En ${p.dias} días`}</span>
                    ${p.esYo ? "" : `<button class="btn btn-link btn-sm p-0 enlace-portal">Felicitar</button>`}
                </div>
            </div>`;
        col.querySelector("button")?.addEventListener("click", () => abrirFelicitar(p.id));
        cont.appendChild(col);
    });
}

function pintarMuro() {
    muro.innerHTML = datos.felicitaciones.length ? "" : `<p class="text-secondary">Aún no hay felicitaciones. ¡Sé el primero!</p>`;
    datos.felicitaciones.forEach((f) => {
        const card = document.createElement("div");
        card.className = "panel mb-3";
        card.innerHTML = `
            <div class="d-flex align-items-center gap-2 mb-2">
                <div class="avatar-circle avatar-sm">${esc(iniciales(f.de))}</div>
                <span class="small fw-semibold">${esc(corto(f.de))}${f.mia ? " (tú)" : ""} → ${esc(corto(f.para))}</span>
                <small class="text-secondary">· ${cuando(f.minutos)}</small>
            </div>
            <div class="text-secondary">${esc(f.mensaje)}</div>`;
        muro.appendChild(card);
    });
}

async function cargarComunidad() {
    try {
        datos = await api("/comunidad");
        destinatario.innerHTML = "";
        datos.companeros.forEach((c) => destinatario.add(new Option(`${c.nombre}${c.depto ? " — " + c.depto : ""}`, c.id)));
        pintarBanner();
        pintarProximos();
        pintarMuro();
    } catch (e) {
        console.error(e);
        if (e.status === 401) location.href = "index.html";
    }
}

/* ============================ NOTICIAS (desde la BD) ============================ */
const listaNoticias = $("listaNoticias");
let noticias = [];
const abiertas = new Set();

function renderNoticias() {
    listaNoticias.innerHTML = noticias.length ? "" : `<p class="text-secondary">No hay noticias publicadas.</p>`;
    noticias.forEach((n) => {
        const abierta = abiertas.has(n.id);
        const card = document.createElement("div");
        card.className = "panel mb-3";
        card.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <span class="tag-doc ${CLASE_CATEGORIA[n.categoria] || "tag-comunicado"}">${esc(n.categoria || "Comunicado")}</span>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${esc(n.titulo)}</div>
                    ${n.resumen ? `<small class="text-secondary">${esc(n.resumen)}</small>` : ""}
                </div>
                <small class="text-secondary numero text-nowrap">${fechaBonita(n.fecha)}</small>
                ${n.contenido ? `<button class="btn btn-link btn-sm p-0 enlace-portal">${abierta ? "Cerrar" : "Leer"}</button>` : ""}
            </div>
            ${abierta && n.contenido ? `<p class="text-secondary mt-3 mb-0" style="white-space:pre-line">${esc(n.contenido)}</p>` : ""}`;
        card.querySelector("button")?.addEventListener("click", () => {
            abierta ? abiertas.delete(n.id) : abiertas.add(n.id);
            renderNoticias();
        });
        listaNoticias.appendChild(card);
    });
}

async function cargarNoticias() {
    try {
        noticias = await api("/noticias");
        if (noticias[0]) abiertas.add(noticias[0].id);
        renderNoticias();
    } catch (e) {
        console.error("No se pudieron cargar las noticias:", e);
        listaNoticias.innerHTML = `<p class="text-danger">No se pudieron cargar las noticias.</p>`;
    }
}

cargarComunidad();
cargarNoticias();
})();
