const money = (n) => "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2 });

const servicios = [
    "Consulta de medicina general", "Hospitalización", "Cirugía", "Maternidad",
    "Medicamentos de cuadro básico", "Laboratorio y radiología", "Atención dental básica", "Pensiones y jubilaciones",
];

const movimientosAhorro = [
    { mes: "Ago 2026", empleado: 2400, empresa: 2400, acumulado: 28800 },
    { mes: "Jul 2026", empleado: 2400, empresa: 2400, acumulado: 26400 },
    { mes: "Jun 2026", empleado: 2400, empresa: 2400, acumulado: 24000 },
    { mes: "May 2026", empleado: 2400, empresa: 2400, acumulado: 21600 },
];

const saldoVacaciones = [
    { anio: 2026, asignados: 18, disfrutados: 6 },
    { anio: 2025, asignados: 16, disfrutados: 16 },
    { anio: 2024, asignados: 14, disfrutados: 14 },
    { anio: 2023, asignados: 12, disfrutados: 12 },
];

const historialVac = [
    { folio: "VAC-2026-0041", inicio: "10 Jul 2026", fin: "21 Jul 2026", dias: 8, estado: "Autorizada" },
    { folio: "VAC-2026-0022", inicio: "14 Mar 2026", fin: "19 Mar 2026", dias: 4, estado: "Autorizada" },
    { folio: "VAC-2025-0098", inicio: "20 Dic 2025", fin: "02 Ene 2026", dias: 8, estado: "Autorizada" },
];

let diasDisponibles = 12;
let folioSiguiente = 42;

const serviciosLista = document.getElementById("serviciosLista");
servicios.forEach((s) => {
    const col = document.createElement("div");
    col.className = "col-md-3 col-6";
    col.innerHTML = `<div class="servicio-chip"><span class="dot dot-active"></span> ${s}</div>`;
    serviciosLista.appendChild(col);
});

const ahorroBody = document.getElementById("ahorroBody");
movimientosAhorro.forEach((m) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td class="fw-semibold">${m.mes}</td>
        <td class="numero">${money(m.empleado)}</td>
        <td class="numero">${money(m.empresa)}</td>
        <td class="numero texto-portal">${money(m.acumulado)}</td>
    `;
    ahorroBody.appendChild(row);
});
document.getElementById("saldoTotal").textContent = money(movimientosAhorro[0].acumulado);

const saldoBody = document.getElementById("saldoBody");
const historialVacaciones = document.getElementById("historialVacaciones");
const infoDisponibles = document.getElementById("infoDisponibles");
const modalSaldo = document.getElementById("modalSaldo");

function renderSaldo() {
    saldoBody.innerHTML = "";
    saldoVacaciones.forEach((s) => {
        const disponibles = s.asignados - s.disfrutados;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="fw-semibold">${s.anio}</td>
            <td>${s.asignados}</td>
            <td>${s.disfrutados}</td>
            <td class="fw-semibold ${disponibles > 0 ? "texto-portal" : "text-secondary"}">${disponibles}</td>
        `;
        saldoBody.appendChild(row);
    });
    diasDisponibles = saldoVacaciones[0].asignados - saldoVacaciones[0].disfrutados;
    infoDisponibles.textContent = diasDisponibles;
    modalSaldo.textContent = diasDisponibles + " días";
}

function renderHistorial() {
    historialVacaciones.innerHTML = "";
    historialVac.forEach((h) => {
        const clase = h.estado === "Autorizada" ? "badge-autorizada" : "badge-pendiente";
        const item = document.createElement("div");
        item.className = "d-flex justify-content-between align-items-center px-4 py-3 border-top";
        item.innerHTML = `
            <div>
                <div class="folio numero">${h.folio}</div>
                <small>${h.inicio} — ${h.fin} · ${h.dias} días</small>
            </div>
            <span class="badge-status ${clase}">${h.estado}</span>
        `;
        historialVacaciones.appendChild(item);
    });
}

