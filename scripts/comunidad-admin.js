(async function () {
const $ = (id) => document.getElementById(id);
// Las noticias se administran en admin.html (van a la BD); aquí quedan eventos, fechas y encuestas
const COLS = { evento: "eventos", fecha: "fechas", encuesta: "encuestas" };
const NOMBRE = { noticia: "Noticia", evento: "Evento", fecha: "Fecha importante", encuesta: "Encuesta" };
const ETQ = { publicado: "Publicado", borrador: "Borrador", activa: "Activa", inactiva: "Inactiva" };
const ESTADO_SOL = { pendiente: "Pendiente", revision: "En revisión", aprobada: "Aprobada", rechazada: "Rechazada" };

function h(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
}
const ini = (n) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
function isoDe(t) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(t || "")) return t;
    const m = /^(\d{2}) (\w{3}) (\d{4})$/.exec(t || "");
    const i = m ? MESES_CORTOS.indexOf(m[2]) : -1;
    return i < 0 ? "" : `${m[3]}-${String(i + 1).padStart(2, "0")}-${m[1]}`;
}

// ---------- Datos (se siembran con lo que ya tenía la página) ----------
function leerC() {
    let c = leerLS("contenidoComunidad", null);
    if (c && !c.encuestas) c.encuestas = [];
    if (!c) {
        const nots = typeof noticias !== "undefined" ? noticias : [];
        const fechas = typeof fechasEspeciales !== "undefined" ? fechasEspeciales : [];
        c = {
            noticias: nots.map((n, i) => ({ id: "n" + i, titulo: n.titulo, descripcion: n.cuerpo, fecha: isoDe(n.fecha), estado: "publicado" })),
            eventos: [
                { id: "e0", titulo: "Integración Eslabón Q3", descripcion: "Encuentro trimestral con actividades y dinámicas de equipo.", fecha: "2026-09-13", hora: "12:00-17:00", lugar: "Terraza corporativa", modalidad: "Presencial", puntos: 40, cupos: 20, estado: "publicado" },
                { id: "e1", titulo: "Voluntariado: reforestación", descripcion: "Jornada de reforestación con compañeros.", fecha: "2026-09-26", hora: "08:00-13:00", lugar: "Parque La Marquesa", modalidad: "Presencial", puntos: 70, cupos: 15, estado: "publicado" },
                { id: "e2", titulo: "Charla de bienestar financiero", descripcion: "Consejos para tus finanzas personales.", fecha: "2026-10-08", hora: "16:00-17:00", lugar: "Microsoft Teams", modalidad: "En línea", puntos: 25, cupos: 50, estado: "publicado" },
            ],
            fechas: fechas.map((f, i) => ({ id: "f" + i, titulo: f.titulo, descripcion: f.texto, fecha: isoDe(f.fecha), estado: "publicado" })),
            encuestas: [
                { id: "clima", titulo: "Clima laboral 2026", descripcion: "Encuesta anónima para conocer la experiencia de nuestros colaboradores.", fecha: "2026-09-18", estado: "activa",
                  preguntas: [
                    { id: "p1", tipo: "escala", texto: "¿Qué tan satisfecho estás con tu ambiente de trabajo?", obligatoria: true },
                    { id: "p2", tipo: "opcion", texto: "¿Cómo es la comunicación con tu líder?", obligatoria: true, opciones: ["Excelente", "Buena", "Regular", "Mala"] },
                    { id: "p3", tipo: "texto", texto: "¿Algún comentario o sugerencia?", obligatoria: false } ] },
                { id: "beneficios", titulo: "Preferencias de beneficios", descripcion: "Ayúdanos a priorizar las prestaciones del próximo año.", fecha: "2026-09-30", estado: "activa",
                  preguntas: [
                    { id: "p1", tipo: "multiple", texto: "¿Qué beneficios te interesan más?", obligatoria: true, opciones: ["Vales", "Seguro", "Home office", "Capacitación"] } ] },
            ],
        };
        guardarLS("contenidoComunidad", c);
    }
    return c;
}
const guardarC = (c) => guardarLS("contenidoComunidad", c);

