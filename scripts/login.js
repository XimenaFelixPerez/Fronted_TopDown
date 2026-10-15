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

let correoIngresado = '';

const post = async (url, body) => {
  const endpoint = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const r = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('d-none');
  correoIngresado = document.getElementById('employeeNumber').value.trim();
  const contrasena = document.getElementById('password').value;

  const { ok, data } = await post('/api/login', {
    correo: correoIngresado,
    contrasena: contrasena
  });

  if (!ok) {
    loginError.textContent = (data && data.mensaje) ? data.mensaje : 'Correo de empleado o contraseña incorrectos.';
    loginError.classList.remove('d-none');
    return;
  }

  codeSentTo.innerHTML = `Código generado para <strong>${data.correo}</strong>.<br><span class="text-muted small">Por favor revisa la <strong>terminal de tu servidor Backend</strong> para copiar tu código.</span>`;
  
  // Limpiar el campo de código para que el usuario lo escriba desde su terminal
  const codeInput = document.getElementById('verificationCode');
  if (codeInput) {
    codeInput.value = '';
    codeInput.focus();
  }

  loginView.classList.add('d-none');
  verifyView.classList.remove('d-none');
});

verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  verifyError.classList.add('d-none');
  const codigo = document.getElementById('verificationCode').value.trim();

  const { ok, data } = await post('/api/verificar', {
    codigo: codigo
  });

  if (!ok) {
    verifyError.textContent = (data && data.mensaje) ? data.mensaje : 'Código de verificación incorrecto o sesión expirada.';
    verifyError.classList.remove('d-none');
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

document.getElementById('backToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  verifyForm.reset();
  verifyError.classList.add('d-none');
  verifyView.classList.add('d-none');
  loginView.classList.remove('d-none');
});