(function () {
const $ = (id) => document.getElementById(id);
const API = `http://${location.hostname || "localhost"}:3000/api`;
const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fecha = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${m[3]} ${MES[Number(m[2]) - 1]} ${m[1]}` : "—";
};
const hora = (iso) => String(iso || "").slice(11, 16) || "—";
const money = (n) => "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const iniciales = (n) => String(n || "").split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// fetch que regresa el mensaje del servidor cuando algo falla
async function pedir(ruta, metodo = "GET", body) {
    const r = await fetch(API + ruta, {
        method: metodo,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    const datos = await r.json().catch(() => ({}));
    if (r.status === 401) { location.replace("index.html"); throw new Error("Sesión expirada"); }
    if (r.status === 403) { location.replace("Dashboard.html"); throw new Error("Sin permiso"); }
    if (!r.ok) throw new Error(datos.mensaje || `Error ${r.status}`);
    return datos;
}
const mostrarError = (el, txt) => { el.textContent = txt; el.classList.toggle("d-none", !txt); };

let empleados = [];
let miId = null;
let noticias = [];
let solicitudes = [];
let encuestas = [];

/* ============================ EMPLEADOS ============================ */
const empBody = $("empBody");

function pintarEmpleados() {
    const q = $("buscarEmp").value.trim().toLowerCase();
    const lista = empleados.filter((e) =>
        !q || [e.Nombre, e.Correo, e.NumeroEmpleado].some((v) => String(v || "").toLowerCase().includes(q)));

    $("stActivos").textContent = empleados.filter((e) => e.Activo).length;

    empBody.innerHTML = lista.length ? "" :
        `<tr><td colspan="6" class="text-center text-secondary py-4">No hay empleados que coincidan</td></tr>`;

    lista.forEach((e) => {
        const esYo = e.UsuarioId === miId;
        const tr = document.createElement("tr");
        if (!e.Activo) tr.classList.add("text-secondary");
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle">${esc(iniciales(e.Nombre))}</div>
                    <div>
                        <div class="fw-semibold">${esc(e.Nombre)}${esYo ? ' <small class="text-secondary">(tú)</small>' : ""}</div>
                        <small class="text-secondary">${esc(e.NumeroEmpleado || "—")} · ${esc(e.Correo)}</small>
                    </div>
                </div>
            </td>
            <td><div>${esc(e.Puesto || "—")}</div><small class="text-secondary">${esc(e.Departamento || "")}</small></td>
            <td class="numero">${fecha(e.FechaIngreso)}</td>
            <td><span class="tag-doc ${e.Rol === "admin" ? "tag-reconocimiento" : "tag-comunicado"}">${e.Rol === "admin" ? "Admin" : "Empleado"}</span></td>
            <td><span class="badge-status ${e.Activo ? "badge-autorizada" : "badge-pendiente"}">${e.Activo ? "Activo" : "De baja"}</span></td>
            <td class="text-end text-nowrap">
                <button class="btn btn-outline-primary btn-sm" data-acc="ver">Ver</button>
                ${esYo ? "" : (e.Activo
                    ? `<button class="btn btn-outline-danger btn-sm" data-acc="eliminar">Eliminar</button>`
                    : `<button class="btn btn-outline-success btn-sm" data-acc="reactivar">Reactivar</button>
                       <button class="btn btn-outline-danger btn-sm" data-acc="eliminar">Eliminar</button>`)}
            </td>`;
        tr.addEventListener("click", (ev) => {
            const acc = ev.target.closest("[data-acc]")?.dataset.acc;
            if (acc === "ver") verEmpleado(e);
            if (acc === "eliminar") abrirEliminar(e);
            if (acc === "reactivar") cambiarEstado(e, true);
        });
        empBody.appendChild(tr);
    });
}

async function cargarEmpleados() {
    const d = await pedir("/admin/empleados");
    empleados = d.empleados;
    miId = d.yo;
    pintarEmpleados();
}
$("buscarEmp").addEventListener("input", pintarEmpleados);