function leerS() {
    let s = leerLS("solicitudesEmpleados", null);
    if (s === null) { // Ejemplos para ver el diseño; bórralos cuando conectes las reales
        s = [
            { id: "SOL-2841", empleado: "Carlos Mendoza", numero: "00124", depto: "Tecnología", tipo: "Cambio de domicilio", campo: "Domicilio particular",
              actual: "Av. Reforma 120, Col. Juárez, CDMX, C.P. 06600", nuevo: "Calle Durango 245, Col. Roma Norte, CDMX, C.P. 06700",
              motivo: "Cambio de residencia a partir del 1 de septiembre de 2026.", documento: "comprobante_domicilio_carlos.pdf", fecha: "2026-09-03", estado: "pendiente" },
            { id: "DOC-2838", empleado: "Fernanda Ortiz", numero: "00087", depto: "Ventas", tipo: "Validar certificado", campo: "Certificado de estudios",
              actual: "Sin certificado", nuevo: "certificado_licenciatura.pdf", motivo: "Actualización de expediente.", documento: "certificado_licenciatura.pdf", fecha: "2026-09-02", estado: "pendiente" },
            { id: "FAM-2829", empleado: "Luis Navarro", numero: "00102", depto: "Operaciones", tipo: "Alta de familiar", campo: "Familiares",
              actual: "—", nuevo: "Ana Navarro (hija)", motivo: "Nacimiento", documento: "", fecha: "2026-09-01", estado: "revision" },
            { id: "SOL-2814", empleado: "Mariana Torres", numero: "00093", depto: "Ventas", tipo: "Cambio de teléfono", campo: "Teléfono",
              actual: "55 1234 5678", nuevo: "55 8765 4321", motivo: "Número nuevo", documento: "", fecha: "2026-08-28", estado: "aprobada" },
        ];
        guardarLS("solicitudesEmpleados", s);
    }
    return s;
}

// ---------- Vista para todos: Noticias, Eventos, Fechas ----------
const abiertas = new Set();
const ordenar = (a, dir) => a.filter((x) => x.estado !== "borrador")
    .sort((x, y) => dir * (x.fecha || "").localeCompare(y.fecha || ""));

function inscripciones() { return leerLS("inscripcionesEventos", {}); }
function inscritos(id) { return Object.values(inscripciones()).filter((l) => l.includes(id)).length; }

