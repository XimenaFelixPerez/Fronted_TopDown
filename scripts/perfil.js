(function () {
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fecha = (iso) => { const [a, m, d] = String(iso || "").split("-"); return a ? `${d} ${MES[Number(m) - 1]} ${a}` : ""; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const iniciales = (n) => String(n || "").split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const $ = (id) => document.getElementById(id);

function renderFilas(idContenedor, filas) {
    $(idContenedor).innerHTML = filas.map(([etiqueta, valor]) =>
        `<div class="fila-dato"><span>${etiqueta}</span><span>${valor ? esc(valor) : "—"}</span></div>`).join("");
}

async function cargarPerfil() {
    try {
        const p = await api("/perfil");

        $("perfilIniciales").textContent = iniciales(p.nombre);
        $("pNombre").textContent = p.nombre;
        $("pNumero").textContent = p.numero;
        $("pDepto").textContent = p.departamento;
        $("pPuesto").textContent = p.puesto;
        $("pCorreo").textContent = p.correoInstitucional;
        $("pEmpresa").textContent = p.empresa;
        $("pIngreso").textContent = fecha(p.ingreso);
        $("pSupervisor").textContent = p.supervisor || "—";

        renderFilas("datosPersonales", [
            ["CURP", p.curp],
            ["RFC", p.rfc],
            ["Fecha de nacimiento", fecha(p.nacimiento)],
            ["Género", p.genero],
            ["Estado civil", p.estadoCivil],
            ["Tipo de sangre", p.tipoSangre],
            ["Licencia de manejo", p.licencia],
            ["Teléfono celular", p.telCelular],
            ["Teléfono de casa", p.telCasa],
            ["Teléfono de recado", p.telRecado],
        ]);

        const d = p.direccion;
        renderFilas("datosDireccion", [
            ["Calle", d.calle],
            ["Número exterior", d.numExt],
            ["Colonia", d.colonia],
            ["Municipio", d.municipio],
            ["Estado", d.estado],
            ["CP", d.cp],
            ["País", d.pais],
            ["Celular", p.telCelular],
        ]);

        renderFilas("datosSeguridad", [
            ["NSS (IMSS)", p.nss],
            ["Tipo de cobertura", p.imss.cobertura],
            ["Clínica asignada", p.imss.clinica],
            ["Fecha de alta IMSS", fecha(p.imss.alta)],
            ["ISSSTE", "No aplica"],
            ["INFONAVIT", p.imss.infonavit ? "Activo" : "Sin crédito"],
            ["Régimen fiscal", p.regimen],
        ]);

        // El administrador no envía solicitudes, solo las evalúa
        $("btnSolicitarAct").classList.toggle("d-none", p.esAdmin);
    } catch (e) {
        console.error(e);
        if (e.status === 401) location.href = "index.html";
    }
}

/* ============================ SOLICITUD DE ACTUALIZACIÓN ============================ */
const tiposDoc = [
    { id: "ine", nombre: "INE / Credencial de elector",
      campos: ["Nombre completo", "CURP", "Fecha de nacimiento", "Género", "Calle", "Colonia", "CP"] },
    { id: "domicilio", nombre: "Comprobante de domicilio",
      campos: ["Calle", "Número exterior", "Colonia", "Municipio", "Estado", "CP", "País"] },
    { id: "acta", nombre: "Acta de nacimiento",
      campos: ["Nombre completo", "Fecha de nacimiento", "Género", "CURP", "Estado"] },
];

const MAX_MB = 10;
const EXTENSIONES = ["jpg", "jpeg", "png", "pdf"];

const modalEl = $("modalActualizacion");
const modalAct = new bootstrap.Modal(modalEl);
const tiposDocCont = $("tiposDoc");
const camposAuto = $("camposAuto");
const dropzone = $("dropzone");
const dropzoneContenido = $("dropzoneContenido");
const archivoInput = $("archivoInput");
const errorArchivo = $("errorArchivo");
const accionesSolicitud = $("accionesSolicitud");
const avisoPerfil = $("avisoPerfil");

const HTML_DROPZONE_VACIA = `
    <i class="bi bi-upload fs-3 text-secondary"></i>
    <div class="fw-medium mt-2">Arrastra o haz clic para subir tu documento</div>
    <small class="text-secondary">JPG, PNG o PDF — máx 10 MB</small>
`;

let tipoSeleccionado = "domicilio";
let archivo = null;

function renderTipos() {
    tiposDocCont.innerHTML = "";
    tiposDoc.forEach((t) => {
        const col = document.createElement("div");
        col.className = "col-4";
        col.innerHTML = `<button type="button" class="opcion-doc w-100 ${t.id === tipoSeleccionado ? "activo" : ""}">${t.nombre}</button>`;
        col.querySelector("button").addEventListener("click", () => {
            tipoSeleccionado = t.id;
            renderTipos();
        });
        tiposDocCont.appendChild(col);
    });

    const actual = tiposDoc.find((t) => t.id === tipoSeleccionado);
    camposAuto.innerHTML = actual.campos.map((c) => `<span class="campo-auto">${c}</span>`).join("");
}

const formatoTamano = (bytes) =>
    bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";

function mostrarError(texto) {
    errorArchivo.textContent = texto;
    errorArchivo.classList.toggle("d-none", !texto);
}

function reiniciarArchivo() {
    archivo = null;
    archivoInput.value = "";
    dropzone.classList.remove("con-archivo");
    dropzoneContenido.innerHTML = HTML_DROPZONE_VACIA;
    accionesSolicitud.classList.add("d-none");
    accionesSolicitud.classList.remove("d-flex");
    mostrarError("");
}

function recibirArchivo(f) {
    mostrarError("");
    if (!f) return;

    const ext = f.name.split(".").pop().toLowerCase();
    if (!EXTENSIONES.includes(ext)) {
        mostrarError("Formato no permitido. Sube un archivo JPG, PNG o PDF.");
        return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
        mostrarError(`El archivo pesa más de ${MAX_MB} MB.`);
        return;
    }

    archivo = f;
    dropzone.classList.add("con-archivo");
    dropzoneContenido.innerHTML = `
        <i class="bi ${ext === "pdf" ? "bi-file-earmark-pdf" : "bi-file-earmark-image"} fs-3 texto-portal"></i>
        <div class="fw-medium mt-2">${esc(f.name)}</div>
        <small class="text-secondary">${formatoTamano(f.size)} — haz clic para cambiar el archivo</small>
    `;
    accionesSolicitud.classList.remove("d-none");
    accionesSolicitud.classList.add("d-flex");
}

dropzone.addEventListener("click", () => archivoInput.click());
dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); archivoInput.click(); }
});
archivoInput.addEventListener("change", () => recibirArchivo(archivoInput.files[0]));

