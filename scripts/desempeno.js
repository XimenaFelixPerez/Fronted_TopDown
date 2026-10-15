const puntosTotales = 1740;

const niveles = [
    { nombre: "Nuevo Ingreso",        min: 0 },
    { nombre: "Colaborador",          min: 500 },
    { nombre: "Colaborador Destacado", min: 1000 },
    { nombre: "Colaborador Pro",      min: 1500 },
    { nombre: "Líder Eslabón",        min: 2000 },
    { nombre: "Embajador Eslabón",    min: 3000 },
];

const historial = [
    { concepto: "Encuesta de clima laboral respondida", fecha: "15 Jul 2026", puntos: 50 },
    { concepto: "Participación en evento Q2",           fecha: "28 Jun 2026", puntos: 80 },
    { concepto: "Evaluación de capacitación respondida", fecha: "15 Jun 2026", puntos: 50 },
    { concepto: "Encuesta de satisfacción Q1",          fecha: "31 Mar 2026", puntos: 50 },
    { concepto: "Participación en evento Q1",           fecha: "15 Feb 2026", puntos: 80 },
];

const formasDeGanar = [
    { titulo: "Responder una encuesta", puntos: 50 },
    { titulo: "Participar en un evento", puntos: 80 },
    { titulo: "Completar un curso", puntos: 100 },
    { titulo: "Enviar felicitación", puntos: 10 },
];

let indiceNivel = 0;
niveles.forEach((n, i) => { if (puntosTotales >= n.min) indiceNivel = i; });

const nivelActual = niveles[indiceNivel];
const siguiente = niveles[indiceNivel + 1] || null;

document.getElementById("nivelNombre").textContent = nivelActual.nombre;
document.getElementById("nivelNumero").textContent = `Nivel ${indiceNivel + 1} de ${niveles.length}`;

if (siguiente) {
    const porcentaje = Math.round((puntosTotales / siguiente.min) * 100);
    document.getElementById("barraNivel").style.width = porcentaje + "%";
    document.getElementById("progresoTexto").textContent = `${puntosTotales} / ${siguiente.min} pts (${porcentaje}%)`;
    document.getElementById("siguienteNombre").textContent = siguiente.nombre;
    document.getElementById("ptsFaltantes").textContent = `${siguiente.min - puntosTotales} pts necesarios`;
} else {
    document.getElementById("barraNivel").style.width = "100%";
    document.getElementById("progresoTexto").textContent = `${puntosTotales} pts`;
    document.getElementById("siguienteNombre").textContent = "Nivel máximo alcanzado";
    document.getElementById("ptsFaltantes").textContent = "";
}

const historialPuntos = document.getElementById("historialPuntos");

historial.forEach((h) => {
    const fila = document.createElement("div");
    fila.className = "d-flex justify-content-between align-items-center px-4 py-3 border-bottom";
    fila.innerHTML = `
        <div>
            <div>${h.concepto}</div>
            <small class="text-secondary">${h.fecha}</small>
        </div>
        <span class="fw-semibold texto-portal numero">+${h.puntos} pts</span>
    `;
    historialPuntos.appendChild(fila);
});

document.getElementById("totalPuntos").textContent = `${puntosTotales} pts`;

const formasPuntos = document.getElementById("formasPuntos");

formasDeGanar.forEach((f) => {
    const col = document.createElement("div");
    col.className = "col-md-3 col-6";
    col.innerHTML = `
        <div class="forma-card">
            <div>${f.titulo}</div>
            <div class="fw-bold fs-5 texto-portal mt-2">+${f.puntos} pts</div>
        </div>
    `;
    formasPuntos.appendChild(col);
});

const encuestas = [
    { titulo: "Encuesta de satisfacción laboral", descripcion: "Comparte cómo te has sentido en el trabajo este trimestre. Anónima y tarda 5 minutos.", estado: "Pendiente", vence: "31 Ago 2026", preguntas: 10, puntos: 50 },
    { titulo: "Encuesta de clima organizacional", descripcion: "Tu perspectiva sobre el ambiente de trabajo y la comunicación interna.", estado: "Pendiente", vence: "20 Sep 2026", preguntas: 8, puntos: 50 },
    { titulo: "Evaluación del programa de capacitación", descripcion: "Retroalimentación sobre los cursos del segundo trimestre.", estado: "Respondida", preguntas: 6, puntos: 50 },
    { titulo: "Encuesta de eventos internos Q2", descripcion: "Evaluación del evento de integración de junio 2026.", estado: "Respondida", preguntas: 5, puntos: 50 },
];

const listaEncuestas = document.getElementById("listaEncuestas");

function renderEncuestas() {
    listaEncuestas.innerHTML = "";

    encuestas.forEach((e) => {
        const respondida = e.estado === "Respondida";
        const card = document.createElement("div");
        card.className = "panel mb-3 d-flex justify-content-between align-items-start gap-3";
        card.innerHTML = `
            <div>
                <div class="d-flex align-items-center gap-3 mb-2 small">
                    <span class="badge-status ${respondida ? "badge-autorizada" : "badge-pendiente"}">${e.estado}</span>
                    <span class="text-secondary">${respondida ? "Completada" : "Vence: " + e.vence}</span>
                    <span class="text-secondary">${e.preguntas} preguntas</span>
                </div>
                <div class="fw-semibold mb-1">${e.titulo}</div>
                <div class="text-secondary">${e.descripcion}</div>
            </div>
            ${respondida ? "" : `<button class="btn btn-primary btn-responder text-nowrap">Responder (+${e.puntos} pts)</button>`}
        `;

        const boton = card.querySelector(".btn-responder");
        if (boton) {
            boton.addEventListener("click", () => {
                e.estado = "Respondida";
                renderEncuestas();
            });
        }
        listaEncuestas.appendChild(card);
    });

    const respondidas = encuestas.filter((e) => e.estado === "Respondida").length;
    document.getElementById("encRespondidas").textContent = respondidas;
    document.getElementById("encPendientes").textContent = encuestas.length - respondidas;
    document.getElementById("encParticipacion").textContent =
        Math.round((respondidas / encuestas.length) * 100) + "%";
}

renderEncuestas();