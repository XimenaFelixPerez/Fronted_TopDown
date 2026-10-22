// Determinar dinámicamente si estamos en localhost o 127.0.0.1 para coincidir con la sesión
const host = window.location.hostname || 'localhost';
const API_BASE = `http://${host}:3000`;

const loginView = document.getElementById('loginView');
const verifyView = document.getElementById('verifyView');
const loginForm = document.getElementById('loginForm');
const verifyForm = document.getElementById('verifyForm');
const loginError = document.getElementById('loginError');
const verifyError = document.getElementById('verifyError');
const codeSentTo = document.getElementById('codeSentTo');
const btnReenviar = document.getElementById('btnReenviar');

let correoIngresado = '';
let cuentaAtras = null;

const post = async (url, body) => {
  const endpoint = url.startsWith('http') ? url : `${API_BASE}${url}`;
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, status: 0, data: { mensaje: 'No hay conexión con el servidor. ¿Está prendido el backend?' } };
  }
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Mensaje de "a dónde se mandó el código"
function mostrarEnvio(data) {
  if (data.via === 'email') {
    codeSentTo.className = 'alert alert-primary';
    codeSentTo.innerHTML = `Enviamos un código de 6 dígitos a <strong>${esc(data.correo)}</strong>.<br>
      <span class="small">Vence en ${data.minutos} minutos. Si no lo ves, revisa tu carpeta de spam.</span>`;
  } else {
    codeSentTo.className = 'alert alert-warning';
    codeSentTo.innerHTML = `${esc(data.aviso || 'Modo de pruebas.')}<br>
      <span class="small">Copia el código que aparece en la <strong>terminal del servidor backend</strong>.</span>`;
  }
}

// El botón "Reenviar código" se habilita después de 30 segundos
function iniciarCuentaAtras(seg = 30) {
  if (!btnReenviar) return;
  clearInterval(cuentaAtras);
  btnReenviar.classList.add('disabled');
  let s = seg;
  btnReenviar.textContent = `Reenviar código (${s}s)`;
  cuentaAtras = setInterval(() => {
    s--;
    if (s <= 0) {
      clearInterval(cuentaAtras);
      btnReenviar.classList.remove('disabled');
      btnReenviar.textContent = 'Reenviar código';
    } else {
      btnReenviar.textContent = `Reenviar código (${s}s)`;
    }
  }, 1000);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('d-none');
  correoIngresado = document.getElementById('employeeNumber').value.trim();
  const contrasena = document.getElementById('password').value;

  const boton = loginForm.querySelector('button[type="submit"]');
  boton.disabled = true;
  boton.textContent = 'Enviando código...';

  const { ok, data } = await post('/api/login', {
    correo: correoIngresado,
    contrasena: contrasena
  });

  boton.disabled = false;
  boton.textContent = 'Continuar';

  if (!ok) {
    loginError.textContent = (data && data.mensaje) ? data.mensaje : 'Correo de empleado o contraseña incorrectos.';
    loginError.classList.remove('d-none');
    return;
  }

  mostrarEnvio(data);

  const codeInput = document.getElementById('verificationCode');
  if (codeInput) {
    codeInput.value = '';
    codeInput.focus();
  }

  loginView.classList.add('d-none');
  verifyView.classList.remove('d-none');
  iniciarCuentaAtras();
});

verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  verifyError.classList.add('d-none');
  const codigo = document.getElementById('verificationCode').value.trim();

  const { ok, status, data } = await post('/api/verificar', {
    codigo: codigo
  });

  if (!ok) {
    verifyError.textContent = (data && data.mensaje) ? data.mensaje : 'Código de verificación incorrecto o sesión expirada.';
    verifyError.classList.remove('d-none');
    // Bloqueo o código vencido: regresa al login
    if (status === 423 || /Inicia sesión de nuevo/.test(data?.mensaje || '')) {
      setTimeout(() => document.getElementById('backToLogin').click(), 2500);
    }
    return;
  }

  if (correoIngresado) {
    localStorage.setItem('correoSesion', correoIngresado);
  }

  const destino = (data && data.redirect && data.redirect.endsWith('Dashboard.html'))
    ? 'Dashboard.html'
    : (data?.redirect || 'Dashboard.html');
  window.location.href = destino;
});

if (btnReenviar) {
  btnReenviar.addEventListener('click', async (e) => {
    e.preventDefault();
    if (btnReenviar.classList.contains('disabled')) return;
    verifyError.classList.add('d-none');
    btnReenviar.classList.add('disabled');
    btnReenviar.textContent = 'Enviando...';

    const { ok, data } = await post('/api/reenviar-codigo');
    if (!ok) {
      verifyError.textContent = data?.mensaje || 'No se pudo reenviar el código.';
      verifyError.classList.remove('d-none');
      if (/Inicia sesión de nuevo/.test(data?.mensaje || '')) {
        setTimeout(() => document.getElementById('backToLogin').click(), 2500);
      } else {
        iniciarCuentaAtras(10);
      }
      return;
    }
    mostrarEnvio(data);
    document.getElementById('verificationCode').value = '';
    iniciarCuentaAtras();
  });
}

document.getElementById('backToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  clearInterval(cuentaAtras);
  verifyForm.reset();
  verifyError.classList.add('d-none');
  verifyView.classList.add('d-none');
  loginView.classList.remove('d-none');
});