// Ver detalle
const modalVer = new bootstrap.Modal($("modalVerEmp"));
function verEmpleado(e) {
    const fila = (k, v) => `<div class="fila-dato"><span>${k}</span><span>${esc(v || "—")}</span></div>`;
    $("verEmpCuerpo").innerHTML = `
        <div class="d-flex align-items-center gap-3 mb-4">
            <div class="avatar-circle avatar-xl">${esc(iniciales(e.Nombre))}</div>
            <div>
                <div class="fw-bold fs-5">${esc(e.Nombre)}</div>
                <small class="text-secondary">${esc(e.Puesto || "")} · ${esc(e.Departamento || "")}</small>
            </div>
        </div>
        <div class="row gx-5">
            <div class="col-md-6">
                ${fila("Núm. empleado", e.NumeroEmpleado)}
                ${fila("Correo", e.Correo)}
                ${fila("Rol", e.Rol === "admin" ? "Administrador" : "Empleado")}
                ${fila("Estado", e.Activo ? "Activo" : "Dado de baja")}
                ${fila("Fecha de ingreso", fecha(e.FechaIngreso))}
                ${fila("Fecha de nacimiento", e.FechaNacimiento ? fecha(e.FechaNacimiento) : "")}
                ${fila("Último acceso", e.UltimoAcceso ? `${fecha(e.UltimoAcceso)} ${hora(e.UltimoAcceso)}` : "Nunca")}
            </div>
            <div class="col-md-6">
                ${fila("CURP", e.CURP)}
                ${fila("RFC", e.RFC)}
                ${fila("NSS", e.NSS)}
                ${fila("Banco", e.Banco)}
                ${fila("Cuenta", e.Cuenta)}
                ${fila("Salario mensual", e.SalarioMensual != null ? money(e.SalarioMensual) : "")}
            </div>
        </div>`;
    modalVer.show();
}

// Agregar
const modalEmp = new bootstrap.Modal($("modalEmp"));
$("btnNuevoEmp").addEventListener("click", () => {
    $("formEmp").reset();
    $("eIngreso").value = hoyISO();
    mostrarError($("empError"), "");
    modalEmp.show();
});

$("btnGuardarEmp").addEventListener("click", async () => {
    const form = $("formEmp");
    if (!form.reportValidity()) return;
    const btn = $("btnGuardarEmp");
    btn.disabled = true;
    try {
        await pedir("/admin/empleados", "POST", {
            nombre: $("eNombre").value, numero: $("eNumero").value,
            correo: $("eCorreo").value, contrasena: $("eContrasena").value, rol: $("eRol").value,
            puesto: $("ePuesto").value, departamento: $("eDepto").value,
            fechaIngreso: $("eIngreso").value, fechaNacimiento: $("eNacimiento").value,
            curp: $("eCurp").value, rfc: $("eRfc").value, nss: $("eNss").value,
            banco: $("eBanco").value, cuenta: $("eCuenta").value, salario: $("eSalario").value,
        });
        modalEmp.hide();
        await cargarEmpleados();
    } catch (err) {
        mostrarError($("empError"), err.message);
    } finally {
        btn.disabled = false;
    }
});

// Baja / reactivar / eliminar definitivo
const modalElim = new bootstrap.Modal($("modalEliminar"));
let aEliminar = null;

function abrirEliminar(e) {
    aEliminar = e;
    $("elimNombre").textContent = e.Nombre;
    $("btnBaja").classList.toggle("d-none", !e.Activo);
    mostrarError($("elimError"), "");
    modalElim.show();
}

async function cambiarEstado(e, activo) {
    try {
        await pedir(`/admin/empleados/${e.UsuarioId}/estado`, "PATCH", { activo });
        await cargarEmpleados();
        return true;
    } catch (err) {
        alert(err.message);
        return false;
    }
}

$("btnBaja").addEventListener("click", async () => {
    if (await cambiarEstado(aEliminar, false)) modalElim.hide();
});

