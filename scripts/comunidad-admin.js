// Comunidad > "Noticias y eventos": eventos con inscripción (BD) y fechas especiales.
// Las noticias las pinta comunidad.js. Si eres admin (lo confirma el servidor) aparece "Administrar comunidad".
(async function () {
const $ = (id) => document.getElementById(id);
const NOMBRE = { evento: "Evento", fecha: "Fecha importante" };
const ETQ = { publicado: "Publicado", borrador: "Borrador" };

function h(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
}
function isoDe(t) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(t || "")) return t;
    const m = /^(\d{2}) (\w{3}) (\d{4})$/.exec(t || "");
    const i = m ? MESES_CORTOS.indexOf(m[2]) : -1;
    return i < 0 ? "" : `${m[3]}-${String(i + 1).padStart(2, "0")}-${m[1]}`;
}
function aviso(cont, texto, clase = "alert-success") {
    const a = h("div", `alert ${clase} py-2 small`, texto);
    cont.before(a);
    setTimeout(() => a.remove(), 4000);
}

/* ---------- Fechas especiales (se guardan en el navegador, como las tenía la página) ---------- */
function leerFechas() {
    const c = leerLS("contenidoComunidad", null) || {};
    if (!Array.isArray(c.fechas)) {
        const base = typeof fechasEspeciales !== "undefined" ? fechasEspeciales : [];
        c.fechas = base.map((f, i) => ({ id: "f" + i, titulo: f.titulo, descripcion: f.texto, fecha: isoDe(f.fecha), estado: "publicado" }));
        guardarLS("contenidoComunidad", c);
    }
    return c.fechas;
}
function guardarFechas(fechas) {
    const c = leerLS("contenidoComunidad", null) || {};
    c.fechas = fechas;
    return guardarLS("contenidoComunidad", c);
}

/* ---------- Eventos (BD): inscribirse suma puntos, cancelar los resta ---------- */
let eventos = [];
let esAdmin = false;

async function cargarEventos() {
    try {
        eventos = (await api("/eventos")).eventos;
    } catch (e) {
        console.error(e);
        eventos = [];
    }
}

function renderEventos() {
    const mios = eventos.filter((e) => e.inscrito);
    const ban = $("bannerEventos"); ban.innerHTML = "";
    if (eventos.length) {
        const b = h("div", "panel mb-3 d-flex justify-content-between align-items-center");
        b.style.borderColor = "var(--portal-color)";
        const t = h("div");
        t.append(h("div", "fw-semibold texto-portal", "Participa y fortalece tu comunidad"),
            h("small", "text-secondary", "Al inscribirte ganas los puntos del evento. Si cancelas, se descuentan."));
        b.append(t, h("span", "fw-semibold texto-portal", `${mios.length} evento${mios.length === 1 ? "" : "s"} registrado${mios.length === 1 ? "" : "s"}`));
        ban.append(b);
    }

    const lE = $("listaEventos"); lE.innerHTML = "";
    eventos.forEach((e) => {
        const dentro = e.inscrito;
        const libres = e.cupos ? e.cupos - e.inscritos : null;
        const col = h("div", "col-md-4"), p = h("div", "panel h-100 d-flex flex-column");
        if (dentro) p.style.borderColor = "var(--portal-color)";
        const top = h("div", "d-flex justify-content-between align-items-center mb-2");
        top.append(h("span", "tag-doc tag-evento", e.modalidad || "Evento"),
                   h("small", "texto-portal fw-semibold", e.puntos ? `+${e.puntos} pts` : ""));
        p.append(top, h("div", "fw-bold mb-2", e.titulo));
        if (e.descripcion) p.append(h("div", "small text-secondary mb-2", e.descripcion));
        p.append(
            h("div", "small text-secondary numero", fechaTexto(e.fecha) + (e.hora ? " · " + e.hora : "")),
            h("div", "small text-secondary", e.lugar || ""),
            h("div", "small text-secondary mb-3", libres === null ? "Sin límite de lugares" : `${Math.max(libres, 0)} lugares disponibles`));

        const btn = h("button", dentro ? "btn btn-outline-secondary w-100 mt-auto" : "btn btn-portal text-white w-100 mt-auto",
                      dentro ? "Cancelar inscripción" : "Quiero participar");
        if (!dentro && libres !== null && libres <= 0) { btn.disabled = true; btn.textContent = "Sin lugares"; }

        btn.onclick = async () => {
            if (dentro && e.puntos && !confirm(`Si cancelas se te descuentan ${e.puntos} pts. ¿Cancelar tu inscripción?`)) return;
            btn.disabled = true;
            try {
                const r = await api(`/eventos/${e.id}/inscripcion`, { method: dentro ? "DELETE" : "POST" });
                if (esAdmin) await refrescar();
                else { await cargarEventos(); renderEventos(); }
                aviso($("listaEventos"), dentro
                    ? `Inscripción cancelada${r.puntos ? ` (${r.puntos} pts)` : ""}.`
                    : `¡Listo, quedaste inscrito!${r.puntos ? ` Ganaste +${r.puntos} pts.` : ""}`, dentro ? "alert-secondary" : "alert-success");
            } catch (err) {
                alert(err.mensaje || "No se pudo completar la acción.");
                btn.disabled = false;
            }
        };
        p.append(btn); col.append(p); lE.append(col);
    });
    if (!lE.children.length) lE.append(h("p", "text-secondary", "No hay eventos próximos."));
}

