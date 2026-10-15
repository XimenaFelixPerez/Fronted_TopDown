(function () {
const encuestas = [
    {
        id: "clima",
        titulo: "Encuesta de clima laboral",
        descripcion: "Cuéntanos cómo te sientes en tu día a día.",
        cierre: "20 Sep 2026",
        preguntas: [
            { id: "p1", tipo: "escala", texto: "¿Qué tan satisfecho estás con tu ambiente de trabajo?", obligatoria: true },
            { id: "p2", tipo: "opcion", texto: "¿Cómo describirías la comunicación con tu líder?", obligatoria: true,
              opciones: ["Excelente", "Buena", "Regular", "Mala"] },
            { id: "p3", tipo: "multiple", texto: "¿Qué aspectos mejorarías? (puedes elegir varios)", obligatoria: false,
              opciones: ["Horarios", "Herramientas", "Capacitación", "Reconocimiento", "Espacios de trabajo"] },
            { id: "p4", tipo: "texto", texto: "¿Algún comentario o sugerencia?", obligatoria: false },
        ],
    },
    {
        id: "capacitacion",
        titulo: "Evaluación de capacitación",
        descripcion: "Ayúdanos a mejorar los cursos internos.",
        cierre: "30 Sep 2026",
        preguntas: [
            { id: "p1", tipo: "escala", texto: "¿Qué tan útil fue el curso para tu trabajo?", obligatoria: true },
            { id: "p2", tipo: "opcion", texto: "¿La duración del curso fue adecuada?", obligatoria: true,
              opciones: ["Muy corta", "Adecuada", "Muy larga"] },
            { id: "p3", tipo: "texto", texto: "¿Qué tema te gustaría aprender?", obligatoria: false },
        ],
    },
];

const CLAVE = "encuestasRespondidas";

function leerGuardadas() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; }
    catch (e) { return {}; }
}
function guardarRespuestas(id, datos) {
    const todas = leerGuardadas();
    todas[id] = datos;
    try { localStorage.setItem(CLAVE, JSON.stringify(todas)); } catch (e) {}
}

const listaEncuestas = document.getElementById("listaEncuestas");

function pintarEncuestas() {
    const guardadas = leerGuardadas();
    const respondidas = encuestas.filter((e) => guardadas[e.id]).length;

    document.getElementById("encRespondidas").textContent = respondidas;
    document.getElementById("encPendientes").textContent = encuestas.length - respondidas;
    document.getElementById("encParticipacion").textContent =
        Math.round((respondidas / encuestas.length) * 100) + "%";

    listaEncuestas.innerHTML = "";
    encuestas.forEach((e) => {
        const hecha = guardadas[e.id];
        const item = document.createElement("div");
        item.className = "enc-card" + (hecha ? " hecha" : "");
        item.innerHTML = `
            <div class="enc-icono"><i class="bi ${hecha ? "bi-check2-circle" : "bi-clipboard2-check"}"></i></div>
            <div class="flex-grow-1">
                <div class="fw-semibold">${e.titulo}</div>
                <div class="text-secondary small">${e.descripcion}</div>
                <div class="enc-meta mt-1">${e.preguntas.length} preguntas · Cierra ${e.cierre}</div>
            </div>
            ${hecha
                ? `<span class="badge-status badge-autorizada">Respondida</span>`
                : `<button class="btn btn-responder btn-sm text-white px-3">Responder</button>`}
        `;
        const boton = item.querySelector(".btn-responder");
        if (boton) boton.addEventListener("click", () => abrirEncuesta(e));
        listaEncuestas.appendChild(item);
    });
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
            `<label class="enc-opcion"><input type="radio" name="${p.id}" value="${o}"><span>${o}</span></label>`).join("");
    } else if (p.tipo === "multiple") {
        campo = p.opciones.map((o) =>
            `<label class="enc-opcion multi"><input type="checkbox" name="${p.id}" value="${o}"><span>${o}</span></label>`).join("");
    } else {
        campo = `<textarea class="form-control" name="${p.id}" rows="4" placeholder="Escribe tu respuesta..."></textarea>`;
    }

    const opcional = p.obligatoria ? "" : ' <small class="text-secondary fw-normal">(opcional)</small>';
    return `<div class="enc-pregunta">${p.texto}${opcional}</div>${campo}`;
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

function pintarPaso() {
    const total = encuestaActual.preguntas.length;
    const p = encuestaActual.preguntas[indice];

    encBarra.style.width = ((indice + 1) / total) * 100 + "%";
    document.getElementById("encPaso").textContent = `Pregunta ${indice + 1} de ${total}`;
    encPreguntas.innerHTML = htmlPregunta(p);
    restaurar(p);

    btnAnterior.classList.toggle("invisible", indice === 0);
    btnSiguiente.textContent = indice === total - 1 ? "Enviar respuestas" : "Siguiente";
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

btnSiguiente.addEventListener("click", () => {
    const p = encuestaActual.preguntas[indice];
    const valor = leerRespuesta(p);

    if (p.obligatoria && vacia(valor)) {
        encError.classList.remove("d-none");
        return;
    }
    respuestas[p.id] = valor;

    if (indice < encuestaActual.preguntas.length - 1) {
        indice++;
        pintarPaso();
        return;
    }

    guardarRespuestas(encuestaActual.id, { fecha: new Date().toISOString(), respuestas });
    modalEncuesta.hide();
    pintarEncuestas();
});

pintarEncuestas();
})();