$("btnDefinitivo").addEventListener("click", async () => {
    if (!confirm(`¿Eliminar definitivamente a ${aEliminar.Nombre}? Se borra todo su historial.`)) return;
    try {
        await pedir(`/admin/empleados/${aEliminar.UsuarioId}`, "DELETE");
        modalElim.hide();
        await Promise.all([cargarEmpleados(), cargarAccesos(), cargarSolicitudes()]);
    } catch (err) {
        mostrarError($("elimError"), err.message);
    }
});

/* ============================ SOLICITUDES ============================ */
const listaSol = $("listaSolicitudes");
const modalRech = new bootstrap.Modal($("modalRechazo"));
let filtroSol = "Pendiente";
let aRechazar = null;

const ESTILO_ESTADO = {
    Pendiente: 'class="badge-status badge-pendiente"',
    Autorizada: 'class="badge-status badge-autorizada"',
    Rechazada: 'class="badge-status" style="background:#fde2e1;color:#b42318"',
};

function pintarSolicitudes() {
    const pend = solicitudes.filter((s) => s.Estado === "Pendiente").length;
    $("stSolPend").textContent = pend;
    $("badgeSol").textContent = pend;
    $("badgeSol").classList.toggle("d-none", !pend);
    document.querySelectorAll("#filtroSol button").forEach((b) => b.classList.toggle("activo", b.dataset.f === filtroSol));

    const lista = solicitudes.filter((s) => filtroSol === "todas" || s.Estado === filtroSol);
    listaSol.innerHTML = lista.length ? "" :
        `<div class="panel text-center text-secondary py-4">No hay solicitudes ${filtroSol === "todas" ? "" : filtroSol === "Pendiente" ? "pendientes" : filtroSol.toLowerCase() + "s"}</div>`;

    lista.forEach((s) => {
        const esVac = s.Tipo === "Vacaciones";
        const saldo = esVac && s.Asignados != null
            ? `Saldo ${s.Inicio.slice(0, 4)}: ${s.Asignados - s.Autorizados} de ${s.Asignados} días disponibles`
            : "";
        const card = document.createElement("div");
        card.className = "panel mb-3";
        card.innerHTML = `
            <div class="d-flex align-items-start gap-3 flex-wrap">
                <div class="avatar-circle avatar-lg">${esc(iniciales(s.Empleado))}</div>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="fw-semibold">${esc(s.Empleado)}</span>
                        <span class="folio">${esc(s.Folio)}</span>
                        <span ${ESTILO_ESTADO[s.Estado]}>${esc(s.Estado)}</span>
                    </div>
                    <small class="text-secondary d-block">Emp. ${esc(s.NumeroEmpleado || "—")} · ${esc(s.Departamento || "")} · Recibida ${fecha(s.FechaSolicitud)}</small>
                    <div class="mt-2">
                        <span class="tag-doc ${esVac ? "tag-evento" : "tag-comunicado"} me-2">${esc(s.Tipo)}</span>
                        ${esVac
                            ? `<b>${fecha(s.Inicio)} al ${fecha(s.Fin)}</b> · ${s.Dias} días hábiles`
                            : esc(s.Detalle || "")}
                    </div>
                    ${saldo ? `<small class="text-secondary d-block mt-1">${saldo}</small>` : ""}
                    ${s.Comentario ? `<small class="d-block mt-1">Comentario: <span class="text-secondary">${esc(s.Comentario)}</span></small>` : ""}
                    ${s.Estado === "Rechazada" ? `<small class="d-block mt-1 text-danger">Motivo: ${esc(s.MotivoRechazo)}</small>` : ""}
                    ${s.Estado !== "Pendiente" ? `<small class="text-secondary d-block mt-1">Revisada por ${esc(s.RevisadoPor || "—")} el ${fecha(s.FechaRevision)}</small>` : ""}
                </div>
                ${s.Estado === "Pendiente" ? `
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-danger btn-sm" data-acc="rechazar">Rechazar</button>
                    <button class="btn btn-portal text-white btn-sm" data-acc="autorizar">Autorizar</button>
                </div>` : ""}
            </div>`;
        card.addEventListener("click", async (ev) => {
            const acc = ev.target.closest("[data-acc]")?.dataset.acc;
            if (acc === "autorizar") {
                if (!confirm(`¿Autorizar la solicitud ${s.Folio} de ${s.Empleado}?`)) return;
                try {
                    await pedir(`/admin/solicitudes/${s.Id}`, "PATCH", { estado: "Autorizada" });
                    await cargarSolicitudes();
                } catch (err) { alert(err.message); }
            }
            if (acc === "rechazar") {
                aRechazar = s;
                $("rechFolio").textContent = s.Folio;
                $("rechQuien").textContent = `${s.Empleado} · ${s.Tipo}${esVac ? ` (${fecha(s.Inicio)} al ${fecha(s.Fin)})` : ""}`;
                $("rechMotivo").value = "";
                mostrarError($("rechError"), "");
                modalRech.show();
            }
        });
        listaSol.appendChild(card);
    });
}

