// El rol YA NO se decide en el navegador por el correo guardado:
// lo confirma el servidor con /api/admin/yo (que revisa el rol en la BD).
let ROL_SERVIDOR = null;

const PERMISOS = {
    admin: ["contenido"],   // las solicitudes reales se revisan en admin.html
};
const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

async function cargarRolServidor() {
    try {
        const host = window.location.hostname || "localhost";
        const r = await fetch(`http://${host}:3000/api/admin/yo`, { credentials: "include" });
        const d = await r.json();
        ROL_SERVIDOR = d.ok ? d.rol : null;
    } catch (e) {
        ROL_SERVIDOR = null;
    }
    return ROL_SERVIDOR;
}

function correoSesion() {
    try { return (localStorage.getItem("correoSesion") || "").toLowerCase(); }
    catch (e) { return ""; }
}
function rolSesion() { return ROL_SERVIDOR; }
function puede(permiso) {
    const r = rolSesion();
    return !!r && (PERMISOS[r] || []).includes(permiso);
}
function leerLS(clave, defecto) {
    try {
        const v = JSON.parse(localStorage.getItem(clave));
        return v === null ? defecto : v;
    } catch (e) { return defecto; }
}
function guardarLS(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (e) { alert("No se pudo guardar."); return false; }
}
function fechaTexto(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? `${m[3]} ${MESES_CORTOS[Number(m[2]) - 1]} ${m[1]}` : (iso || "");
}
