const empresa = {
    nombre: "Desarrollo Eslabón S.A. de C.V.",
    rfc: "DES190801AB3",
    domicilio: "Domicilio fiscal de la empresa",
    regPatronal: "Y45-83721-12",
};

const empleado = {
    numero: "00124",
    nombre: "Carlos Mendoza Castillo",
    curp: "MECC890412HDFRRL09",
    rfc: "MECC890412AB3",
    nss: "54321098765",
    puesto: "Desarrollador Sr.",
    categoria: "Tecnología",
    ingreso: "15 Mar 2021",
    banco: "Por definir",
    cuenta: "Por definir",
};

const recibos = [
    { folio: "00124-2026-08", periodo: "Agosto 2026", fecha: "01 Sep 2026", sueldo: 45000, bono: 3000, imss: 1500, isr: 3000, infonavit: 660 },
    { folio: "00124-2026-07", periodo: "Julio 2026",  fecha: "01 Ago 2026", sueldo: 45000, bono: 3000, imss: 1500, isr: 3000, infonavit: 660 },
    { folio: "00124-2026-06", periodo: "Junio 2026",  fecha: "01 Jul 2026", sueldo: 45000, bono: 3000, imss: 1500, isr: 3000, infonavit: 660 },
    { folio: "00124-2026-05", periodo: "Mayo 2026",   fecha: "01 Jun 2026", sueldo: 46000, bono: 0,    imss: 1500, isr: 2800, infonavit: 700 },
    { folio: "00124-2026-04", periodo: "Abril 2026",  fecha: "01 May 2026", sueldo: 46000, bono: 0,    imss: 1500, isr: 2800, infonavit: 700 },
    { folio: "00124-2026-03", periodo: "Marzo 2026",  fecha: "01 Abr 2026", sueldo: 46000, bono: 0,    imss: 1500, isr: 2800, infonavit: 700 },
].map((r) => {
    r.percepciones = r.sueldo + r.bono;
    r.deducciones = r.imss + r.isr + r.infonavit;
    r.neto = r.percepciones - r.deducciones;
    return r;
});

const money = (n) => "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2 });

const recibosBody = document.getElementById("recibosBody");
const historialLista = document.getElementById("historialLista");
const historialDetalle = document.getElementById("historialDetalle");
const volverHistorial = document.getElementById("volverHistorial");
const detPeriodo = document.getElementById("detPeriodo");
const detFecha = document.getElementById("detFecha");

const modalPreview = new bootstrap.Modal(document.getElementById("modalPreview"));
let reciboActual = recibos[0];

function filaConcepto(nombre, monto, cantidad = "", precio = "") {
    return `<tr>
        <td>${nombre}</td>
        <td class="der">${cantidad}</td>
        <td class="der">${precio}</td>
        <td class="der">${monto > 0 ? money(monto) : ""}</td>
    </tr>`;
}

function construirRecibo(r) {
    const percepciones = [
        filaConcepto("Sueldo base", r.sueldo, "30", money(r.sueldo / 30)),
        r.bono > 0 ? filaConcepto("Bono de productividad", r.bono) : "",
    ].join("");

    const deducciones = [
        filaConcepto("Retención del seguro social (IMSS)", r.imss),
        filaConcepto("Retención por ISR", r.isr),
        filaConcepto("Crédito INFONAVIT", r.infonavit),
    ].join("");

    return `
        <div class="rn-titulo"><span>RECIBO DE NÓMINA</span><span>${r.folio}</span></div>

        <table class="rn-cab">
            <thead><tr><th>NOMBRE DE LA EMPRESA</th><th>TRABAJADOR</th></tr></thead>
            <tbody><tr>
                <td>
                    Nombre: ${empresa.nombre}<br>
                    Domicilio: ${empresa.domicilio}<br>
                    RFC: ${empresa.rfc}<br>
                    Registro patronal: ${empresa.regPatronal}
                </td>
                <td>
                    Nombre: ${empleado.nombre}<br>
                    CURP: ${empleado.curp}<br>
                    RFC: ${empleado.rfc}<br>
                    Núm. afiliación al IMSS: ${empleado.nss}<br>
                    Puesto: ${empleado.puesto}<br>
                    Fecha de antigüedad: ${empleado.ingreso}
                </td>
            </tr></tbody>
        </table>

        <table class="rn-periodo"><tr>
            <td>Periodo de liquidación: <b>${r.periodo}</b></td>
            <td>Fecha de pago: <b>${r.fecha}</b></td>
            <td class="text-end">Total días: 30</td>
        </tr></table>

        <table class="rn-conceptos">
            <tr class="rn-sec"><th>PERCEPCIONES</th><th class="der">CANTIDAD</th><th class="der">PRECIO</th><th class="der">TOTALES</th></tr>
            <tr><td class="sub" colspan="4">Percepciones salariales:</td></tr>
            ${percepciones}
            <tr class="rn-total"><td colspan="3">TOTAL DEVENGADO</td><td class="der">${money(r.percepciones)}</td></tr>

            <tr class="rn-sec"><th colspan="3">DEDUCCIONES</th><th class="der">TOTALES</th></tr>
            <tr><td class="sub" colspan="4">Retención a cuenta de impuestos:</td></tr>
            ${deducciones}
            <tr class="rn-total"><td colspan="3">TOTAL A DEDUCIR</td><td class="der">${money(r.deducciones)}</td></tr>

            <tr class="rn-neto"><td colspan="3">SUELDO NETO A PAGAR</td><td class="der">${money(r.neto)}</td></tr>
        </table>

        <div class="rn-pie">
            <div>
                Fecha de ingreso a la nómina: ${empleado.ingreso}<br>
                Entidad financiera: ${empleado.banco}<br>
                Número de cuenta: ${empleado.cuenta}
            </div>
            <div class="rn-firma">Firma del trabajador</div>
        </div>
    `;
}

