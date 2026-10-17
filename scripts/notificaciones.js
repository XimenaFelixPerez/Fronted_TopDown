const iniciarNotificaciones = async () => {
  if (typeof api === 'undefined') return;   // la página no cargó api.js

  const btnNotif = document.getElementById('btnNotif');
  const notifDot = document.getElementById('notifDot');
  const notifPanel = document.getElementById('notifPanel');
  const listaNotif = document.getElementById('listaNotif');

  let notificaciones = [];
  try {
    notificaciones = (await api('/notificaciones')).notificaciones;
  } catch (e) {
    console.error('No se pudieron cargar las notificaciones', e);
  }

  const render = () => {
    notifDot.classList.toggle('d-none', !notificaciones.some(n => !n.Leida));

    notifPanel.innerHTML = notificaciones.map(n => `
      <a href="#" class="notif-item ${n.Leida ? '' : 'nueva'}" data-id="${n.Id}">
        <span class="notif-punto"></span>
        <span class="notif-texto">${n.Texto}</span>
      </a>`).join('');

    if (!listaNotif) return;
    listaNotif.innerHTML = notificaciones.slice(0, 3).map((n, i, a) => `
      <li class="d-flex justify-content-between align-items-center py-2${i < a.length - 1 ? ' border-bottom' : ''}" data-id="${n.Id}" role="button">
        ${n.Leida
          ? `<span class="text-secondary"><span class="dot dot-muted"></span> ${n.Texto}</span>`
          : `<span><span class="dot dot-active"></span> ${n.Texto}</span><span class="badge-new">Nueva</span>`}
      </li>`).join('');
  };

  const marcarLeida = async (e) => {
    const item = e.target.closest('[data-id]');
    if (!item) return;
    e.preventDefault();
    const n = notificaciones.find(x => x.Id === Number(item.dataset.id));
    if (!n || n.Leida) return;
    n.Leida = true;
    render();
    try {
      await api(`/notificaciones/${n.Id}/leida`, { method: 'PATCH' });
    } catch (err) {
      console.error('No se pudo guardar la lectura', err);
    }
  };

  btnNotif.addEventListener('click', () => notifPanel.classList.toggle('d-none'));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notifWrap')) notifPanel.classList.add('d-none');
  });
  notifPanel.addEventListener('click', marcarLeida);
  if (listaNotif) listaNotif.addEventListener('click', marcarLeida);

  render();
};

if (document.getElementById('btnNotif')) iniciarNotificaciones();