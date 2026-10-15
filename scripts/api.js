const host = window.location.hostname || 'localhost';
const API_URL = `http://${host}:3000/api`;

async function api(ruta, opciones = {}) {
    const res = await fetch(`${API_URL}${ruta}`, {
        credentials: 'include',
        ...opciones,
        headers: { 'Content-Type': 'application/json', ...opciones.headers },
        body: opciones.body ? JSON.stringify(opciones.body) : undefined
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}