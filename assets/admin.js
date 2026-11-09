(function () {
  const url = window.CUMPLE_CONFIG.scriptUrl;
  const form = document.getElementById('login');
  const clave = document.getElementById('clave');
  const estado = document.getElementById('estado');
  const panel = document.getElementById('panel');

  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  function guardada() {
    try { return sessionStorage.getItem('cumple-admin') || ''; } catch (e) { return ''; }
  }

  function recordar(k) {
    try { sessionStorage.setItem('cumple-admin', k); } catch (e) { /* sin almacenamiento, no pasa nada */ }
  }

  function llenar(id, invitados) {
    const ul = document.getElementById(id);
    ul.replaceChildren();
    if (!invitados.length) {
      const li = document.createElement('li');
      li.className = 'vacio';
      li.textContent = 'Nadie todavía';
      ul.append(li);
      return;
    }
    invitados.forEach(function (inv) {
      const li = document.createElement('li');
      const quien = document.createElement('span');
      quien.className = 'quien';
      quien.textContent = inv.nombre + (inv.con && inv.con.length ? ' (con ' + inv.con.join(', ') + ')' : '');
      const cuando = document.createElement('span');
      cuando.className = 'cuando';
      cuando.textContent = inv.actualizado ? fecha.format(new Date(inv.actualizado)) : '';
      li.append(quien, cuando);
      if (inv.notas) {
        const nota = document.createElement('span');
        nota.className = 'nota';
        nota.textContent = inv.notas;
        li.append(nota);
      }
      ul.append(li);
    });
  }

  function cargar(k) {
    if (!url) {
      estado.textContent = 'Falta poner la URL del Apps Script en assets/config.js.';
      estado.classList.add('error');
      return;
    }
    estado.textContent = 'Cargando…';
    estado.classList.remove('error');
    fetch(url + '?action=admin&key=' + encodeURIComponent(k))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) {
          estado.textContent = 'Clave incorrecta. Revisa la que guardaste en el Apps Script.';
          estado.classList.add('error');
          panel.hidden = true;
          return;
        }
        recordar(k);
        const grupos = { si: [], no: [], pend: [] };
        data.invitados.forEach(function (inv) {
          (grupos[inv.respuesta] || grupos.pend).push(inv);
        });
        ['si', 'no', 'pend'].forEach(function (g) {
          document.getElementById('n-' + g).textContent = grupos[g].length;
          llenar('l-' + g, grupos[g]);
        });
        estado.textContent = 'Actualizado ' + fecha.format(new Date());
        panel.hidden = false;
      })
      .catch(function () {
        estado.textContent = 'No pude cargar la lista. Revisa tu conexión.';
        estado.classList.add('error');
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    cargar(clave.value);
  });

  const previa = guardada();
  if (previa) {
    clave.value = previa;
    cargar(previa);
  }
})();