function renderFechas() {
    const lF = $("listaFechas"); lF.innerHTML = "";
    leerFechas().filter((f) => f.estado !== "borrador")
        .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
        .forEach((f) => {
            const col = h("div", "col-md-6"), p = h("div", "panel h-100"), cab = h("div", "d-flex justify-content-between align-items-center mb-2");
            cab.append(h("span", "fw-semibold", f.titulo), h("span", "event-date numero", fechaTexto(f.fecha)));
            p.append(cab, h("div", "text-secondary", f.descripcion || "")); col.append(p); lF.append(col);
        });
    if (!lF.children.length) lF.append(h("p", "text-secondary", "No hay fechas registradas."));
}

await cargarEventos();
renderEventos();
renderFechas();

/* ============================ ADMINISTRAR COMUNIDAD ============================ */
if (!(await cargarRolServidor())) return; // el SERVIDOR confirma si eres admin; si no, solo ves la información
esAdmin = true;

let eventosAdmin = [];
async function cargarEventosAdmin() {
    try { eventosAdmin = (await api("/admin/eventos")).eventos; }
    catch (e) { console.error(e); eventosAdmin = []; }
}
await cargarEventosAdmin();

$("tabAdminLi").classList.remove("d-none");
$("adminRoot").innerHTML = `
<div class="d-flex justify-content-between align-items-start mb-3">
    <div>
        <span class="tag-doc tag-reconocimiento">Administrador</span>
        <small class="text-secondary ms-1">Vista administrativa</small>
        <h3 class="fw-bold mt-2 mb-1">Centro de administración</h3>
        <div class="text-secondary">Gestiona eventos y fechas importantes. Las noticias, encuestas y solicitudes están en <a href="admin.html" class="enlace-portal">Administrar</a>.</div>
    </div>
    <button class="btn btn-portal text-white fw-semibold" id="admNuevo">Agregar contenido</button>
</div>
<ul class="nav nav-tabs kiosco-tabs mb-4" id="admSub">
    <li class="nav-item"><button class="nav-link active" data-sub="resumen" type="button">Resumen</button></li>
    <li class="nav-item"><button class="nav-link" data-sub="contenido" type="button">Eventos y fechas</button></li>
</ul>
<div id="admVista"></div>`;

document.body.insertAdjacentHTML("beforeend", `
<div class="modal fade" id="modalAdmin" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable" style="max-width:560px"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="mTitulo"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><div class="row g-3">
      <div class="col-6"><label class="form-label small fw-semibold">Tipo</label><select class="form-select" id="mTipo">
        <option value="evento">Evento</option><option value="fecha">Fecha importante</option></select></div>
      <div class="col-6"><label class="form-label small fw-semibold">Estado</label><select class="form-select" id="mEstado">
        <option value="publicado">Publicado</option><option value="borrador">Borrador</option></select></div>
      <div class="col-12"><label class="form-label small fw-semibold">Título</label><input class="form-control" id="mNombre" maxlength="120"></div>
      <div class="col-6"><label class="form-label small fw-semibold">Fecha</label><input type="date" class="form-control" id="mFecha"></div>
      <div class="col-6 g-ev"><label class="form-label small fw-semibold">Horario</label><input class="form-control" id="mHora" placeholder="12:00-17:00" maxlength="30"></div>
      <div class="col-12 g-ev"><label class="form-label small fw-semibold">Lugar</label><input class="form-control" id="mLugar" maxlength="120"></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Modalidad</label><select class="form-select" id="mModalidad"><option>Presencial</option><option>En línea</option></select></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Puntos</label><input type="number" min="0" max="500" class="form-control" id="mPuntos"></div>
      <div class="col-4 g-ev"><label class="form-label small fw-semibold">Cupos <small class="text-secondary">(0 = sin límite)</small></label><input type="number" min="0" class="form-control" id="mCupos"></div>
      <div class="col-12"><label class="form-label small fw-semibold">Descripción</label><textarea class="form-control" id="mDesc" rows="3" maxlength="500"></textarea></div>
      <div class="col-12 g-ev d-none" id="mAvisoPts"><small class="text-secondary">Quien ya esté inscrito conserva los puntos que se le dieron; el cambio aplica a nuevas inscripciones.</small></div>
    </div><p class="text-danger small mt-3 mb-0 d-none" id="mError"></p></div>
    <div class="modal-footer"><button class="btn btn-link text-secondary text-decoration-none" data-bs-dismiss="modal">Cancelar</button>
      <button class="btn btn-portal text-white fw-semibold" id="mGuardar">Guardar cambios</button></div>
  </div></div></div>`);