async function cargarSolicitudes() {
    solicitudes = (await pedir("/admin/solicitudes")).solicitudes;
    pintarSolicitudes();
}

$("filtroSol").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filtroSol = b.dataset.f;
    pintarSolicitudes();
});

$("btnConfirmarRechazo").addEventListener("click", async () => {
    const motivo = $("rechMotivo").value.trim();
    if (!motivo) return mostrarError($("rechError"), "Escribe el motivo, el empleado lo verá en su notificación.");
    try {
        await pedir(`/admin/solicitudes/${aRechazar.Id}`, "PATCH", { estado: "Rechazada", motivo });
        modalRech.hide();
        await cargarSolicitudes();
    } catch (err) {
        mostrarError($("rechError"), err.message);
    }
});

/* ============================ NOTICIAS ============================ */
const listaNoticias = $("listaNoticiasAdmin");
const modalNoticia = new bootstrap.Modal($("modalNoticia"));
let editandoNoticia = null;

function pintarNoticias() {
    $("stNoticias").textContent = noticias.filter((n) => n.Publicada).length;
    listaNoticias.innerHTML = noticias.length ? "" : `<p class="text-secondary">Aún no hay noticias.</p>`;

    noticias.forEach((n) => {
        const col = document.createElement("div");
        col.className = "col-md-6";
        col.innerHTML = `
            <div class="panel h-100 d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="tag-doc tag-comunicado me-2">${esc(n.Categoria || "Comunicado")}</span>
                        <small class="text-secondary">${n.Publicada ? "Publicada" : "Borrador"}</small>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-editar btn-sm" data-acc="editar">Editar</button>
                        <button class="btn btn-editar btn-sm" data-acc="eliminar">Eliminar</button>
                    </div>
                </div>
                <div class="fw-semibold mb-1">${esc(n.Titulo)}</div>
                <div class="text-secondary mb-3">${esc(n.Resumen || n.Contenido || "")}</div>
                <div class="text-secondary small border-top pt-2 mt-auto numero">${fecha(n.Fecha)}</div>
            </div>`;
        col.addEventListener("click", async (ev) => {
            const acc = ev.target.closest("[data-acc]")?.dataset.acc;
            if (acc === "editar") abrirNoticia(n);
            if (acc === "eliminar") {
                if (!confirm(`¿Eliminar la noticia "${n.Titulo}"?`)) return;
                try { await pedir(`/admin/noticias/${n.Id}`, "DELETE"); await cargarNoticias(); }
                catch (err) { alert(err.message); }
            }
        });
        listaNoticias.appendChild(col);
    });
}

async function cargarNoticias() {
    noticias = (await pedir("/admin/noticias")).noticias;
    pintarNoticias();
}

