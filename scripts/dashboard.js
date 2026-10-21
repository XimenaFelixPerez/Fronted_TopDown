const money = (n) => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Se corta el ISO a "YYYY-MM-DD" para que la zona horaria no mueva el día
const partes = (iso) => String(iso).slice(0, 10).split('-').map(Number);
const fechaCorta = (iso) => { const [a, m, d] = partes(iso); return `${String(d).padStart(2, '0')} ${MES_CORTO[m - 1]} ${a}`; };

const antiguedad = (iso) => {
  const [a, m] = partes(iso);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
  if (meses < 0) meses = 0;
  const y = Math.floor(meses / 12), mm = meses % 12;
  return `${y} año${y === 1 ? '' : 's'} ${mm} mes${mm === 1 ? '' : 'es'}`;
};

(async () => {
  try {
    const d = await api('/dashboard');
    const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('fechaHoy').textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);

    const { empleado, ultimoRecibo: u } = d;
    document.getElementById('nombreCorto').textContent = empleado.nombre.split(' ')[0];
    document.getElementById('resumenEmpleado').textContent =
      `${empleado.puesto} - ${empleado.departamento} - Ingreso: ${fechaCorta(empleado.ingreso)} - Antigüedad: ${antiguedad(empleado.ingreso)}`;

    if (u) {
      document.getElementById('pagoNeto').textContent = money(u.neto);
      document.getElementById('pagoFecha').textContent = fechaCorta(u.fechaPago);
      document.getElementById('salarioBruto').textContent = money(u.bruto);
      document.getElementById('salarioMes').textContent = `${MESES[u.mes - 1]} ${u.anio}`;
    } else {
      ['pagoNeto', 'salarioBruto'].forEach((id) => (document.getElementById(id).textContent = '—'));
      document.getElementById('pagoFecha').textContent = 'Sin recibos todavía';
      document.getElementById('salarioMes').textContent = '';
    }

    document.getElementById('vacDisp').textContent = `${d.vacaciones.disponibles} día${d.vacaciones.disponibles === 1 ? '' : 's'}`;
    document.getElementById('vacPeriodo').textContent = `Periodo ${d.vacaciones.anio}`;
    document.getElementById('misPuntos').textContent = `${Number(d.puntos.total).toLocaleString('es-MX')} pts`;
    document.getElementById('miNivel').textContent = `Nivel ${d.puntos.nivel}`;

    document.getElementById('listaEventos').innerHTML = d.eventos.map((ev, i, a) => {
      const [, m, dia] = partes(ev.Fecha);
      return `<li class="d-flex gap-3 py-2${i < a.length - 1 ? ' border-bottom' : ''}">
        <span class="event-date">${String(dia).padStart(2, '0')} ${MES_CORTO[m - 1]}</span> ${ev.Descripcion}
      </li>`;
    }).join('');
  } catch (e) {
    console.error(e);
    if (String(e.message).includes('401')) location.href = 'index.html';
  }
})();