function abrirPreview(recibo) {
    reciboActual = recibo;
    document.getElementById("reciboPreview").innerHTML = construirRecibo(recibo);
    modalPreview.show();
}

const esc = (t) => String(t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function construirXml(r) {
    const linea = (tag, clave, concepto, importe) =>
        `    <${tag} Clave="${clave}" Concepto="${esc(concepto)}" Importe="${importe.toFixed(2)}"/>`;

    const percepciones = [linea("Percepcion", "001", "Sueldo base", r.sueldo)];
    if (r.bono > 0) percepciones.push(linea("Percepcion", "010", "Bono de productividad", r.bono));

    const deducciones = [
        linea("Deduccion", "001", "IMSS", r.imss),
        linea("Deduccion", "002", "ISR", r.isr),
        linea("Deduccion", "003", "INFONAVIT", r.infonavit),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<ReciboNomina Folio="${esc(r.folio)}" Periodo="${esc(r.periodo)}" FechaPago="${esc(r.fecha)}">
  <Emisor Nombre="${esc(empresa.nombre)}" Rfc="${esc(empresa.rfc)}" RegistroPatronal="${esc(empresa.regPatronal)}"/>
  <Receptor Numero="${esc(empleado.numero)}" Nombre="${esc(empleado.nombre)}" Rfc="${esc(empleado.rfc)}" Curp="${esc(empleado.curp)}" Nss="${esc(empleado.nss)}" Puesto="${esc(empleado.puesto)}" FechaIngreso="${esc(empleado.ingreso)}"/>
  <Percepciones Total="${r.percepciones.toFixed(2)}">
${percepciones.join("\n")}
  </Percepciones>
  <Deducciones Total="${r.deducciones.toFixed(2)}">
${deducciones.join("\n")}
  </Deducciones>
  <Neto Importe="${r.neto.toFixed(2)}"/>
</ReciboNomina>
`;
}

function descargarXml(r) {
    const blob = new Blob([construirXml(r)], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recibo-nomina-${r.folio}.xml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

recibos.forEach((r) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td class="fw-semibold">${r.periodo}</td>
        <td class="numero">${money(r.percepciones)}</td>
        <td class="text-danger numero">-${money(r.deducciones)}</td>
        <td class="fw-semibold numero">${money(r.neto)}</td>
        <td class="numero">${r.fecha}</td>
        <td class="text-end">
            <button class="btn btn-outline-primary btn-sm btn-descargar ver-recibo">Ver</button>
            <button class="btn btn-outline-primary btn-sm btn-descargar descargar-recibo" title="Vista previa y descarga"><i class="bi bi-download"></i></button>
        </td>
    `;

    row.querySelector(".ver-recibo").addEventListener("click", (e) => {
        e.preventDefault();
        reciboActual = r;
        detPeriodo.textContent = r.periodo;
        detFecha.textContent = r.fecha;
        historialLista.classList.add("d-none");
        historialDetalle.classList.remove("d-none");
    });

    row.querySelector(".descargar-recibo").addEventListener("click", (e) => {
        e.preventDefault();
        abrirPreview(r);
    });

    recibosBody.appendChild(row);
});

volverHistorial.addEventListener("click", (e) => {
    e.preventDefault();
    historialDetalle.classList.add("d-none");
    historialLista.classList.remove("d-none");
});

document.getElementById("btnPdf").addEventListener("click", () => abrirPreview(reciboActual));
document.getElementById("btnImprimir").addEventListener("click", () => abrirPreview(reciboActual));
document.getElementById("btnXml").addEventListener("click", () => descargarXml(reciboActual));
document.getElementById("btnDescargarXml").addEventListener("click", () => descargarXml(reciboActual));

document.getElementById("btnDescargar").addEventListener("click", () => {
    const tituloOriginal = document.title;
    document.title = "Recibo nomina " + reciboActual.folio;
    window.print();
    document.title = tituloOriginal;
});

const modalCorreo = new bootstrap.Modal(document.getElementById("modalCorreo"));
const correoDestino = document.getElementById("correoDestino");
const correoMsg = document.getElementById("correoMsg");

function mostrarMsgCorreo(texto, clase) {
    correoMsg.textContent = texto;
    correoMsg.className = "small mt-2 " + clase;
}

document.getElementById("btnCorreo").addEventListener("click", () => {
    document.getElementById("correoPeriodo").textContent = reciboActual.periodo;
    correoDestino.value = "";
    correoMsg.className = "d-none";
    modalCorreo.show();
});

document.getElementById("btnEnviarCorreo").addEventListener("click", () => {
    const correo = correoDestino.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarMsgCorreo("Escribe un correo válido.", "text-danger");
        return;
    }
    mostrarMsgCorreo("Recibo enviado a " + correo + " ", "text-success");
    setTimeout(() => modalCorreo.hide(), 1800);
});