["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("arrastrando"); })
);
["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("arrastrando"); })
);
dropzone.addEventListener("drop", (e) => recibirArchivo(e.dataTransfer.files[0]));

modalEl.addEventListener("show.bs.modal", () => {
    tipoSeleccionado = "domicilio";
    renderTipos();
    reiniciarArchivo();
});

$("btnEnviarSolicitud").addEventListener("click", async () => {
    if (!archivo) return mostrarError("Sube un documento.");
    const btn = $("btnEnviarSolicitud");
    btn.disabled = true;
    try {
        const r = await api("/solicitudes/datos", {
            method: "POST",
            body: { documento: tipoSeleccionado, archivo: archivo.name },
        });
        const tipo = tiposDoc.find((t) => t.id === tipoSeleccionado).nombre;
        modalAct.hide();
        avisoPerfil.textContent = `Solicitud ${r.folio} enviada con tu ${tipo.toLowerCase()}. Recursos Humanos la revisará y te llegará una notificación con la respuesta.`;
        avisoPerfil.classList.remove("d-none");
        setTimeout(() => avisoPerfil.classList.add("d-none"), 7000);
    } catch (e) {
        mostrarError(e.mensaje || "No se pudo enviar la solicitud.");
    } finally {
        btn.disabled = false;
    }
});

renderTipos();
reiniciarArchivo();
cargarPerfil();
})();
