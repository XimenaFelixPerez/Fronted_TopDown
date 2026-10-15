const ROLES_CORREO = {
    "rh@empleado.com": "rh",
    "mkt@empleado.com": "marketing",
};
const PERMISOS = {
    rh: ["contenido", "solicitudes"],
    marketing: ["contenido"],
};
const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function correoSesion() {
    try { return (localStorage.getItem("correoSesion") || "").toLowerCase(); }
    catch (e) { return ""; }
}
function rolSesion() { return ROLES_CORREO[correoSesion()] || null; }
function puede(permiso) {
    const r = rolSesion();
    return !!r && PERMISOS[r].includes(permiso);
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