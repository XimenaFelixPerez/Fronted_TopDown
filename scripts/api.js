const host = window.location.hostname || 'localhost';
const API_URL = `http://${host}:3000/api`;

// Llama a la API con la cookie de sesión. Si falla, el error trae el mensaje del servidor.
async function api(ruta, opciones = {}) {
    const res = await fetch(`${API_URL}${ruta}`, {
        credentials: 'include',
        ...opciones,
        headers: { 'Content-Type': 'application/json', ...opciones.headers },
        body: opciones.body ? JSON.stringify(opciones.body) : undefined
    });
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`Error ${res.status}${datos.mensaje ? ': ' + datos.mensaje : ''}`);
        err.status = res.status;
        err.mensaje = datos.mensaje || 'Ocurrió un error, intenta de nuevo.';
        throw err;
    }
    return datos;
}
