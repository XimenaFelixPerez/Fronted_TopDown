
let empresa = {};
let empleado = {};
let recibos = [];
const cacheDetalle = {};

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MES_CORTO = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const fechaCorta = (iso) => {
    const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MES_CORTO[m - 1]} ${a}`;
};

function adaptar(d) {
    empresa = d.empresa;
    empleado = {
        ...d.empleado,
        ingreso: fechaCorta(d.empleado.ingreso)
    };

    const m = (c) =>
        d.conceptos.find((x) => x.Concepto === c)?.Monto || 0;

    return {
        id: d.recibo.id,
        mes: d.recibo.mes,
        anio: d.recibo.anio,
        folio: d.recibo.folio,
        periodo: `${MESES[d.recibo.mes - 1]} ${d.recibo.anio}`,
        fecha: fechaCorta(d.recibo.fechaPago),
        fechaPago: d.recibo.fechaPago,
        tipo: d.recibo.tipo,
        sueldo: m('Sueldo mensual'),
        bono: m('Bono de productividad'),
        imss: m('IMSS cuota obrera'),
        isr: m('ISR retenido'),
        infonavit: m('INFONAVIT'),
        percepciones: d.totales.percepciones,
        deducciones: d.totales.deducciones,
        neto: d.totales.neto,
        detalle: d
    };
}

async function cargarDetalle(id) {
    if (!cacheDetalle[id]) {
        cacheDetalle[id] = adaptar(await api(`/nomina/recibos/${id}`));
    }

    return cacheDetalle[id];
}

const money = (n) =>
    "$" + Number(n).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const recibosBody = document.getElementById("recibosBody");
const historialLista = document.getElementById("historialLista");
const historialDetalle = document.getElementById("historialDetalle");
const volverHistorial = document.getElementById("volverHistorial");

const modalPreview = new bootstrap.Modal(
    document.getElementById("modalPreview")
);

let reciboActual = null;

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
        r.bono > 0
            ? filaConcepto("Bono de productividad", r.bono)
            : ""
    ].join("");

    const deducciones = [
        filaConcepto("Retención del seguro social (IMSS)", r.imss),
        filaConcepto("Retención por ISR", r.isr),
        filaConcepto("Crédito INFONAVIT", r.infonavit)
    ].join("");

    return `
        <div class="rn-titulo">
            <span>RECIBO DE NÓMINA</span>
            <span>${r.folio}</span>
        </div>

        <table class="rn-cab">
            <thead>
                <tr>
                    <th>NOMBRE DE LA EMPRESA</th>
                    <th>TRABAJADOR</th>
                </tr>
            </thead>
            <tbody>
                <tr>
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
                </tr>
            </tbody>
        </table>

        <table class="rn-periodo">
            <tr>
                <td>Periodo de liquidación: <b>${r.periodo}</b></td>
                <td>Fecha de pago: <b>${r.fecha}</b></td>
                <td class="text-end">Total días: 30</td>
            </tr>
        </table>

        <table class="rn-conceptos">
            <tr class="rn-sec">
                <th>PERCEPCIONES</th>
                <th class="der">CANTIDAD</th>
                <th class="der">PRECIO</th>
                <th class="der">TOTALES</th>
            </tr>
            <tr>
                <td class="sub" colspan="4">Percepciones salariales:</td>
            </tr>
            ${percepciones}
            <tr class="rn-total">
                <td colspan="3">TOTAL DEVENGADO</td>
                <td class="der">${money(r.percepciones)}</td>
            </tr>

            <tr class="rn-sec">
                <th colspan="3">DEDUCCIONES</th>
                <th class="der">TOTALES</th>
            </tr>
            <tr>
                <td class="sub" colspan="4">Retención a cuenta de impuestos:</td>
            </tr>
            ${deducciones}
            <tr class="rn-total">
                <td colspan="3">TOTAL A DEDUCIR</td>
                <td class="der">${money(r.deducciones)}</td>
            </tr>

            <tr class="rn-neto">
                <td colspan="3">SUELDO NETO A PAGAR</td>
                <td class="der">${money(r.neto)}</td>
            </tr>
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
    if (!recibo) return;

    reciboActual = recibo;
    document.getElementById("reciboPreview").innerHTML =
        construirRecibo(recibo);

    modalPreview.show();
}