function renderPublico() {
    const c = leerC();

    /* Noticias: las pinta comunidad.js desde la BD (/api/noticias) */
    if (false) ordenar(c.noticias, -1).forEach((n) => {
        const card = h("div", "panel mb-3"), fila = h("div", "d-flex align-items-center gap-3");
        const btn = h("button", "btn btn-link btn-sm p-0 enlace-portal", abiertas.has(n.id) ? "Cerrar" : "Leer");
        btn.onclick = () => { abiertas.has(n.id) ? abiertas.delete(n.id) : abiertas.add(n.id); renderPublico(); };
        fila.append(h("span", "tag-doc tag-comunicado", "Noticia"), h("span", "fw-semibold flex-grow-1", n.titulo),
                    h("small", "text-secondary numero text-nowrap", fechaTexto(n.fecha)), btn);
        card.append(fila);
        if (abiertas.has(n.id)) card.append(h("p", "text-secondary mt-3 mb-0", n.descripcion || ""));
    });

    // Eventos con inscripción
    const mias = inscripciones()[correoSesion()] || [];
    const evs = ordenar(c.eventos, 1);
    const ban = $("bannerEventos"); ban.innerHTML = "";
    if (evs.length) {
        const b = h("div", "panel mb-3 d-flex justify-content-between align-items-center");
        b.style.borderColor = "var(--portal-color)";
        const t = h("div"); t.append(h("div", "fw-semibold texto-portal", "Participa y fortalece tu comunidad"),
            h("small", "text-secondary", "Inscríbete aquí. Los puntos se acreditan después de confirmar tu asistencia."));
        b.append(t, h("span", "fw-semibold texto-portal", `${evs.filter((e) => mias.includes(e.id)).length} eventos registrados`));
        ban.append(b);
    }
    const lE = $("listaEventos"); lE.innerHTML = "";
    evs.forEach((e) => {
        const dentro = mias.includes(e.id);
        const libres = e.cupos ? e.cupos - inscritos(e.id) : null;
        const col = h("div", "col-md-4"), p = h("div", "panel h-100 d-flex flex-column");
        if (dentro) p.style.borderColor = "var(--portal-color)";
        const top = h("div", "d-flex justify-content-between align-items-center mb-2");
        top.append(h("span", "tag-doc tag-evento", e.modalidad || "Evento"), h("small", "texto-portal fw-semibold", e.puntos ? `+${e.puntos} pts` : ""));
        p.append(top, h("div", "fw-bold mb-2", e.titulo),
            h("div", "small text-secondary numero", fechaTexto(e.fecha) + (e.hora ? " · " + e.hora : "")),
            h("div", "small text-secondary", e.lugar || ""),
            h("div", "small text-secondary mb-3", libres === null ? "" : `${Math.max(libres, 0)} lugares disponibles`));
        const btn = h("button", dentro ? "btn btn-outline-secondary w-100 mt-auto" : "btn btn-portal text-white w-100 mt-auto", dentro ? "Cancelar inscripción" : "Quiero participar");
        if (!dentro && libres !== null && libres <= 0) { btn.disabled = true; btn.textContent = "Sin lugares"; }
        btn.onclick = () => {
            const todas = inscripciones(), k = correoSesion() || "empleado";
            const lista = todas[k] || [];
            todas[k] = dentro ? lista.filter((x) => x !== e.id) : [...lista, e.id];
            guardarLS("inscripcionesEventos", todas);
            renderPublico();
        };
        p.append(btn); col.append(p); lE.append(col);
    });
    if (!lE.children.length) lE.append(h("p", "text-secondary", "No hay eventos publicados."));

    const lF = $("listaFechas"); lF.innerHTML = "";
    ordenar(c.fechas, 1).forEach((f) => {
        const col = h("div", "col-md-6"), p = h("div", "panel h-100"), cab = h("div", "d-flex justify-content-between align-items-center mb-2");
        cab.append(h("span", "fw-semibold", f.titulo), h("span", "event-date numero", fechaTexto(f.fecha)));
        p.append(cab, h("div", "text-secondary", f.descripcion || "")); col.append(p); lF.append(col);
    });
    if (!lF.children.length) lF.append(h("p", "text-secondary", "No hay fechas registradas."));
}

renderPublico();
if (!(await cargarRolServidor())) return; // el SERVIDOR confirma si eres admin; si no, solo ves la información

$("tabAdminLi").classList.remove("d-none");
$("adminRoot").innerHTML = `
<div class="d-flex justify-content-between align-items-start mb-3">
    <div>
        <span class="tag-doc tag-reconocimiento">Administrador</span>
        <small class="text-secondary ms-1">Vista administrativa</small>
        <h3 class="fw-bold mt-2 mb-1">Centro de administración</h3>
        <div class="text-secondary">Gestiona eventos, fechas y encuestas. Las noticias se publican en <a href="admin.html" class="enlace-portal">Administrar</a>.</div>
    </div>
    <button class="btn btn-portal text-white fw-semibold" id="admNuevo">Agregar contenido</button>
</div>
<ul class="nav nav-tabs kiosco-tabs mb-4" id="admSub">
    <li class="nav-item"><button class="nav-link active" data-sub="resumen" type="button">Resumen</button></li>
    <li class="nav-item"><button class="nav-link" data-sub="contenido" type="button">Eventos y encuestas</button></li>
    ${puede("solicitudes") ? '<li class="nav-item"><button class="nav-link" data-sub="solicitudes" type="button">Solicitudes <span class="badge-new" id="admBadge"></span></button></li>' : ""}
</ul>
<div id="admVista"></div>`;

