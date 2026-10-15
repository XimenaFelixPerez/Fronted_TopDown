const iniciarNotificaciones = () => {
  const btnNotif = document.getElementById('btnNotif');
  const notifDot = document.getElementById('notifDot');
  const notifPanel = document.getElementById('notifPanel');
  const listaNotif = document.getElementById('listaNotif');

  const base = [
    { Id: 1, Texto: 'Tu recibo de nómina de agosto ya está disponible', Leida: false },
    { Id: 2, Texto: 'Tienes 2 encuestas pendientes por responder', Leida: false },
    { Id: 3, Texto: 'Tu solicitud de vacaciones fue autorizada', Leida: true }
  ];

  const guardadas = JSON.parse(localStorage.getItem('notifLeidas') || '[]');
  const notificaciones = base.map(n => ({ ...n, Leida: n.Leida || guardadas.includes(n.Id) }));

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

  const marcarLeida = (e) => {
    const item = e.target.closest('[data-id]');
    if (!item) return;
    e.preventDefault();
    const n = notificaciones.find(x => x.Id === Number(item.dataset.id));
    if (!n || n.Leida) return;
    n.Leida = true;
    localStorage.setItem('notifLeidas', JSON.stringify(notificaciones.filter(x => x.Leida).map(x => x.Id)));
    render();
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