function abrirNoticia(n) {
    editandoNoticia = n ? n.Id : null;
    $("notTitulo").textContent = n ? "Editar noticia" : "Publicar noticia";
    $("nTitulo").value = n?.Titulo || "";
    $("nFecha").value = n ? String(n.Fecha).slice(0, 10) : hoyISO();
    $("nCategoria").value = n?.Categoria || "Comunicado";
    $("nEstado").value = n ? (n.Publicada ? "1" : "0") : "1";
    $("nResumen").value = n?.Resumen || "";
    $("nContenido").value = n?.Contenido || "";
    mostrarError($("notError"), "");
    modalNoticia.show();
}
$("btnNuevaNoticia").addEventListener("click", () => abrirNoticia(null));

$("btnGuardarNoticia").addEventListener("click", async () => {
    const datos = {
        titulo: $("nTitulo").value.trim(),
        fecha: $("nFecha").value,
        categoria: $("nCategoria").value,
        publicada: $("nEstado").value === "1",
        resumen: $("nResumen").value.trim(),
        contenido: $("nContenido").value.trim(),
    };
    if (!datos.titulo || !datos.fecha) return mostrarError($("notError"), "Escribe el título y la fecha.");
    try {
        if (editandoNoticia) await pedir(`/admin/noticias/${editandoNoticia}`, "PUT", datos);
        else await pedir("/admin/noticias", "POST", datos);
        modalNoticia.hide();
        await cargarNoticias();
    } catch (err) {
        mostrarError($("notError"), err.message);
    }
});

/* ============================ ENCUESTAS ============================ */
const listaEnc = $("listaEncuestasAdmin");
const modalEncN = new bootstrap.Modal($("modalEncuestaNueva"));
const modalRes = new bootstrap.Modal($("modalResultados"));

function pintarEncuestas() {
    listaEnc.innerHTML = encuestas.length ? "" : `<p class="text-secondary">Aún no hay encuestas.</p>`;
    encuestas.forEach((e) => {
        const pct = e.Empleados ? Math.round((e.Respuestas / e.Empleados) * 100) : 0;
        const col = document.createElement("div");
        col.className = "col-md-6";
        col.innerHTML = `
            <div class="panel h-100 d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="tag-doc tag-reconocimiento me-2">+${e.Puntos} pts</span>
                        <small class="${e.Activa ? "texto-verde" : "text-secondary"}">${e.Activa ? "Activa" : "Inactiva"}</small>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-editar btn-sm" data-acc="resultados">Resultados</button>
                        <button class="btn btn-editar btn-sm" data-acc="activar">${e.Activa ? "Desactivar" : "Activar"}</button>
                    </div>
                </div>
                <div class="fw-semibold mb-1">${esc(e.Titulo)}</div>
                <div class="text-secondary mb-3">${esc(e.Descripcion || "")}</div>
                <div class="progress mb-2" style="height:6px"><div class="progress-bar" style="width:${pct}%;background:var(--portal-color)"></div></div>
                <div class="d-flex justify-content-between text-secondary small border-top pt-2 mt-auto">
                    <span>${e.Preguntas} preguntas · Cierra ${fecha(e.Cierre)}</span>
                    <span>${e.Respuestas} respuestas (${pct}%)</span>
                </div>
            </div>`;
        col.addEventListener("click", async (ev) => {
            const acc = ev.target.closest("[data-acc]")?.dataset.acc;
            if (acc === "activar") {
                try { await pedir(`/admin/encuestas/${e.Id}`, "PATCH", { activa: !e.Activa }); await cargarEncuestas(); }
                catch (err) { alert(err.message); }
            }
            if (acc === "resultados") verResultados(e);
        });
        listaEnc.appendChild(col);
    });
}

async function cargarEncuestas() {
    encuestas = (await pedir("/admin/encuestas")).encuestas;
    pintarEncuestas();
}