document.body.insertAdjacentHTML("beforeend", `
<div class="modal fade" id="modalAdmin" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable" style="max-width:560px"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="mTitulo"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><div class="row g-3">
      <div class="col-6"><label class="form-label small fw-semibold">Tipo</label><select class="form-select" id="mTipo">
        <option value="evento">Evento</option><option value="fecha">Fecha importante</option><option value="encuesta">Encuesta</option></select></div>
      <div class="col-6"><label class="form-label small fw-semibold">Estado</label><select class="form-select" id="mEstado"></select></div>
      <div class="col-12"><label class="form-label small fw-semibold">Título</label><input class="form-control" id="mNombre" maxlength="120"></div>
      <div class="col-6"><label class="form-label small fw-semibold">Fecha</label><input type="date" class="form-control" id="mFecha"></div>
      <div class="col-6 g-ev"><label class="form-label small fw-semibold">Horario</label><input class="form-control" id="mHora" placeholder="12:00-17:00"></div>
      <div class="col-12 g-ev"><label class="form-label small fw-semibold">Lugar</label><input class="form-control" id="mLugar" maxlength="120"></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Modalidad</label><select class="form-select" id="mModalidad"><option>Presencial</option><option>En línea</option></select></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Puntos</label><input type="number" min="0" class="form-control" id="mPuntos"></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Cupos</label><input type="number" min="0" class="form-control" id="mCupos"></div>
      <div class="col-12"><label class="form-label small fw-semibold">Descripción</label><textarea class="form-control" id="mDesc" rows="3" maxlength="1500"></textarea></div>
      <div class="col-12" id="gPreg"><label class="form-label small fw-semibold">Preguntas (una por línea)</label>
        <textarea class="form-control" id="mPreguntas" rows="5" placeholder="¿Cómo calificas tu área? | escala&#10;¿Cómo es la comunicación? | opcion | Buena; Regular; Mala&#10;¿Qué mejorarías? | multiple | Horarios; Herramientas&#10;Comentarios | texto"></textarea>
        <small class="text-secondary">Formato: texto | tipo | opciones separadas por ;  (escala, opcion, multiple, texto)</small></div>
    </div><p class="text-danger small mt-3 mb-0 d-none" id="mError"></p></div>
    <div class="modal-footer"><button class="btn btn-link text-secondary text-decoration-none" data-bs-dismiss="modal">Cancelar</button>
      <button class="btn btn-portal text-white fw-semibold" id="mGuardar">Guardar cambios</button></div>
  </div></div></div>

<div class="modal fade" id="modalSol" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable" style="max-width:600px"><div class="modal-content">
    <div class="modal-header"><div><h5 class="modal-title d-inline" id="sTitulo"></h5> <span class="badge-new ms-2" id="sEstado"></span><div class="folio mt-1" id="sMeta"></div></div><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">
      <div class="d-flex align-items-center gap-3 forma-card mb-3"><div class="avatar-circle avatar-lg" id="sIni"></div><div><div class="fw-semibold" id="sNombre"></div><small class="text-secondary" id="sDepto"></small></div></div>
      <small class="text-secondary text-uppercase fw-semibold">Información solicitada</small>
      <div class="panel p-0 mt-2 mb-3">
        <div class="fila-dato px-3"><span>Campo</span><span id="sCampo"></span></div>
        <div class="fila-dato px-3"><span>Información actual</span><span id="sActual" class="text-end"></span></div>
        <div class="fila-dato px-3"><span class="texto-portal">Cambio solicitado</span><span id="sNuevo" class="text-end"></span></div>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-6"><div class="panel h-100"><small class="text-secondary">Motivo</small><div id="sMotivo" class="mt-1"></div></div></div>
        <div class="col-6"><div class="panel h-100"><small class="text-secondary">Documento adjunto</small><div id="sDoc" class="mt-1 fw-semibold"></div></div></div>
      </div>
      <label class="form-label small fw-semibold">Comentario para el empleado</label>
      <textarea class="form-control" id="sComentario" rows="3" placeholder="Agrega una observación o indica si hace falta información..."></textarea>
    </div>
    <div class="modal-footer"><button class="btn btn-link text-secondary text-decoration-none me-auto" data-bs-dismiss="modal">Cerrar</button>
      <button class="btn btn-editar fw-semibold" id="sRechazar">Rechazar</button><button class="btn btn-portal text-white fw-semibold" id="sAprobar">Aprobar solicitud</button></div>
  </div></div></div>

<div class="modal fade" id="modalResp" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="rTitulo"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body" id="rCuerpo"></div></div></div></div>`);