const esc = (t) => String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function construirXml(r) {
    const linea = (tag, clave, concepto, importe) =>
        `    <${tag} Clave="${clave}" Concepto="${esc(concepto)}" Importe="${importe.toFixed(2)}"/>`;

    const percepciones = [
        linea("Percepcion", "001", "Sueldo base", r.sueldo)
    ];

    if (r.bono > 0) {
        percepciones.push(
            linea("Percepcion", "010", "Bono de productividad", r.bono)
        );
    }

    const deducciones = [
        linea("Deduccion", "001", "IMSS", r.imss),
        linea("Deduccion", "002", "ISR", r.isr),
        linea("Deduccion", "003", "INFONAVIT", r.infonavit)
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
    if (!r) return;

    const blob = new Blob(
        [construirXml(r)],
        { type: "application/xml" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `recibo-nomina-${r.folio}.xml`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

const filaDetalle = (c, rojo) => `
    <div class="d-flex justify-content-between py-3 border-bottom">
        <span>${c.Concepto}</span>
        <span${rojo ? ' class="text-danger"' : ''}>${rojo ? '-' : ''}${money(c.Monto)}</span>
    </div>`;

const filaTotal = (txt, val, rojo) => `
    <div class="d-flex justify-content-between align-items-center fw-bold"
         style="background-color:#e6e7e9;padding:12px 16px;margin:0 -23px;">
        <span>${txt}</span>
        <span${rojo ? ' class="text-danger"' : ''}>${rojo ? '-' : ''}${val}</span>
    </div>`;

function renderResumen(r) {
    const d = r.detalle;
    const P = d.conceptos.filter((c) => c.Tipo === 'P');
    const D = d.conceptos.filter((c) => c.Tipo === 'D');
    const pct = r.percepciones
        ? Math.round((r.neto / r.percepciones) * 100)
        : 0;

    document.getElementById('resumenContenido').innerHTML = `
    <div class="row g-3">
        <div class="col-md-7">
            <div class="panel p-0">
                <div class="px-4 py-3 border-bottom">
                    <small class="text-secondary text-uppercase">Percepciones — ${r.periodo}</small>
                </div>
                <div class="px-4">
                    ${P.map((c) => filaDetalle(c, false)).join('')}
                    ${filaTotal('Total percepciones', money(r.percepciones), false)}
                </div>
                <div class="px-4 py-3 border-bottom border-top">
                    <small class="text-secondary text-uppercase">Deducciones</small>
                </div>
                <div class="px-4">
                    ${D.map((c) => filaDetalle(c, true)).join('')}
                    ${filaTotal('Total deducciones', money(r.deducciones), true)}
                </div>
            </div>
        </div>

        <div class="col-md-5">
            <div class="panel mb-3">
                <h6 class="fw-bold mb-3">Composición del pago</h6>
                <div class="progress mb-3" style="height: 10px;">
                    <div class="progress-bar" style="width: ${pct}%; background: var(--portal-color);"></div>
                </div>
                <div class="d-flex justify-content-between align-items-center small mb-2">
                    <span><span class="dot dot-active"></span> Pago neto</span>
                    <span>${money(r.neto)} (${pct}%)</span>
                </div>
                <div class="d-flex justify-content-between align-items-center small">
                    <span><span class="dot" style="background-color: #d1d9fd;"></span> Deducciones</span>
                    <span>${money(r.deducciones)} (${100 - pct}%)</span>
                </div>
            </div>

            <div class="panel">
                <h6 class="fw-bold mb-3">Datos fiscales</h6>
                <div class="d-flex justify-content-between py-2 border-bottom small">
                    <span class="text-secondary">RFC</span><span>${d.empleado.rfc}</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom small">
                    <span class="text-secondary">CURP</span><span>${d.empleado.curp}</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom small">
                    <span class="text-secondary">NSS</span><span>${d.empleado.nss}</span>
                </div>
                <div class="d-flex justify-content-between py-2 small">
                    <span class="text-secondary">Régimen</span><span>${d.empleado.regimen}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function renderDetalle(r) {
    const d = r.detalle;

    document.getElementById('detCabecera').innerHTML = `
    <div class="row">
        <div class="col-md-4">
            <small class="text-secondary text-uppercase">Empresa</small>
            <p class="fw-semibold mb-1 mt-1">${d.empresa.nombre}</p>
            <p class="small text-secondary mb-0">RFC: ${d.empresa.rfc}</p>
            <p class="small text-secondary mb-0">Reg. Patronal: ${d.empresa.regPatronal}</p>
        </div>

        <div class="col-md-4">
            <small class="text-secondary text-uppercase">Empleado</small>
            <p class="fw-semibold mb-1 mt-1">${d.empleado.nombre}</p>
            <p class="small text-secondary mb-0">Núm. ${d.empleado.numero} - NSS: ${d.empleado.nss}</p>
            <p class="small text-secondary mb-0">RFC: ${d.empleado.rfc}</p>
            <p class="small text-secondary mb-0">Puesto: ${d.empleado.puesto}</p>
        </div>

        <div class="col-md-4">
            <small class="text-secondary text-uppercase">Pago</small>
            <p class="small mb-0 mt-1"><span class="text-secondary">Fecha:</span> ${r.fecha}</p>
            <p class="small mb-0"><span class="text-secondary">Periodo:</span> ${r.periodo}</p>
            <p class="small mb-0"><span class="text-secondary">Tipo:</span> ${r.tipo}</p>
        </div>
    </div>`;

    document.getElementById('detConceptos').innerHTML =
        d.conceptos.map((c) => c.Tipo === 'P'
            ? `<tr><td>${c.Concepto}</td><td class="text-success">${money(c.Monto)}</td><td>-</td></tr>`
            : `<tr><td>${c.Concepto}</td><td>-</td><td class="text-danger">${money(c.Monto)}</td></tr>`
        ).join('') +
        `<tr class="fw-bold fila-resaltada">
            <td>Total</td>
            <td class="text-success">${money(r.percepciones)}</td>
            <td class="text-danger">-${money(r.deducciones)}</td>
        </tr>`;

    document.getElementById('detNeto').textContent = money(r.neto);
}

function renderDeducciones(d) {
    if (!d.actual) return;

    const barra = (c, total, estilo) => `
        <div class="progress mt-2" style="height: 6px;">
            <div class="progress-bar ${estilo.clase}"
                 style="width: ${total ? Math.round((c.Monto / total) * 100) : 0}%; ${estilo.css}">
            </div>
        </div>`;

    document.getElementById('deduccionesContenido').innerHTML = `
    <div class="row g-3">
        <div class="col-md-7">
            <div class="panel">
                <small class="text-secondary text-uppercase d-block mb-3">
                    Deducciones — ${MESES[d.actual.mes - 1]} ${d.actual.anio}
                </small>

                ${d.actual.conceptos.map((c) => `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="fw-semibold">${c.Concepto}</span>
                            <span class="text-danger fw-semibold">-${money(c.Monto)}</span>
                        </div>
                        ${barra(c, d.actual.total, { clase: 'bg-danger', css: '' })}
                    </div>
                `).join('')}

                <div class="d-flex justify-content-between fw-bold pt-2 border-top">
                    <span>Total deducciones</span>
                    <span class="text-danger">-${money(d.actual.total)}</span>
                </div>
            </div>
        </div>

        <div class="col-md-5">
            <div class="panel">
                <h6 class="fw-bold mb-3">Acumulado anual ${d.acumulado.anio}</h6>

                ${d.acumulado.conceptos.map((c) => `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between small mb-1">
                            <span>${c.Concepto}</span>
                            <span>${money(c.Monto)}</span>
                        </div>
                        ${barra(c, d.acumulado.total, {
                            clase: '',
                            css: 'background: var(--portal-color);'
                        })}
                    </div>
                `).join('')}

                <div class="d-flex justify-content-between fw-bold pt-2 border-top">
                    <span>Total deducido en el año</span>
                    <span class="text-danger">-${money(d.acumulado.total)}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function pintarHistorial() {
    recibosBody.innerHTML = '';

    recibos.forEach((x) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="fw-semibold">${MESES[x.mes - 1]} ${x.anio}</td>
            <td class="numero">${money(x.percepciones)}</td>
            <td class="text-danger numero">-${money(x.deducciones)}</td>
            <td class="fw-semibold numero">${money(x.neto)}</td>
            <td class="numero">${fechaCorta(x.fechaPago)}</td>
            <td class="text-end">
                <button class="btn btn-outline-primary btn-sm btn-descargar ver-recibo">Ver</button>
                <button class="btn btn-outline-primary btn-sm btn-descargar descargar-recibo"
                        title="Vista previa y descarga">
                    <i class="bi bi-download"></i>
                </button>
            </td>`;

        row.querySelector('.ver-recibo').addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                reciboActual = await cargarDetalle(x.id);
                renderDetalle(reciboActual);
                historialLista.classList.add('d-none');
                historialDetalle.classList.remove('d-none');
            } catch (error) {
                console.error(error);
                alert('No se pudo cargar el detalle del recibo.');
            }
        });

        row.querySelector('.descargar-recibo').addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                abrirPreview(await cargarDetalle(x.id));
            } catch (error) {
                console.error(error);
                alert('No se pudo cargar el recibo.');
            }
        });

        recibosBody.appendChild(row);
    });
}

(async () => {
    try {
        recibos = (await api('/nomina/recibos')).recibos;
        pintarHistorial();

        if (recibos.length) {
            const ult = recibos[0];

            document.getElementById('cNeto').textContent = money(ult.neto);
            document.getElementById('cBruto').textContent = money(ult.percepciones);
            document.getElementById('cDed').textContent = money(ult.deducciones);
            document.getElementById('cProx').textContent = fechaCorta(ult.fechaPago);

            reciboActual = await cargarDetalle(ult.id);
            renderResumen(reciboActual);
        }

        renderDeducciones(await api('/nomina/deducciones'));
    } catch (e) {
        console.error(e);

        if (String(e.message).includes('401')) {
            location.href = 'index.html';
        }
    }
})();

volverHistorial.addEventListener("click", (e) => {
    e.preventDefault();
    historialDetalle.classList.add("d-none");
    historialLista.classList.remove("d-none");
});

document.getElementById("btnPdf").addEventListener("click", () => {
    abrirPreview(reciboActual);
});

document.getElementById("btnImprimir").addEventListener("click", () => {
    abrirPreview(reciboActual);
});

document.getElementById("btnXml").addEventListener("click", () => {
    descargarXml(reciboActual);
});

document.getElementById("btnDescargarXml").addEventListener("click", () => {
    descargarXml(reciboActual);
});

document.getElementById("btnDescargar").addEventListener("click", () => {
    if (!reciboActual) return;

    const tituloOriginal = document.title;
    document.title = "Recibo nomina " + reciboActual.folio;

    window.print();

    document.title = tituloOriginal;
});

const modalCorreo = new bootstrap.Modal(
    document.getElementById("modalCorreo")
);

const correoDestino = document.getElementById("correoDestino");
const correoMsg = document.getElementById("correoMsg");

function mostrarMsgCorreo(texto, clase) {
    correoMsg.textContent = texto;
    correoMsg.className = "small mt-2 " + clase;
}

document.getElementById("btnCorreo").addEventListener("click", () => {
    if (!reciboActual) return;

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