const mAdmin = new bootstrap.Modal($("modalAdmin"));
let sub = "resumen", filtro = "todo", editando = null;

const todos = () => [
    ...eventosAdmin.map((item) => ({ tipo: "evento", item })),
    ...leerFechas().map((item) => ({ tipo: "fecha", item })),
].sort((a, b) => (b.item.fecha || "").localeCompare(a.item.fecha || ""));

async function refrescar() {
    await Promise.all([cargarEventos(), cargarEventosAdmin()]);
    renderEventos(); renderFechas(); renderAdmin();
}

function renderAdmin() {
    const vista = $("admVista"); vista.innerHTML = "";
    document.querySelectorAll("#admSub [data-sub]").forEach((b) => b.classList.toggle("active", b.dataset.sub === sub));

    if (sub === "resumen") {
        const publicados = eventosAdmin.filter((x) => x.estado !== "borrador");
        const stats = [
            ["Eventos publicados", publicados.length, "Con inscripción"],
            ["Inscripciones", eventosAdmin.reduce((s, e) => s + e.inscritos, 0), "En todos los eventos"],
            ["Fechas publicadas", leerFechas().filter((x) => x.estado !== "borrador").length, "Fechas importantes"],
        ];
        const row = h("div", "row g-3 mb-4");
        stats.forEach(([t, n, s]) => {
            const col = h("div", "col-md-4"), card = h("div", "card-stat");
            card.append(h("small", "text-secondary", t), h("div", "stat-value text-dark", String(n)), h("small", "text-secondary", s));
            col.append(card); row.append(col);
        });
        vista.append(row);

        const panel = h("div", "panel"), cab = h("div", "d-flex justify-content-between align-items-start mb-2");
        const izq = h("div"); izq.append(h("h6", "fw-bold mb-0", "Eventos"), h("small", "text-secondary", "Inscripciones por evento"));
        const ver = h("button", "btn btn-link btn-sm p-0 enlace-portal", "Administrar todo");
        ver.onclick = () => { sub = "contenido"; renderAdmin(); };
        cab.append(izq, ver); panel.append(cab);
        eventosAdmin.slice(0, 6).forEach((e) => {
            const f = h("div", "d-flex justify-content-between align-items-center py-2 border-top"), i = h("div");
            i.append(h("small", "text-secondary", `${ETQ[e.estado]} · ${fechaTexto(e.fecha)}`), h("div", "", e.titulo));
            f.append(i, h("small", "numero text-secondary", `${e.inscritos}${e.cupos ? " / " + e.cupos : ""} inscritos`));
            panel.append(f);
        });
        if (!eventosAdmin.length) panel.append(h("p", "text-secondary mb-0", "Aún no hay eventos."));
        vista.append(panel);
    }

    if (sub === "contenido") {
        const cab = h("div", "d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2");
        const t = h("div"); t.append(h("h6", "fw-bold mb-0", "Contenido interno"), h("small", "text-secondary", "Crea y modifica eventos y fechas importantes."));
        const seg = h("div", "segmentado");
        [["todo", "Todo"], ["evento", "Eventos"], ["fecha", "Fechas"]].forEach(([v, n]) => {
            const b = h("button", filtro === v ? "activo" : "", n); b.type = "button";
            b.onclick = () => { filtro = v; renderAdmin(); }; seg.append(b);
        });
        cab.append(t, seg); vista.append(cab);

        const grid = h("div", "row g-3");
        todos().filter((x) => filtro === "todo" || x.tipo === filtro).forEach(({ tipo, item }) => {
            const col = h("div", "col-md-6"), p = h("div", "panel h-100 d-flex flex-column"), top = h("div", "d-flex justify-content-between align-items-start mb-2");
            const e = h("div"); e.append(h("span", "tag-doc tag-reconocimiento me-2", NOMBRE[tipo]), h("small", "text-secondary", ETQ[item.estado] || ""));
            const bt = h("div", "d-flex gap-2");
            const be = h("button", "btn btn-editar btn-sm", "Editar"); be.onclick = () => abrirForm(tipo, item);
            const bd = h("button", "btn btn-editar btn-sm", "Eliminar");
            bd.onclick = async () => {
                const extra = tipo === "evento" && item.inscritos
                    ? `\n\nTiene ${item.inscritos} inscrito(s): se les descontarán los puntos y se les avisará.` : "";
                if (!confirm(`¿Eliminar "${item.titulo}"?${extra}`)) return;
                try {
                    if (tipo === "evento") await api(`/admin/eventos/${item.id}`, { method: "DELETE" });
                    else guardarFechas(leerFechas().filter((x) => x.id !== item.id));
                    await refrescar();
                } catch (err) { alert(err.mensaje || "No se pudo eliminar."); }
            };
            bt.append(be, bd); top.append(e, bt);
            const pie = h("div", "d-flex justify-content-between text-secondary small border-top pt-2 mt-auto");
            pie.append(h("span", "numero", fechaTexto(item.fecha)),
                       h("span", "", tipo === "evento" ? `${item.puntos} pts · ${item.inscritos}${item.cupos ? "/" + item.cupos : ""} inscritos` : ""));
            p.append(top, h("div", "fw-semibold mb-1", item.titulo), h("div", "text-secondary mb-3", item.descripcion || ""), pie);
            col.append(p); grid.append(col);
        });
        if (!grid.children.length) grid.append(h("p", "text-secondary", "No hay contenido en esta categoría."));
        vista.append(grid);
    }
}