const mAdmin = new bootstrap.Modal($("modalAdmin"));
const mSol = new bootstrap.Modal($("modalSol"));
const mResp = new bootstrap.Modal($("modalResp"));
let sub = "resumen", filtro = "todo", editando = null, solActual = null;

const todos = (c) => Object.keys(COLS).flatMap((t) => c[COLS[t]].map((item) => ({ tipo: t, item })))
    .sort((a, b) => (b.item.fecha || "").localeCompare(a.item.fecha || ""));
const refrescar = () => { renderPublico(); renderAdmin(); };

function renderAdmin() {
    const vista = $("admVista"); vista.innerHTML = "";
    const c = leerC();
    const pend = puede("solicitudes") ? leerS().filter((s) => s.estado === "pendiente").length : 0;
    const badge = $("admBadge");
    if (badge) { badge.textContent = pend; badge.classList.toggle("d-none", !pend); }
    document.querySelectorAll("#admSub [data-sub]").forEach((b) => b.classList.toggle("active", b.dataset.sub === sub));

    if (sub === "resumen") {
        const stats = [
            puede("solicitudes") ? ["Solicitudes pendientes", pend, "Requieren atención"] : ["Fechas publicadas", c.fechas.filter((x) => x.estado !== "borrador").length, "Fechas importantes"],
            ["Encuestas activas", c.encuestas.filter((x) => x.estado === "activa").length, "Consulta respuestas"],
            ["Eventos publicados", c.eventos.filter((x) => x.estado !== "borrador").length, "Gestiona inscripciones"],
            ];
        const row = h("div", "row g-3 mb-4");
        stats.forEach(([t, n, s]) => {
            const col = h("div", "col-md-4"), card = h("div", "card-stat");
            card.append(h("small", "text-secondary", t), h("div", "stat-value text-dark", String(n)), h("small", "text-secondary", s));
            col.append(card); row.append(col);
        });
        vista.append(row);
        const panel = h("div", "panel"), cab = h("div", "d-flex justify-content-between align-items-start mb-2");
        const izq = h("div"); izq.append(h("h6", "fw-bold mb-0", "Comunicación reciente"), h("small", "text-secondary", "Eventos y encuestas en un solo lugar"));
        const ver = h("button", "btn btn-link btn-sm p-0 enlace-portal", "Administrar todo");
        ver.onclick = () => { sub = "contenido"; renderAdmin(); };
        cab.append(izq, ver); panel.append(cab);
        todos(c).filter((x) => x.tipo !== "fecha").slice(0, 5).forEach(({ tipo, item }) => {
            const f = h("div", "d-flex justify-content-between align-items-center py-2 border-top"), i = h("div");
            i.append(h("small", "texto-portal fw-semibold me-2", NOMBRE[tipo]), h("small", "text-secondary", ETQ[item.estado] || ""), h("div", "", item.titulo));
            f.append(i, h("small", "numero text-secondary", fechaTexto(item.fecha))); panel.append(f);
        });
        vista.append(panel);
    }

    if (sub === "contenido") {
        const cab = h("div", "d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2");
        const t = h("div"); t.append(h("h6", "fw-bold mb-0", "Contenido interno"), h("small", "text-secondary", "Crea y modifica eventos, fechas y encuestas desde la misma vista."));
        const seg = h("div", "segmentado");
        [["todo", "Todo"], ["evento", "Eventos"], ["fecha", "Fechas"], ["encuesta", "Encuestas"]].forEach(([v, n]) => {
            const b = h("button", filtro === v ? "activo" : "", n); b.type = "button";
            b.onclick = () => { filtro = v; renderAdmin(); }; seg.append(b);
        });
        cab.append(t, seg); vista.append(cab);
        const grid = h("div", "row g-3");
        const resp = leerLS("respuestasEncuestas", []);
        todos(c).filter((x) => filtro === "todo" || x.tipo === filtro).forEach(({ tipo, item }) => {
            const col = h("div", "col-md-6"), p = h("div", "panel h-100 d-flex flex-column"), top = h("div", "d-flex justify-content-between align-items-start mb-2");
            const e = h("div"); e.append(h("span", "tag-doc tag-reconocimiento me-2", NOMBRE[tipo]), h("small", "text-secondary", ETQ[item.estado] || ""));
            const bt = h("div", "d-flex gap-2");
            if (tipo === "encuesta") { const r = h("button", "btn btn-editar btn-sm", "Respuestas"); r.onclick = () => verRespuestas(item); bt.append(r); }
            const be = h("button", "btn btn-editar btn-sm", "Editar"); be.onclick = () => abrirForm(tipo, item);
            const bd = h("button", "btn btn-editar btn-sm", "Eliminar");
            bd.onclick = () => {
                if (!confirm(`¿Eliminar "${item.titulo}"?`)) return;
                const cc = leerC(); cc[COLS[tipo]] = cc[COLS[tipo]].filter((x) => x.id !== item.id); guardarC(cc); refrescar();
            };
            bt.append(be, bd); top.append(e, bt);
            const extra = tipo === "encuesta" ? resp.filter((r) => r.encuestaId === item.id).length + " respuestas"
                : tipo === "evento" ? inscritos(item.id) + " inscripciones" : "";
            const pie = h("div", "d-flex justify-content-between text-secondary small border-top pt-2 mt-auto");
            pie.append(h("span", "numero", fechaTexto(item.fecha)), h("span", "", extra));
            p.append(top, h("div", "fw-semibold mb-1", item.titulo), h("div", "text-secondary mb-3", item.descripcion || ""), pie);
            col.append(p); grid.append(col);
        });
        if (!grid.children.length) grid.append(h("p", "text-secondary", "No hay contenido en esta categoría."));
        vista.append(grid);
    }

    if (sub === "solicitudes" && puede("solicitudes")) {
        leerS().forEach((s) => {
            const p = h("div", "panel mb-3 d-flex align-items-center gap-3"), info = h("div", "flex-grow-1");
            const l1 = h("div"); l1.append(h("span", "fw-semibold me-2", s.empleado), h("span", "folio", s.id));
            info.append(l1, h("div", "", s.tipo), h("small", "text-secondary", `${fechaTexto(s.fecha)} · ${ESTADO_SOL[s.estado]}`));
            const acc = h("div", "d-flex gap-2 align-items-center");
            const ver = h("button", "btn btn-editar btn-sm", s.estado === "pendiente" ? "Ver solicitud" : "Ver detalle"); ver.onclick = () => abrirSol(s.id);
            if (s.estado === "pendiente") {
                const ir = h("button", "btn btn-portal text-white btn-sm", "Iniciar revisión");
                ir.onclick = () => { cambiarSol(s.id, { estado: "revision" }); abrirSol(s.id); };
                acc.append(ver, ir);
            } else acc.append(h("small", "fw-semibold " + (s.estado === "aprobada" ? "texto-verde" : "text-secondary"), ESTADO_SOL[s.estado]), ver);
            p.append(h("div", "avatar-circle avatar-lg", ini(s.empleado)), info, acc); vista.append(p);
        });
    }
}

