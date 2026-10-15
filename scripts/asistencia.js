
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ANIOS = [2024, 2025, 2026];

const HOY_DEMO = new Date(2026, 7, 27);   
const JORNADA_HORAS = 8;                  
const HORA_ENTRADA = 8 * 60;              
const TOLERANCIA_MIN = 10;                

const TIPOS = {
    asistencia: "Asistencia",
    descanso: "Descanso",
    festivo: "Festivo",
    vacaciones: "Vacaciones",
    incapacidad: "Incapacidad",
    ausentismo: "Ausentismo",
    permiso: "Permiso",
    futuro: "Sin registro",
};

const vacacionesRangos = [
    ["2025-12-20", "2026-01-02"],
    ["2026-03-14", "2026-03-19"],
    ["2026-07-10", "2026-07-21"],
];

const ajustes = {
    "2026-08-06": { entrada: "08:02", salida: "17:05" },
    "2026-08-05": { salida: "21:03", extra: 4 },
    "2026-08-12": { entrada: "08:30", salida: "17:30" },  
    "2026-08-19": { salida: "21:01", extra: 4 },
};

const pad = (n) => String(n).padStart(2, "0");
const clave = (anio, mes, dia) => `${anio}-${pad(mes + 1)}-${pad(dia)}`;
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const horas = (n) => Number(n.toFixed(1)) + " h";

const enesimoLunes = (anio, mes, n) => {
    const primero = new Date(anio, mes, 1);
    const desfase = (8 - primero.getDay()) % 7;
    return new Date(anio, mes, 1 + desfase + (n - 1) * 7);
};

const festivosDe = (anio) => new Set([
    clave(anio, 0, 1),
    (d => clave(d.getFullYear(), d.getMonth(), d.getDate()))(enesimoLunes(anio, 1, 1)),
    (d => clave(d.getFullYear(), d.getMonth(), d.getDate()))(enesimoLunes(anio, 2, 3)),
    clave(anio, 4, 1),
    clave(anio, 8, 16),
    (d => clave(d.getFullYear(), d.getMonth(), d.getDate()))(enesimoLunes(anio, 10, 3)),
    clave(anio, 11, 25),
]);

const enVacaciones = (k) => vacacionesRangos.some(([ini, fin]) => k >= ini && k <= fin);

function generarMes(anio, mes) {
    const total = new Date(anio, mes + 1, 0).getDate();
    const festivos = festivosDe(anio);
    const dias = [];

    for (let d = 1; d <= total; d++) {
        const fecha = new Date(anio, mes, d);
        const k = clave(anio, mes, d);
        const dow = fecha.getDay();
        const aj = ajustes[k] || {};

        let tipo;
        if (fecha > HOY_DEMO) tipo = "futuro";
        else if (dow === 0 || dow === 6) tipo = "descanso";
        else if (festivos.has(k)) tipo = "festivo";
        else if (enVacaciones(k)) tipo = "vacaciones";
        else tipo = "asistencia";

        if (aj.tipo && tipo !== "futuro") tipo = aj.tipo;

        const dia = { dia: d, dow, tipo };

        if (tipo === "asistencia") {
            const entradaMin = aj.entrada ? aMin(aj.entrada) : HORA_ENTRADA + ((d * 7) % 12) - 2;
            const salidaMin = aj.salida ? aMin(aj.salida) : 17 * 60 + ((d * 5) % 13);
            const tarde = entradaMin - HORA_ENTRADA;

            dia.entrada = aHHMM(entradaMin);
            dia.salida = aHHMM(salidaMin);
            dia.trabajadoMin = salidaMin - entradaMin;
            dia.retardoMin = tarde > TOLERANCIA_MIN ? tarde : 0;
            dia.extra = aj.extra || 0;
        }
        dias.push(dia);
    }
    return dias;
}
function resumir(dias) {
    const cuenta = (t) => dias.filter((d) => d.tipo === t).length;
    const asistencias = cuenta("asistencia");
    const retardos = dias.filter((d) => d.retardoMin > 0);
    const horasExtra = dias.reduce((s, d) => s + (d.extra || 0), 0);
    const horasRetardo = retardos.reduce((s, d) => s + d.retardoMin / 60, 0);

    return {
        mes: [
            ["Asistencias", asistencias],
            ["Descansos", cuenta("descanso")],
            ["Festivos", cuenta("festivo")],
            ["Incapacidades", cuenta("incapacidad")],
        ],
        eventos: [
            ["Horas extras", horasExtra],
            ["Descansos trabajados", 0],
            ["Retardos", retardos.length],
            ["Permisos", cuenta("permiso")],
        ],
        horas: [
            ["Asistencia", horas(asistencias * JORNADA_HORAS)],
            ["Horas extras", horas(horasExtra)],
            ["Retardos", horas(horasRetardo)],
            ["Ausentismo", horas(cuenta("ausentismo") * JORNADA_HORAS)],
        ],
    };
}

