(function () {
const $ = (id) => document.getElementById(id);
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fecha = (iso) => { const [a, m, d] = String(iso || "").split("-"); return a ? `${d} ${MES[Number(m) - 1]} ${a}` : ""; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pts = (n) => Number(n).toLocaleString("es-MX");

const formasDeGanar = [
    { titulo: "Responder una encuesta", puntos: "30-50" },
    { titulo: "Participar en un evento", puntos: 80 },
    { titulo: "Completar un curso", puntos: 100 },
    { titulo: "Enviar felicitación", puntos: 10 },
];

$("formasPuntos").innerHTML = formasDeGanar.map((f) => `
    <div class="col-md-3 col-6">
        <div class="forma-card">
            <div>${f.titulo}</div>
            <div class="fw-bold fs-5 texto-portal mt-2">+${f.puntos} pts</div>
        </div>
    </div>`).join("");

async function cargarPuntos() {
    try {
        const d = await api("/desempeno");
        const { total, nivel } = d;

        $("nivelNombre").textContent = nivel.nombre;
        $("nivelNumero").textContent = `Nivel ${nivel.numero} de ${nivel.de}`;

        if (nivel.siguiente) {
            const porcentaje = Math.min(100, Math.round((total / nivel.siguiente.min) * 100));
            $("barraNivel").style.width = porcentaje + "%";
            $("progresoTexto").textContent = `${pts(total)} / ${pts(nivel.siguiente.min)} pts (${porcentaje}%)`;
            $("siguienteNombre").textContent = nivel.siguiente.nombre;
            $("ptsFaltantes").textContent = `${pts(nivel.siguiente.min - total)} pts necesarios`;
        } else {
            $("barraNivel").style.width = "100%";
            $("progresoTexto").textContent = `${pts(total)} pts`;
            $("siguienteNombre").textContent = "Nivel máximo alcanzado";
            $("ptsFaltantes").textContent = "";
        }

        $("historialPuntos").innerHTML = d.historial.length
            ? d.historial.map((h) => `
                <div class="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
                    <div>
                        <div>${esc(h.Concepto)}</div>
                        <small class="text-secondary">${fecha(h.Fecha)}</small>
                    </div>
                    <span class="fw-semibold texto-portal numero">${h.Puntos > 0 ? "+" : ""}${pts(h.Puntos)} pts</span>
                </div>`).join("")
            : `<div class="px-4 py-4 text-secondary">Aún no tienes puntos. ¡Responde una encuesta para empezar!</div>`;

        $("totalPuntos").textContent = `${pts(total)} pts`;
    } catch (e) {
        console.error(e);
        if (e.status === 401) location.href = "index.html";
    }
}

// encuestas.js avisa cuando ganas puntos para refrescar sin recargar la página
window.addEventListener("puntos-actualizados", cargarPuntos);
cargarPuntos();
})();