$("admSub").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sub]"); if (!b) return;
    sub = b.dataset.sub; renderAdmin();
});

function ajustar() {
    const t = $("mTipo").value, v = $("mEstado").value;
    document.querySelectorAll(".g-ev").forEach((x) => x.classList.toggle("d-none", t !== "evento"));
    $("gPreg").classList.toggle("d-none", t !== "encuesta");
    const ops = t === "encuesta" ? [["activa", "Activa"], ["inactiva", "Inactiva"]] : [["publicado", "Publicado"], ["borrador", "Borrador"]];
    $("mEstado").innerHTML = ""; ops.forEach(([val, txt]) => $("mEstado").add(new Option(txt, val)));
    if (ops.some(([val]) => val === v)) $("mEstado").value = v;
}
$("mTipo").addEventListener("change", ajustar);

const serializar = (ps) => (ps || []).map((p) => `${p.texto} | ${p.tipo}${p.opciones ? " | " + p.opciones.join("; ") : ""}`).join("\n");
function parsear(txt) {
    return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
        const [texto, tipo = "texto", ops = ""] = l.split("|").map((x) => x.trim());
        const p = { id: "p" + (i + 1), texto, tipo: ["escala", "opcion", "multiple", "texto"].includes(tipo) ? tipo : "texto" };
        if (p.tipo === "opcion" || p.tipo === "multiple") {
            p.opciones = ops.split(";").map((x) => x.trim()).filter(Boolean);
            if (p.opciones.length < 2) { delete p.opciones; p.tipo = "texto"; }
        }
        p.obligatoria = p.tipo !== "texto";
        return p;
    });
}

