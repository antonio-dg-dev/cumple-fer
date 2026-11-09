(function () {
  const url = window.CUMPLE_CONFIG.scriptUrl;
  const token = new URLSearchParams(location.search).get('i');

  const rsvp = document.getElementById('rsvp');
  const sinLink = document.getElementById('sin-link');
  const saludo = document.getElementById('saludo');
  const notas = document.getElementById('notas');
  const estado = document.getElementById('estado');
  const botones = rsvp.querySelectorAll('button[data-respuesta]');

  const TEXTOS = {
    si: '¡Listo! Quedaste confirmad@. Nos vemos el sábado.',
    no: 'Gracias por avisar. Te vamos a extrañar.'
  };

  if (!token || !url) return;

  function mostrarEstado(texto, esError) {
    estado.textContent = texto;
    estado.classList.toggle('error', !!esError);
  }

  function marcar(respuesta) {
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.respuesta === respuesta));
    });
  }

  function bloquear(si) {
    botones.forEach(function (b) { b.disabled = si; });
  }

  fetch(url + '?action=get&token=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok) {
        sinLink.textContent = 'Este link no es válido. Pídele a Fer el tuyo.';
        sinLink.hidden = false;
        return;
      }
      saludo.textContent = '¡Hola, ' + data.nombre + '! Estás invitad@ al cumple de';
      notas.value = data.notas || '';
      rsvp.hidden = false;
      if (data.respuesta) {
        marcar(data.respuesta);
        mostrarEstado('Tu respuesta: ' + (data.respuesta === 'si' ? 'ahí estarás.' : 'no podrás ir.') + ' Puedes cambiarla cuando quieras.');
      }
    })
    .catch(function () {
      sinLink.textContent = 'No pude cargar tu invitación. Revisa tu conexión y recarga la página.';
      sinLink.hidden = false;
    });

  botones.forEach(function (boton) {
    boton.addEventListener('click', function () {
      const respuesta = boton.dataset.respuesta;
      bloquear(true);
      mostrarEstado('Guardando…');
      // text/plain evita el preflight CORS que Apps Script no responde
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: token, respuesta: respuesta, notas: notas.value })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.ok) throw new Error(data.error);
          marcar(respuesta);
          mostrarEstado(TEXTOS[respuesta]);
        })
        .catch(function () {
          mostrarEstado('No se guardó tu respuesta. Revisa tu conexión e inténtalo otra vez.', true);
        })
        .finally(function () { bloquear(false); });
    });
  });
})();
