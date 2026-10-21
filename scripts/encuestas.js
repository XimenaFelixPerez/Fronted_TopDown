(function () {
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fecha = (iso) => { const [a, m, d] = String(iso || "").split("-"); return a ? `${d} ${MES[Number(m) - 1]} ${a}` : ""; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let encuestas = [];
const listaEncuestas = document.getElementById("listaEncuestas");

function pintarEncuestas() {
    const respondidas = encuestas.filter((e) => e.respondida).length;
    const total = encuestas.length;

    document.getElementById("encRespondidas").textContent = respondidas;
    document.getElementById("encPendientes").textContent = encuestas.filter((e) => !e.respondida && !e.cerrada).length;
    document.getElementById("encParticipacion").textContent = total ? Math.round((respondidas / total) * 100) + "%" : "0%";

    listaEncuestas.innerHTML = total ? "" : `<p class="text-secondary">No hay encuestas disponibles por ahora.</p>`;

    encuestas.forEach((e) => {
        const item = document.createElement("div");
        item.className = "enc-card" + (e.respondida ? " hecha" : "");
        const estado = e.respondida
            ? `<span class="badge-status badge-autorizada">Respondida</span>`
            : e.cerrada
                ? `<span class="badge-status badge-pendiente">Cerrada</span>`
                : `<button class="btn btn-responder btn-sm text-white px-3">Responder (+${e.puntos} pts)</button>`;
        item.innerHTML = `
            <div class="enc-icono"><i class="bi ${e.respondida ? "bi-check2-circle" : "bi-clipboard2-check"}"></i></div>
            <div class="flex-grow-1">
                <div class="fw-semibold">${esc(e.titulo)}</div>
                <div class="text-secondary small">${esc(e.descripcion)}</div>
                <div class="enc-meta mt-1">${e.preguntas.length} preguntas · ${e.respondida ? "Respondida el " + fecha(e.respondida) : "Cierra " + fecha(e.cierre)}</div>
            </div>
            ${estado}`;
        const boton = item.querySelector(".btn-responder");
        if (boton) boton.addEventListener("click", () => abrirEncuesta(e));
        listaEncuestas.appendChild(item);
    });
}

async function cargarEncuestas() {
    try {
        encuestas = (await api("/encuestas")).encuestas;
        pintarEncuestas();
    } catch (e) {
        console.error(e);
        listaEncuestas.innerHTML = `<p class="text-danger">No se pudieron cargar las encuestas.</p>`;
    }
}

const modalEncuesta = new bootstrap.Modal(document.getElementById("modalEncuesta"));
const encPreguntas = document.getElementById("encPreguntas");
const encError = document.getElementById("encError");
const encBarra = document.getElementById("encBarra");
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

let encuestaActual = null;
let indice = 0;
let respuestas = {};

function htmlPregunta(p) {
    let campo = "";
    if (p.tipo === "escala") {
        campo = `<div class="enc-escala">` + [1, 2, 3, 4, 5].map((n) =>
            `<label><input type="radio" name="${p.id}" value="${n}"><span>${n}</span></label>`).join("") +
            `</div><div class="enc-escala-etq"><span>Muy mal</span><span>Excelente</span></div>`;
    } else if (p.tipo === "opcion") {
        campo = p.opciones.map((o) =>
            `<label class="enc-opcion"><input type="radio" name="${p.id}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("");
    } else if (p.tipo === "multiple") {
        campo = p.opciones.map((o) =>
            `<label class="enc-opcion multi"><input type="checkbox" name="${p.id}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("");
    } else {
        campo = `<textarea class="form-control" name="${p.id}" rows="4" maxlength="1000" placeholder="Escribe tu respuesta..."></textarea>`;
    }
    const opcional = p.obligatoria ? "" : ' <small class="text-secondary fw-normal">(opcional)</small>';
    return `<div class="enc-pregunta">${esc(p.texto)}${opcional}</div>${campo}`;
}

function leerRespuesta(p) {
    const campos = encPreguntas.querySelectorAll(`[name="${p.id}"]`);
    if (p.tipo === "texto") return campos[0].value.trim();
    if (p.tipo === "multiple") return [...campos].filter((c) => c.checked).map((c) => c.value);
    const marcado = [...campos].find((c) => c.checked);
    return marcado ? marcado.value : "";
}

function restaurar(p) {
    const v = respuestas[p.id];
    if (v === undefined) return;
    const campos = encPreguntas.querySelectorAll(`[name="${p.id}"]`);
    if (p.tipo === "texto") campos[0].value = v;
    else campos.forEach((c) => { c.checked = Array.isArray(v) ? v.includes(c.value) : c.value === v; });
}

const vacia = (v) => Array.isArray(v) ? v.length === 0 : v === "";

function mostrarError(texto) {
    encError.textContent = texto || "Esta pregunta es obligatoria.";
    encError.classList.remove("d-none");
}

function pintarPaso() {
    const total = encuestaActual.preguntas.length;
    const p = encuestaActual.preguntas[indice];

    encBarra.style.width = ((indice + 1) / total) * 100 + "%";
    document.getElementById("encPaso").textContent = `Pregunta ${indice + 1} de ${total}`;
    encPreguntas.innerHTML = htmlPregunta(p);
    restaurar(p);

    btnAnterior.classList.toggle("invisible", indice === 0);
    btnSiguiente.textContent = indice === total - 1 ? "Enviar respuestas" : "Siguiente";
    btnSiguiente.disabled = false;
    encError.classList.add("d-none");
}

function abrirEncuesta(e) {
    encuestaActual = e;
    indice = 0;
    respuestas = {};
    document.getElementById("encTitulo").textContent = e.titulo;
    pintarPaso();
    modalEncuesta.show();
}

btnAnterior.addEventListener("click", () => {
    const p = encuestaActual.preguntas[indice];
    respuestas[p.id] = leerRespuesta(p);
    indice--;
    pintarPaso();
});

btnSiguiente.addEventListener("click", async () => {
    const p = encuestaActual.preguntas[indice];
    const valor = leerRespuesta(p);

    if (p.obligatoria && vacia(valor)) return mostrarError();
    respuestas[p.id] = valor;

    if (indice < encuestaActual.preguntas.length - 1) {
        indice++;
        pintarPaso();
        return;
    }

    // Última pregunta: se guarda en la BD y se suman los puntos
    btnSiguiente.disabled = true;
    try {
        const r = await api(`/encuestas/${encuestaActual.id}/responder`, { method: "POST", body: { respuestas } });
        modalEncuesta.hide();
        await cargarEncuestas();
        window.dispatchEvent(new Event("puntos-actualizados"));
        if (r.puntos) alert(`¡Gracias por responder! Ganaste +${r.puntos} pts`);
    } catch (e) {
        mostrarError(e.mensaje);
        btnSiguiente.disabled = false;
    }
});

cargarEncuestas();
})();