function abrirForm(tipo, item) {
    editando = item ? { tipo, id: item.id } : null;
    $("mTitulo").textContent = item ? "Editar " + NOMBRE[tipo].toLowerCase() : "Agregar contenido";
    $("mTipo").value = tipo; $("mTipo").disabled = !!item;
    ajustar();
    $("mEstado").value = item?.estado || $("mEstado").options[0].value;
    $("mNombre").value = item?.titulo || ""; $("mFecha").value = item?.fecha || "";
    $("mHora").value = item?.hora || ""; $("mLugar").value = item?.lugar || "";
    $("mModalidad").value = item?.modalidad || "Presencial";
    $("mPuntos").value = item?.puntos ?? ""; $("mCupos").value = item?.cupos ?? "";
    $("mDesc").value = item?.descripcion || ""; $("mPreguntas").value = serializar(item?.preguntas);
    $("mError").classList.add("d-none");
    mAdmin.show();
}
$("admNuevo").onclick = () => abrirForm("evento", null);
const errorForm = (t) => { $("mError").textContent = t; $("mError").classList.remove("d-none"); };

$("mGuardar").addEventListener("click", () => {
    const tipo = $("mTipo").value, titulo = $("mNombre").value.trim();
    if (!titulo) return errorForm("Escribe un título.");
    const datos = { titulo, descripcion: $("mDesc").value.trim(), fecha: $("mFecha").value, estado: $("mEstado").value };
    if (tipo === "evento") {
        Object.assign(datos, { hora: $("mHora").value.trim(), lugar: $("mLugar").value.trim(), modalidad: $("mModalidad").value,
            puntos: Number($("mPuntos").value) || 0, cupos: Number($("mCupos").value) || 0 });
    }
    if (tipo === "encuesta") {
        datos.preguntas = parsear($("mPreguntas").value);
        if (!datos.preguntas.length) return errorForm("Agrega al menos una pregunta.");
    }
    const c = leerC(), col = COLS[tipo];
    if (editando) {
        const i = c[col].findIndex((x) => x.id === editando.id);
        if (i >= 0) c[col][i] = { ...c[col][i], ...datos, editadoPor: correoSesion() };
    } else {
        c[col].unshift({ id: tipo[0] + Date.now(), ...datos, creadoPor: correoSesion() });
    }
    if (guardarC(c)) { mAdmin.hide(); refrescar(); }
});

