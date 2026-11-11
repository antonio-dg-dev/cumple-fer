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

  const ESTADO = { si: 'sí va', no: 'no va', pend: 'no ha respondido' };

  function grupoDe(respuesta) {
    return respuesta === 'si' || respuesta === 'no' ? respuesta : 'pend';
  }

  // Une en un renglón a quienes comparten invitación y quedaron en la misma lista;
  // si la pareja se separó, cada renglón dice qué respondió el otro
  function renglones(invitados, g) {
    const porNombre = {};
    invitados.forEach(function (inv) { porNombre[inv.nombre] = inv; });
    const usados = {};
    const filas = [];
    invitados.forEach(function (inv) {
      if (grupoDe(inv.respuesta) !== g || usados[inv.nombre]) return;
      const juntos = [inv].concat((inv.con || []).map(function (n) { return porNombre[n]; }).filter(function (o) {
        return o && grupoDe(o.respuesta) === g;
      }));
      juntos.forEach(function (o) { usados[o.nombre] = true; });
      const fuera = (inv.con || []).map(function (n) { return porNombre[n]; }).filter(function (o) {
        return o && grupoDe(o.respuesta) !== g;
      });
      const fechas = juntos.map(function (o) { return o.actualizado; }).filter(Boolean).sort();
      filas.push({
        nombres: juntos.map(function (o) { return o.nombre; }),
        aparte: fuera.map(function (o) { return o.nombre + ' ' + ESTADO[grupoDe(o.respuesta)]; }).join(' · '),
        notas: juntos.map(function (o) { return o.notas; }).filter(Boolean)[0] || '',
        actualizado: fechas[fechas.length - 1] || null
      });
    });
    // Lo más reciente hasta arriba; sin fecha se queda al final en el orden de la hoja
    return filas.sort(function (a, b) {
      return (b.actualizado || '').localeCompare(a.actualizado || '');
    });
  }

  function unirNombres(nombres) {
    return nombres.length < 2 ? nombres.join('') : nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  function llenar(id, filas) {
    const ul = document.getElementById(id);
    ul.replaceChildren();
    if (!filas.length) {
      const li = document.createElement('li');
      li.className = 'vacio';
      li.textContent = 'Nadie todavía';
      ul.append(li);
      return;
    }
    filas.forEach(function (fila) {
      const li = document.createElement('li');
      const quien = document.createElement('span');
      quien.className = 'quien';
      quien.textContent = unirNombres(fila.nombres);
      if (fila.aparte) {
        const aparte = document.createElement('span');
        aparte.className = 'aparte';
        aparte.textContent = ' · ' + fila.aparte;
        quien.append(aparte);
      }
      const cuando = document.createElement('span');
      cuando.className = 'cuando';
      cuando.textContent = fila.actualizado ? fecha.format(new Date(fila.actualizado)) : '';
      li.append(quien, cuando);
      if (fila.notas) {
        const nota = document.createElement('span');
        nota.className = 'nota';
        nota.textContent = fila.notas;
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
        ['si', 'no', 'pend'].forEach(function (g) {
          // Los contadores son por persona, aunque la pareja salga en un solo renglón
          const personas = data.invitados.filter(function (inv) { return grupoDe(inv.respuesta) === g; });
          document.getElementById('n-' + g).textContent = personas.length;
          llenar('l-' + g, renglones(data.invitados, g));
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
