(function () {
const $ = (id) => document.getElementById(id);
const money = (n) => "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fechaIso = (iso) => { const [a, m, d] = String(iso || "").split("-"); return a ? `${d} ${MESES[Number(m) - 1]} ${a}` : "—"; };
const set = (id, v) => { const el = $(id); if (el) el.textContent = v || "—"; };

/* ============================ IMSS ============================ */
const servicios = [
    "Consulta de medicina general", "Hospitalización", "Cirugía", "Maternidad",
    "Medicamentos de cuadro básico", "Laboratorio y radiología", "Atención dental básica", "Pensiones y jubilaciones",
];
$("serviciosLista").innerHTML = servicios.map((s) => `
    <div class="col-md-3 col-6"><div class="servicio-chip"><span class="dot dot-active"></span> ${s}</div></div>`).join("");

async function cargarDatos() {
    try {
        const [p, pr] = await Promise.all([api("/perfil"), api("/prestaciones")]);

        set("imssNss", p.nss);
        set("imssAfil", p.nss ? `${p.nss}-0001` : "");
        set("imssClinica", p.imss.clinica);
        set("imssCobertura", p.imss.cobertura);
        set("imssAlta", fechaIso(p.imss.alta));
        set("imssActualizacion", fechaIso(pr.imss.ultimaActualizacion));
        set("imssSalario", money(pr.imss.salarioBase));
        set("cuotaPatronal", money(pr.imss.cuotaPatronal));
        set("cuotaObrera", money(pr.imss.cuotaObrera));

        set("saldoTotal", money(pr.ahorro.saldo));
        set("aportEmp", money(pr.ahorro.aportacionEmpleado));
        set("aportEmpresa", money(pr.ahorro.aportacionEmpresa));
        $("ahorroBody").innerHTML = pr.ahorro.movimientos.length
            ? pr.ahorro.movimientos.map((m) => `
                <tr>
                    <td class="fw-semibold">${MESES[m.mes - 1]} ${m.anio}</td>
                    <td class="numero">${money(m.empleado)}</td>
                    <td class="numero">${money(m.empresa)}</td>
                    <td class="numero texto-portal">${money(m.acumulado)}</td>
                </tr>`).join("")
            : `<tr><td colspan="4" class="text-center text-secondary py-4">Sin movimientos</td></tr>`;

        set("vacEmpresa", p.empresa);
        set("vacEmpleado", p.nombre);
        set("vacIngreso", fechaIso(p.ingreso));
        set("vacSupervisor", p.supervisor);
    } catch (e) {
        console.error(e);
        if (e.status === 401) location.href = "index.html";
    }
}

/* ============================ VACACIONES ============================ */
const saldoBody = $("saldoBody");
const historialVacaciones = $("historialVacaciones");
const infoDisponibles = $("infoDisponibles");
const modalSaldo = $("modalSaldo");
const btnSolicitar = $("btnSolicitar");

let diasDisponibles = 0;

const COLOR_ESTADO = {
    Autorizada: 'class="badge-status badge-autorizada"',
    Pendiente: 'class="badge-status badge-pendiente"',
    Rechazada: 'class="badge-status" style="background:#fde2e1;color:#b42318"',
};

async function cargarVacaciones() {
    try {
        const v = await api("/vacaciones");

        diasDisponibles = v.actual.disponibles;
        infoDisponibles.textContent = diasDisponibles;
        modalSaldo.textContent = diasDisponibles + " días";

        saldoBody.innerHTML = v.periodos.length
            ? v.periodos.map((s) => `
                <tr>
                    <td class="fw-semibold">${s.anio}</td>
                    <td>${s.asignados}</td>
                    <td>${s.disfrutados}</td>
                    <td class="fw-semibold ${s.disponibles > 0 ? "texto-portal" : "text-secondary"}">
                        ${s.disponibles}${s.pendientes ? ` <small class="text-secondary fw-normal">(${s.pendientes} en trámite)</small>` : ""}
                    </td>
                </tr>`).join("")
            : `<tr><td colspan="4" class="text-center text-secondary py-4">Aún no tienes periodos de vacaciones</td></tr>`;

        historialVacaciones.innerHTML = v.historial.length
            ? v.historial.map((h) => `
                <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top">
                    <div>
                        <div class="folio numero">${esc(h.folio)}</div>
                        <small>${fechaIso(h.inicio)} — ${fechaIso(h.fin)} · ${h.dias} días</small>
                        ${h.estado === "Rechazada" && h.motivo ? `<div class="small text-danger">Motivo: ${esc(h.motivo)}</div>` : ""}
                    </div>
                    <span ${COLOR_ESTADO[h.estado] || COLOR_ESTADO.Pendiente}>${esc(h.estado)}</span>
                </div>`).join("")
            : `<div class="px-4 py-3 border-top text-secondary small">Aún no has solicitado vacaciones</div>`;

        // El administrador no envía solicitudes: las evalúa en Administrar
        if (!v.puedeSolicitar) {
            btnSolicitar.disabled = true;
            btnSolicitar.textContent = "Las solicitudes se evalúan en Administrar";
        }
    } catch (e) {
        console.error(e);
    }
}

/* ---------- Cálculo de días (vista previa; el servidor lo vuelve a calcular) ---------- */
const fechaInicio = $("fechaInicio");
const fechaFin = $("fechaFin");
const diasSol = $("diasSol");
const diasFest = $("diasFest");
const diasVac = $("diasVac");
const mensajeError = $("mensajeError");
const btnEnviar = $("btnEnviar");
const comentarios = $("comentarios");

const parseFecha = (valor) => {
    if (!valor) return null;
    const [y, m, d] = valor.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const claveFecha = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
    if (inicio.getFullYear() === new Date().getFullYear() && r.vacaciones > diasDisponibles) {
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

$("modalVacaciones").addEventListener("show.bs.modal", () => {
    const hoy = claveFecha(new Date());
    fechaInicio.value = "";
    fechaFin.value = "";
    fechaInicio.min = hoy;
    fechaFin.min = hoy;
    comentarios.value = "";
    modalSaldo.textContent = diasDisponibles + " días";
    actualizarCalculo();
});

btnEnviar.addEventListener("click", async () => {
    btnEnviar.disabled = true;
    try {
        const r = await api("/vacaciones", {
            method: "POST",
            body: { inicio: fechaInicio.value, fin: fechaFin.value, comentario: comentarios.value.trim() },
        });
        bootstrap.Modal.getInstance($("modalVacaciones")).hide();
        await cargarVacaciones();
        alert(`Solicitud ${r.folio} enviada (${r.dias} días). Recursos Humanos la revisará y te llegará una notificación.`);
    } catch (e) {
        mostrarError(e.mensaje || "No se pudo enviar la solicitud.");
        btnEnviar.disabled = false;
    }
});

cargarDatos();
cargarVacaciones();
})();
