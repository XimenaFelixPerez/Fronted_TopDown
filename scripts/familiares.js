(function () {
const avisos = [
    { color: "azul", titulo: "Apoyo de útiles escolares 2026-2027", etiqueta: "Empleados con hijos en edad escolar",
      texto: "Si tienes hijos en educación básica (preescolar, primaria o secundaria), puedes solicitar un apoyo de $1,500 MXN en vales de compra escolar por hijo inscrito. Registra a tus hijos en RRHH antes del 20 de septiembre." },
    { color: "verde", titulo: "Seguro de gastos médicos mayores — cobertura familiar", etiqueta: "Todos los empleados",
      texto: "Tu póliza de gastos médicos mayores incluye a tu cónyuge e hijos menores de 25 años. Asegúrate de tenerlos registrados en RRHH para que estén activos en la póliza." },
    { color: "naranja", titulo: "Evento familiar — Día de Reyes empresarial", etiqueta: "Empleados con hijos de 2 a 12 años",
      texto: "El próximo 6 de enero, Desarrollo Eslabón celebra el Día de Reyes para hijos de empleados de 2 a 12 años. Registra a tus hijos antes del 15 de diciembre para asegurar su lugar." },
];

const PARENTESCOS = ["Cónyuge", "Hijo", "Hija", "Padre", "Madre", "Hermano", "Hermana", "Otro"];
const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

let familiares = [];
let seleccionadoId = null;
let editandoId = null;

const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dato = (v) => (v ? esc(v) : "—");
const siNo = (b) => (b ? "Sí" : "No");

const fechaBonita = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${pad(d)} ${MESES_CORTO[m - 1]} ${y}`;
};

const nombreCorto = (full) => {
    const p = full.trim().split(/\s+/);
    if (p.length >= 4) return p.slice(0, 3).join(" ");
    if (p.length === 3) return p.slice(0, 2).join(" ");
    return full.trim();
};

const iniciales = (n) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const listaFamiliares = document.getElementById("listaFamiliares");
const detalleFamiliar = document.getElementById("detalleFamiliar");
const contadorFam = document.getElementById("contadorFam");

function renderLista() {
    listaFamiliares.innerHTML = familiares.length ? "" :
        `<div class="panel text-secondary small">Aún no registras familiares. Usa “Agregar familiar”.</div>`;

    familiares.forEach((f) => {
        const corto = nombreCorto(f.nombreCompleto);
        const item = document.createElement("div");
        item.className = "familiar-item d-flex align-items-center gap-3" + (f.id === seleccionadoId ? " activo" : "");
        item.innerHTML = `
            <div class="avatar-circle avatar-lg">${esc(iniciales(corto))}</div>
            <div class="flex-grow-1">
                <div class="fw-semibold">${esc(corto)}</div>
                <small class="text-secondary">${esc(f.parentesco)}</small>
            </div>
            ${f.beneficiario ? `<span class="pill-benef">Beneficiario</span>` : ""}
        `;
        item.addEventListener("click", () => {
            seleccionadoId = f.id;
            renderLista();
            renderDetalle();
        });
        listaFamiliares.appendChild(item);
    });

    contadorFam.textContent =
        familiares.length === 1 ? "1 familiar registrado" : `${familiares.length} familiares registrados`;
}

function flag(etiqueta, valor) {
    return `
        <div class="col-md-4">
            <div class="dato-flag">
                <small class="text-secondary d-block">${etiqueta}</small>
                <span class="fw-bold ${valor ? "texto-portal" : ""}">${siNo(valor)}</span>
            </div>
        </div>`;
}

function renderDetalle() {
    const f = familiares.find((x) => x.id === seleccionadoId);

    if (!f) {
        detalleFamiliar.innerHTML = `<div class="text-center text-secondary py-5">Selecciona un familiar para ver sus datos</div>`;
        return;
    }

    const corto = nombreCorto(f.nombreCompleto);
    detalleFamiliar.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="d-flex align-items-center gap-3">
                <div class="avatar-circle avatar-xl">${esc(iniciales(corto))}</div>
                <div>
                    <div class="fw-bold fs-5">${esc(f.nombreCompleto)}</div>
                    <small class="text-secondary">${esc(f.parentesco)}</small>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-light btn-sm border" id="btnEditar">Editar</button>
                <button class="btn btn-outline-danger btn-sm" id="btnEliminarFam">Eliminar</button>
            </div>
        </div>

        <div class="row gx-5">
            <div class="col-md-6">
                <div class="fila-dato"><span>CURP</span><span>${dato(f.curp)}</span></div>
                <div class="fila-dato"><span>Género</span><span>${dato(f.genero)}</span></div>
                <div class="fila-dato"><span>Ocupación</span><span>${dato(f.ocupacion)}</span></div>
                <div class="fila-dato"><span>Teléfono</span><span>${dato(f.telefono)}</span></div>
                <div class="fila-dato"><span>Teléfono celular</span><span>${dato(f.celular)}</span></div>
            </div>
            <div class="col-md-6">
                <div class="fila-dato"><span>Fecha de nacimiento</span><span>${fechaBonita(f.nacimiento)}</span></div>
                <div class="fila-dato"><span>Estado civil</span><span>${dato(f.estadoCivil)}</span></div>
                <div class="fila-dato"><span>Empresa donde trabaja</span><span>${dato(f.empresa)}</span></div>
                <div class="fila-dato"><span>Teléfono de recado</span><span>${dato(f.telefonoRecado)}</span></div>
            </div>
        </div>

        <hr class="my-4">

        <div class="row g-3">
            ${flag("Dependiente", f.dependiente)}
            ${flag("Beneficiario", f.beneficiario)}
            ${flag("Contacto emergencia", f.emergencia)}
            ${flag("Vive con empleado", f.vive)}
            ${flag("Trabaja en empresa", f.trabaja)}
            ${flag("Discapacidad", f.discapacidad)}
        </div>
    `;

    document.getElementById("btnEditar").addEventListener("click", () => abrirModal(f));
    document.getElementById("btnEliminarFam").addEventListener("click", async () => {
        if (!confirm(`¿Eliminar a ${f.nombreCompleto} de tus familiares?`)) return;
        try {
            await api(`/familiares/${f.id}`, { method: "DELETE" });
            seleccionadoId = null;
            await cargar();
        } catch (e) {
            alert(e.mensaje || "No se pudo eliminar.");
        }
    });
}

async function cargar(seleccionar) {
    try {
        familiares = (await api("/familiares")).familiares;
        if (seleccionar) seleccionadoId = seleccionar;
        if (!familiares.some((f) => f.id === seleccionadoId)) seleccionadoId = familiares[0]?.id ?? null;
        renderLista();
        renderDetalle();
    } catch (e) {
        console.error(e);
        if (e.status === 401) location.href = "index.html";
    }
}

const vistaAvisos = document.getElementById("vistaAvisos");

avisos.forEach((a) => {
    const card = document.createElement("div");
    card.className = "panel mb-3";
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center gap-3 mb-2">
            <div class="d-flex align-items-center gap-3">
                <span class="aviso-dot dot-${a.color}"></span>
                <span class="fw-semibold">${a.titulo}</span>
            </div>
            <span class="tag-doc tag-aviso-${a.color} text-nowrap">${a.etiqueta}</span>
        </div>
        <div class="text-secondary">${a.texto}</div>
    `;
    vistaAvisos.appendChild(card);
});

const vistaFamiliares = document.getElementById("vistaFamiliares");

document.querySelectorAll(".segmentado button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".segmentado button").forEach((b) => b.classList.remove("activo"));
        btn.classList.add("activo");

        const verFamiliares = btn.dataset.vista === "familiares";
        vistaFamiliares.classList.toggle("d-none", !verFamiliares);
        vistaAvisos.classList.toggle("d-none", verFamiliares);
    });
});

const modalFam = new bootstrap.Modal(document.getElementById("modalFamiliar"));
const modalTitulo = document.getElementById("modalFamTitulo");
const btnGuardarFam = document.getElementById("btnGuardarFam");

const campos = {
    nombreCompleto: document.getElementById("fNombre"),
    parentesco: document.getElementById("fParentesco"),
    curp: document.getElementById("fCurp"),
    nacimiento: document.getElementById("fNacimiento"),
    genero: document.getElementById("fGenero"),
    estadoCivil: document.getElementById("fEstadoCivil"),
    ocupacion: document.getElementById("fOcupacion"),
    telefono: document.getElementById("fTelefono"),
    celular: document.getElementById("fCelular"),
};

const checks = {
    dependiente: document.getElementById("fDependiente"),
    beneficiario: document.getElementById("fBeneficiario"),
    emergencia: document.getElementById("fEmergencia"),
    vive: document.getElementById("fVive"),
    trabaja: document.getElementById("fTrabaja"),
    discapacidad: document.getElementById("fDiscapacidad"),
};

PARENTESCOS.forEach((p) => campos.parentesco.add(new Option(p, p)));

function abrirModal(f = null) {
    editandoId = f ? f.id : null;
    modalTitulo.textContent = f ? "Editar familiar" : "Agregar familiar";

    Object.keys(campos).forEach((k) => {
        campos[k].value = f ? f[k] || "" : "";
    });
    if (!f) {
        campos.parentesco.selectedIndex = 0;
        campos.genero.selectedIndex = 0;
        campos.estadoCivil.selectedIndex = 0;
    }
    Object.keys(checks).forEach((k) => {
        checks[k].checked = f ? !!f[k] : false;
    });

    btnGuardarFam.disabled = campos.nombreCompleto.value.trim() === "";
    modalFam.show();
}

campos.nombreCompleto.addEventListener("input", () => {
    btnGuardarFam.disabled = campos.nombreCompleto.value.trim() === "";
});

btnGuardarFam.addEventListener("click", async () => {
    const datos = {};
    Object.keys(campos).forEach((k) => (datos[k] = campos[k].value.trim()));
    datos.curp = datos.curp.toUpperCase();
    Object.keys(checks).forEach((k) => (datos[k] = checks[k].checked));

    btnGuardarFam.disabled = true;
    try {
        let id = editandoId;
        if (editandoId) {
            await api(`/familiares/${editandoId}`, { method: "PUT", body: datos });
        } else {
            id = (await api("/familiares", { method: "POST", body: datos })).id;
        }
        modalFam.hide();
        await cargar(id);
        document.querySelector('.segmentado button[data-vista="familiares"]').click();
    } catch (e) {
        alert(e.mensaje || "No se pudo guardar.");
    } finally {
        btnGuardarFam.disabled = false;
    }
});

document.getElementById("btnAgregar").addEventListener("click", () => abrirModal());

cargar();
})();