function verRespuestas(enc) {
    const rs = leerLS("respuestasEncuestas", []).filter((r) => r.encuestaId === enc.id);
    $("rTitulo").textContent = enc.titulo;
    const cuerpo = $("rCuerpo"); cuerpo.innerHTML = "";
    cuerpo.append(h("p", "text-secondary small", rs.length + " respuesta(s)"));
    (enc.preguntas || []).forEach((p) => {
        const b = h("div", "mb-3"); b.append(h("div", "fw-semibold small mb-1", p.texto));
        const vals = rs.map((r) => r.respuestas?.[p.id]).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length));
        if (!vals.length) b.append(h("small", "text-secondary", "Sin respuestas"));
        else if (p.tipo === "escala") b.append(h("div", "", "Promedio: " + (vals.reduce((a, v) => a + Number(v), 0) / vals.length).toFixed(1) + " / 5"));
        else if (p.tipo === "texto") vals.forEach((v) => b.append(h("div", "small border-bottom py-1", v)));
        else {
            const cuenta = {}; vals.flat().forEach((v) => (cuenta[v] = (cuenta[v] || 0) + 1));
            Object.entries(cuenta).forEach(([k, n]) => {
                const f = h("div", "d-flex justify-content-between small"); f.append(h("span", "", k), h("span", "numero", String(n))); b.append(f);
            });
        }
        cuerpo.append(b);
    });
    mResp.show();
}

function cambiarSol(id, cambios) {
    const l = leerS(), i = l.findIndex((s) => s.id === id);
    if (i >= 0) { l[i] = { ...l[i], ...cambios }; guardarLS("solicitudesEmpleados", l); }
    renderAdmin();
}
function abrirSol(id) {
    const s = leerS().find((x) => x.id === id); if (!s) return;
    solActual = s;
    $("sTitulo").textContent = s.tipo; $("sEstado").textContent = ESTADO_SOL[s.estado];
    $("sMeta").textContent = `${s.id} · Recibida el ${fechaTexto(s.fecha)}`;
    $("sIni").textContent = ini(s.empleado); $("sNombre").textContent = s.empleado;
    $("sDepto").textContent = `Empleado ${s.numero || ""} · ${s.depto || ""}`;
    $("sCampo").textContent = s.campo || ""; $("sActual").textContent = s.actual || "";
    $("sNuevo").textContent = s.nuevo || ""; $("sMotivo").textContent = s.motivo || "—";
    $("sDoc").textContent = s.documento || "Sin documento";
    $("sComentario").value = s.comentario || "";
    const cerrada = s.estado === "aprobada" || s.estado === "rechazada";
    $("sComentario").disabled = cerrada;
    $("sRechazar").classList.toggle("d-none", cerrada); $("sAprobar").classList.toggle("d-none", cerrada);
    mSol.show();
}
function resolver(estado) {
    cambiarSol(solActual.id, { estado, comentario: $("sComentario").value.trim(), revisadoPor: correoSesion(), fechaRevision: new Date().toISOString().slice(0, 10) });
    mSol.hide();
}
$("sAprobar").onclick = () => resolver("aprobada");
$("sRechazar").onclick = () => resolver("rechazada");

renderAdmin();
})();