const selAnio = document.getElementById("selAnio");
const selMes = document.getElementById("selMes");
const btnConsultar = document.getElementById("btnConsultar");
const calendarioDias = document.getElementById("calendarioDias");
const detalleDia = document.getElementById("detalleDia");
const tituloCalendario = document.getElementById("tituloCalendario");
const leyenda = document.getElementById("leyenda");

let anioActual = 2026;
let mesActual = 7;
let diasMes = [];

ANIOS.forEach((a) => selAnio.add(new Option(a, a, false, a === anioActual)));
MESES.forEach((m, i) => selMes.add(new Option(m, i, false, i === mesActual)));


["asistencia", "descanso", "festivo", "vacaciones", "incapacidad", "ausentismo", "permiso"].forEach((t) => {
    const item = document.createElement("span");
    item.innerHTML = `<span class="dot tipo-${t}"></span>${TIPOS[t]}`;
    leyenda.appendChild(item);
});

function renderFilas(idContenedor, filas) {
    const cont = document.getElementById(idContenedor);
    cont.innerHTML = "";
    filas.forEach(([etiqueta, valor]) => {
        const fila = document.createElement("div");
        fila.className = "fila-resumen";
        fila.innerHTML = `<span>${etiqueta}</span><strong class="numero">${valor}</strong>`;
        cont.appendChild(fila);
    });
}

function mostrarDetalle(d) {
    const fecha = `${d.dia} de ${MESES[mesActual].toLowerCase()} de ${anioActual}`;
    let linea = "";

    if (d.tipo === "asistencia") {
        const partes = [
            `Entrada: ${d.entrada}`,
            `Salida: ${d.salida}`,
            `${Math.floor(d.trabajadoMin / 60)} h ${pad(d.trabajadoMin % 60)} min trabajados`,
        ];
        if (d.retardoMin) partes.push(`Retardo: ${d.retardoMin} min`);
        if (d.extra) partes.push(`${d.extra} h extra`);
        linea = partes.join(" · ");
    } else if (d.tipo === "futuro") {
        linea = "Aún no hay registro para este día";
    }

    detalleDia.innerHTML = `
        <div><strong>${fecha}</strong> — ${TIPOS[d.tipo]}</div>
        ${linea ? `<div class="text-secondary">${linea}</div>` : ""}
    `;
}

function seleccionarDia(d, boton) {
    calendarioDias.querySelectorAll(".dia").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    mostrarDetalle(d);
}

function renderMes() {
    diasMes = generarMes(anioActual, mesActual);
    tituloCalendario.textContent = `${MESES[mesActual]} ${anioActual}`;

    const r = resumir(diasMes);
    renderFilas("resumenMes", r.mes);
    renderFilas("totalEventos", r.eventos);
    renderFilas("totalHoras", r.horas);

    calendarioDias.innerHTML = "";
    for (let i = 0; i < diasMes[0].dow; i++) {
        calendarioDias.appendChild(document.createElement("div"));
    }

    let inicial = null;
    diasMes.forEach((d) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = `dia tipo-${d.tipo}`;
        boton.textContent = d.dia;
        boton.addEventListener("click", () => seleccionarDia(d, boton));
        calendarioDias.appendChild(boton);

        if (d.tipo === "asistencia" && (d.dia === 6 || !inicial)) inicial = { d, boton };
    });

    if (inicial) seleccionarDia(inicial.d, inicial.boton);
    else detalleDia.innerHTML = `<div class="text-secondary">Selecciona un día para ver el detalle</div>`;
}

btnConsultar.addEventListener("click", () => {
    anioActual = Number(selAnio.value);
    mesActual = Number(selMes.value);
    renderMes();
});

renderMes();