async function verResultados(e) {
    try {
        const r = await pedir(`/admin/encuestas/${e.Id}/resultados`);
        $("resTitulo").textContent = r.titulo;
        $("resCuerpo").innerHTML = `<p class="text-secondary small">${r.respuestas} respuesta(s) · resultados anónimos</p>` +
            r.preguntas.map((p) => {
                let cuerpo;
                if (!p.total) cuerpo = `<small class="text-secondary">Sin respuestas</small>`;
                else if (p.tipo === "escala") cuerpo = `<div>Promedio: <b>${p.promedio.toFixed(1)}</b> / 5 <small class="text-secondary">(${p.total})</small></div>`;
                else if (p.tipo === "texto") cuerpo = p.textos.map((t) => `<div class="small border-bottom py-1">${esc(t)}</div>`).join("");
                else {
                    const max = Math.max(1, ...Object.values(p.conteo));
                    cuerpo = Object.entries(p.conteo).map(([k, n]) => `
                        <div class="small mb-1">
                            <div class="d-flex justify-content-between"><span>${esc(k)}</span><span class="numero">${n}</span></div>
                            <div class="progress" style="height:5px"><div class="progress-bar" style="width:${(n / max) * 100}%;background:var(--portal-color)"></div></div>
                        </div>`).join("");
                }
                return `<div class="mb-3"><div class="fw-semibold small mb-1">${esc(p.texto)}</div>${cuerpo}</div>`;
            }).join("");
        modalRes.show();
    } catch (err) { alert(err.message); }
}

// "texto | tipo | opción; opción"  ->  { texto, tipo, opciones }
function parsearPreguntas(txt) {
    return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const [texto, tipo = "texto", ops = ""] = l.split("|").map((x) => x.trim());
        return {
            texto,
            tipo: ["escala", "opcion", "multiple", "texto"].includes(tipo) ? tipo : "texto",
            opciones: ops.split(";").map((x) => x.trim()).filter(Boolean),
        };
    });
}

$("btnNuevaEncuesta").addEventListener("click", () => {
    $("encTituloN").value = "";
    $("encDescN").value = "";
    $("encPuntosN").value = 50;
    const d = new Date(); d.setDate(d.getDate() + 30);
    $("encCierreN").value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    $("encPregN").value = "";
    mostrarError($("encErrorN"), "");
    modalEncN.show();
});

$("btnGuardarEncuesta").addEventListener("click", async () => {
    const btn = $("btnGuardarEncuesta");
    btn.disabled = true;
    try {
        await pedir("/admin/encuestas", "POST", {
            titulo: $("encTituloN").value.trim(),
            descripcion: $("encDescN").value.trim(),
            puntos: Number($("encPuntosN").value) || 0,
            cierre: $("encCierreN").value,
            preguntas: parsearPreguntas($("encPregN").value),
        });
        modalEncN.hide();
        await cargarEncuestas();
    } catch (err) {
        mostrarError($("encErrorN"), err.message);
    } finally {
        btn.disabled = false;
    }
});

/* ============================ ACCESOS ============================ */
async function cargarAccesos() {
    const accesos = (await pedir("/admin/accesos")).accesos;
    $("stAccesos").textContent = accesos.length;
    $("accesosBody").innerHTML = accesos.length
        ? accesos.map((a) => `
            <tr>
                <td class="fw-semibold">${esc(a.Nombre)}</td>
                <td>${esc(a.Correo)}</td>
                <td class="numero">${fecha(a.FechaHora)}</td>
                <td class="numero">${hora(a.FechaHora)}</td>
                <td class="numero">${esc(a.IP)}</td>
            </tr>`).join("")
        : `<tr><td colspan="5" class="text-center text-secondary py-4">Sin accesos registrados</td></tr>`;
}

/* ============================ INICIO ============================ */
(async () => {
    try {
        await pedir("/admin/yo");            // si no eres admin, el servidor responde 403 y te saca
        $("adminContenido").classList.remove("d-none");
        await Promise.all([cargarEmpleados(), cargarSolicitudes(), cargarNoticias(), cargarEncuestas(), cargarAccesos()]);
    } catch (err) {
        console.error(err);
    }
})();
})();