$("admSub").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sub]"); if (!b) return;
    sub = b.dataset.sub; renderAdmin();
});

function ajustar() {
    const esEvento = $("mTipo").value === "evento";
    document.querySelectorAll(".g-ev").forEach((x) => x.classList.toggle("d-none", !esEvento));
    $("mAvisoPts").classList.toggle("d-none", !(esEvento && editando));
}
$("mTipo").addEventListener("change", ajustar);

function abrirForm(tipo, item) {
    editando = item ? { tipo, id: item.id } : null;
    $("mTitulo").textContent = item ? "Editar " + NOMBRE[tipo].toLowerCase() : "Agregar contenido";
    $("mTipo").value = tipo; $("mTipo").disabled = !!item;
    $("mEstado").value = item?.estado || "publicado";
    $("mNombre").value = item?.titulo || ""; $("mFecha").value = item?.fecha || "";
    $("mHora").value = item?.hora || ""; $("mLugar").value = item?.lugar || "";
    $("mModalidad").value = item?.modalidad || "Presencial";
    $("mPuntos").value = item?.puntos ?? 50; $("mCupos").value = item?.cupos ?? 0;
    $("mDesc").value = item?.descripcion || "";
    $("mError").classList.add("d-none");
    ajustar();
    mAdmin.show();
}
$("admNuevo").onclick = () => abrirForm("evento", null);
const errorForm = (t) => { $("mError").textContent = t; $("mError").classList.remove("d-none"); };

$("mGuardar").addEventListener("click", async () => {
    const tipo = $("mTipo").value, titulo = $("mNombre").value.trim();
    if (!titulo) return errorForm("Escribe un título.");
    if (!$("mFecha").value) return errorForm("Elige la fecha.");
    const datos = { titulo, descripcion: $("mDesc").value.trim(), fecha: $("mFecha").value, estado: $("mEstado").value };

    try {
        if (tipo === "evento") {
            Object.assign(datos, {
                hora: $("mHora").value.trim(), lugar: $("mLugar").value.trim(), modalidad: $("mModalidad").value,
                puntos: Number($("mPuntos").value) || 0, cupos: Number($("mCupos").value) || 0,
            });
            if (editando) await api(`/admin/eventos/${editando.id}`, { method: "PUT", body: datos });
            else await api("/admin/eventos", { method: "POST", body: datos });
        } else {
            const fechas = leerFechas();
            if (editando) {
                const i = fechas.findIndex((x) => x.id === editando.id);
                if (i >= 0) fechas[i] = { ...fechas[i], ...datos };
            } else {
                fechas.unshift({ id: "f" + Date.now(), ...datos });
            }
            guardarFechas(fechas);
        }
        mAdmin.hide();
        await refrescar();
    } catch (err) {
        errorForm(err.mensaje || "No se pudo guardar.");
    }
});

renderAdmin();
})();
