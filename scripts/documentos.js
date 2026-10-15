const documentos = [
    { nombre: "Recibo de nómina — Ago 2026", tipo: "Nómina",       fecha: "01 Sep 2026", tamano: 184 },
    { nombre: "Recibo de nómina — Jul 2026", tipo: "Nómina",       fecha: "01 Ago 2026", tamano: 184 },
    { nombre: "Recibo de nómina — Jun 2026", tipo: "Nómina",       fecha: "01 Jul 2026", tamano: 184 },
    { nombre: "Contrato individual de trabajo", tipo: "Contrato",  fecha: "15 Mar 2021", tamano: 320 },
    { nombre: "Alta IMSS",                   tipo: "IMSS",         fecha: "15 Mar 2021", tamano: 96 },
    { nombre: "Constancia de empleo",        tipo: "Constancia",   fecha: "10 Jul 2026", tamano: 112 },
    { nombre: "Aviso de privacidad firmado", tipo: "Legal",        fecha: "15 Mar 2021", tamano: 76 },
    { nombre: "Certificado — Manejo datos GDPR", tipo: "Capacitación", fecha: "05 Mar 2026", tamano: 148 },
    
];

const claseTipo = {
    "Nómina": "tag-nomina",
    "Contrato": "tag-contrato",
    "IMSS": "tag-imss",
    "Constancia": "tag-constancia",
    "Legal": "tag-legal",
    "Capacitación": "tag-capacitacion",
};

const docsBody = document.getElementById("docsBody");
const contadorDocs = document.getElementById("contadorDocs");
const filtroTipo = document.getElementById("filtroTipo");

filtroTipo.add(new Option("Todos", "Todos"));
Object.keys(claseTipo).forEach((t) => filtroTipo.add(new Option(t, t)));

function descargar(doc) {
    const a = document.createElement("a");
    let urlTemporal = null;

    if (doc.archivo) {
        a.href = doc.archivo;
        a.download = "";
    } else {
        const contenido = `${doc.nombre}\nTipo: ${doc.tipo}\nFecha: ${doc.fecha}\n\n(Archivo de prueba)`;
        urlTemporal = URL.createObjectURL(new Blob([contenido], { type: "text/plain" }));
        a.href = urlTemporal;
        a.download = `${doc.nombre}.txt`;
    }

    document.body.appendChild(a);
    a.click();
    a.remove();
    if (urlTemporal) URL.revokeObjectURL(urlTemporal);
}

function renderDocumentos() {
    const filtro = filtroTipo.value;
    const lista = filtro === "Todos" ? documentos : documentos.filter((d) => d.tipo === filtro);

    docsBody.innerHTML = "";

    if (lista.length === 0) {
        docsBody.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">No hay documentos de este tipo</td></tr>`;
    }

    lista.forEach((d) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="fw-medium">${d.nombre}</td>
            <td><span class="tag-doc ${claseTipo[d.tipo]}">${d.tipo}</span></td>
            <td class="text-secondary numero">${d.fecha}</td>
            <td class="text-secondary numero small">${d.tamano} KB</td>
            <td class="text-end">
                <button class="btn btn-outline-primary btn-sm btn-descargar" aria-label="Descargar ${d.nombre}">
                    <i class="bi bi-download"></i> Descargar
                </button>
            </td>
        `;
        row.querySelector(".btn-descargar").addEventListener("click", () => descargar(d));
        docsBody.appendChild(row);
    });

    contadorDocs.textContent =
        lista.length === 1 ? "1 documento disponible" : `${lista.length} documentos disponibles`;
}

filtroTipo.addEventListener("change", renderDocumentos);
renderDocumentos();