renderSaldo();
renderHistorial();

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const diasSol = document.getElementById("diasSol");
const diasFest = document.getElementById("diasFest");
const diasVac = document.getElementById("diasVac");
const mensajeError = document.getElementById("mensajeError");
const btnEnviar = document.getElementById("btnEnviar");
const comentarios = document.getElementById("comentarios");

const parseFecha = (valor) => {
    if (!valor) return null;
    const [y, m, d] = valor.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const claveFecha = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatoFecha = (d) =>
    `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;

const enesimoLunes = (anio, mes, n) => {
    const primero = new Date(anio, mes, 1);
    const desfase = (8 - primero.getDay()) % 7; 
    return new Date(anio, mes, 1 + desfase + (n - 1) * 7);
};

const festivosDe = (anio) => new Set([
    claveFecha(new Date(anio, 0, 1)),        
    claveFecha(enesimoLunes(anio, 1, 1)),    
    claveFecha(enesimoLunes(anio, 2, 3)),    
    claveFecha(new Date(anio, 4, 1)),        
    claveFecha(new Date(anio, 8, 16)),       
    claveFecha(enesimoLunes(anio, 10, 3)),   
    claveFecha(new Date(anio, 11, 25)),     
]);

function calcularDias(inicio, fin) {
    let solicitados = 0;
    let festivos = 0;
    const cacheFestivos = {};

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const dia = d.getDay();
        if (dia === 0 || dia === 6) continue; 
        solicitados++;

        const anio = d.getFullYear();
        if (!cacheFestivos[anio]) cacheFestivos[anio] = festivosDe(anio);
        if (cacheFestivos[anio].has(claveFecha(d))) festivos++;
    }
    return { solicitados, festivos, vacaciones: solicitados - festivos };
}

function mostrarError(texto) {
    mensajeError.textContent = texto;
    mensajeError.classList.toggle("d-none", !texto);
}

function actualizarCalculo() {
    const inicio = parseFecha(fechaInicio.value);
    const fin = parseFecha(fechaFin.value);

    diasSol.textContent = 0;
    diasFest.textContent = 0;
    diasVac.textContent = 0;
    btnEnviar.disabled = true;
    mostrarError("");

    if (!inicio || !fin) return;

    if (fin < inicio) {
        mostrarError("La fecha de regreso no puede ser anterior a la de inicio.");
        return;
    }

    const r = calcularDias(inicio, fin);
    diasSol.textContent = r.solicitados;
    diasFest.textContent = r.festivos;
    diasVac.textContent = r.vacaciones;

    if (r.vacaciones === 0) {
        mostrarError("El rango seleccionado no incluye días laborables a descontar.");
        return;
    }
    if (r.vacaciones > diasDisponibles) {
        mostrarError(`Solicitas ${r.vacaciones} días y solo tienes ${diasDisponibles} disponibles.`);
        return;
    }
    btnEnviar.disabled = false;
}

fechaInicio.addEventListener("change", () => {

    fechaFin.min = fechaInicio.value;
    actualizarCalculo();
});
fechaFin.addEventListener("change", actualizarCalculo);

document.getElementById("modalVacaciones").addEventListener("show.bs.modal", () => {
    fechaInicio.value = "";
    fechaFin.value = "";
    fechaFin.min = "";
    comentarios.value = "";
    modalSaldo.textContent = diasDisponibles + " días";
    actualizarCalculo();
});

btnEnviar.addEventListener("click", () => {
    const inicio = parseFecha(fechaInicio.value);
    const fin = parseFecha(fechaFin.value);
    const r = calcularDias(inicio, fin);

    historialVac.unshift({
        folio: `VAC-${inicio.getFullYear()}-${String(folioSiguiente++).padStart(4, "0")}`,
        inicio: formatoFecha(inicio),
        fin: formatoFecha(fin),
        dias: r.vacaciones,
        estado: "Pendiente",
    });
    if (historialVac.length > 5) historialVac.pop();

    renderHistorial();

    bootstrap.Modal.getInstance(document.getElementById("modalVacaciones")).hide();
});

