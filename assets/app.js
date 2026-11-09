(function () {
  const url = window.CUMPLE_CONFIG.scriptUrl;
  const token = new URLSearchParams(location.search).get('i');

  const rsvp = document.getElementById('rsvp');
  const sinLink = document.getElementById('sin-link');
  const saludo = document.getElementById('saludo');
  const tituloRsvp = document.getElementById('t-rsvp');
  const pie = document.getElementById('pie');
  const notas = document.getElementById('notas');
  const estado = document.getElementById('estado');
  const acciones = document.getElementById('acciones');

  // La fecha límite deja de mostrarse desde el martes 10 a las 00:00, hora CDMX
  if (Date.now() >= Date.parse('2026-11-10T00:00:00-06:00')) document.getElementById('limite').hidden = true;

  // Crece desde cero empujando el contenido mientras aparece
  function mostrarSaludo() {
    const raiz = document.documentElement;
    if (raiz.classList.contains('listo')) return;
    raiz.classList.add('listo');
    if (!raiz.classList.contains('con-link') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    [saludo, pie].forEach(function (el) {
      const alto = el.offsetHeight;
      el.animate([
        { height: '0px', opacity: 0, transform: 'translateY(-10px)', overflow: 'hidden' },
        { height: alto + 'px', opacity: 1, transform: 'none', overflow: 'hidden' }
      ], { duration: 700, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)' });
    });
  }

  if (!token || !url) return mostrarSaludo();

  // Terminación según género: una persona (a/o) o varias (as solo si todas son mujeres)
  function sufijo(personas) {
    const todasM = personas.every(function (p) { return p.genero === 'M'; });
    if (personas.length === 1) return todasM ? 'a' : 'o';
    return todasM ? 'as' : 'os';
  }

  function unirNombres(nombres) {
    return nombres.length < 2 ? nombres.join('') : nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  // Cada opción dice qué responde cada persona del link
  function opciones(personas) {
    const todos = function (r) {
      const o = {};
      personas.forEach(function (p) { o[p.nombre] = r; });
      return o;
    };
    if (personas.length === 1) {
      return [
        { texto: 'Ahí estaré', color: 'var(--verde)', respuestas: todos('si') },
        { texto: 'No podré ir', color: 'var(--rojo)', respuestas: todos('no') }
      ];
    }
    const lista = [{ texto: personas.length === 2 ? 'Vamos los dos' : 'Vamos todos', color: 'var(--verde)', respuestas: todos('si') }];
    const colores = ['var(--rosa)', 'var(--azul)', 'var(--naranja)'];
    personas.forEach(function (p, i) {
      const r = todos('no');
      r[p.nombre] = 'si';
      lista.push({ texto: 'Solo ' + p.nombre, color: colores[i % colores.length], respuestas: r });
    });
    lista.push({ texto: 'No podemos ir', color: 'var(--rojo)', respuestas: todos('no') });
    return lista;
  }

  function mensaje(personas, respuestas, alGuardar) {
    const van = personas.filter(function (p) { return respuestas[p.nombre] === 'si'; });
    const plural = personas.length > 1;
    if (!van.length) {
      return alGuardar
        ? 'Gracias por avisar.'
        : (plural ? 'Su respuesta: no pueden ir. Pueden cambiarla cuando quieran.' : 'Tu respuesta: no podrás ir. Puedes cambiarla cuando quieras.');
    }
    const quien = van.length === 1 ? van[0] : null;
    let texto;
    if (!plural) texto = alGuardar ? '¡Listo! Quedaste confirmad' + sufijo(van) + '.' : 'Tu respuesta: ahí estarás.';
    else if (van.length === personas.length) texto = alGuardar ? '¡Listo! Quedaron confirmad' + sufijo(van) + '.' : 'Su respuesta: van ' + (van.length === 2 ? 'los dos' : 'todos') + '.';
    else texto = alGuardar ? '¡Listo! ' + unirNombres(van.map(function (p) { return p.nombre; })) + (quien ? ' quedó confirmad' + sufijo(van) : ' quedaron confirmad' + sufijo(van)) + '.' : 'Su respuesta: solo va ' + unirNombres(van.map(function (p) { return p.nombre; })) + '.';
    if (alGuardar) return texto;
    return texto + (plural ? ' Pueden cambiarla cuando quieran.' : ' Puedes cambiarla cuando quieras.');
  }

  function mostrarEstado(texto, esError) {
    estado.textContent = texto;
    estado.classList.toggle('error', !!esError);
  }

  function iguales(a, b) {
    return Object.keys(a).every(function (k) { return a[k] === b[k]; });
  }

  function personalizar(data) {
    const personas = data.personas;
    const plural = personas.length > 1;
    const suf = sufijo(personas);

    saludo.textContent = '¡Hola, ' + unirNombres(personas.map(function (p) { return p.nombre; })) + '! ' +
      (plural ? 'Están' : 'Estás') + ' invitad' + suf + ' al cumple de';
    tituloRsvp.textContent = plural ? '¿Vienen?' : '¿Vienes?';
    notas.placeholder = plural ? 'Ej. Llegamos a las 5:00 pm' : 'Ej. Llego a las 5:00 pm';
    pie.textContent = (plural ? (suf === 'as' ? 'Las' : 'Los') : 'Te') + ' espero · Fer';
    notas.value = data.notas || '';

    const actuales = {};
    personas.forEach(function (p) { actuales[p.nombre] = p.respuesta; });

    const lista = opciones(personas);
    acciones.classList.toggle('varias', lista.length > 2);
    acciones.replaceChildren();
    lista.forEach(function (op) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.style.setProperty('--c', op.color);
      b.textContent = op.texto;
      b.setAttribute('aria-pressed', String(iguales(op.respuestas, actuales)));
      b.addEventListener('click', function () { guardar(personas, op); });
      acciones.append(b);
    });

    rsvp.hidden = false;
    if (personas.some(function (p) { return p.respuesta; })) mostrarEstado(mensaje(personas, actuales, false));
  }

  function bloquear(si) {
    acciones.querySelectorAll('button').forEach(function (b) { b.disabled = si; });
  }

  const toast = document.getElementById('toast');
  let toastTimer;

  // Aviso de neón que sube desde abajo y se va solo
  function avisar(titulo, detalle, color, icono) {
    document.getElementById('toast-titulo').textContent = titulo;
    document.getElementById('toast-detalle').textContent = detalle;
    document.getElementById('toast-icono').textContent = icono;
    toast.style.setProperty('--c', color);
    toast.classList.remove('visible');
    void toast.offsetWidth;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('visible'); }, 3800);
  }

  // Frase del aviso según quién va
  function despedida(personas, respuestas) {
    const van = personas.filter(function (p) { return respuestas[p.nombre] === 'si'; });
    const noVan = personas.filter(function (p) { return respuestas[p.nombre] !== 'si'; });
    if (personas.length === 1) return van.length ? '¡Nos vemos el sábado!' : 'Qué mal, te vamos a extrañar.';
    if (!van.length) return 'Qué mal, ' + (sufijo(personas) === 'as' ? 'las' : 'los') + ' vamos a extrañar.';
    if (!noVan.length) return '¡' + (sufijo(personas) === 'as' ? 'Las' : 'Los') + ' espero a ' + (personas.length === 2 ? (sufijo(personas) === 'as' ? 'las dos' : 'los dos') : 'todos') + ' el sábado!';
    return '¡Nos vemos el sábado, ' + unirNombres(van.map(function (p) { return p.nombre; })) + '! ' +
      unirNombres(noVan.map(function (p) { return p.nombre; })) + ', te vamos a extrañar.';
  }

  function guardar(personas, op) {
    const respuestas = op.respuestas;
    bloquear(true);
    mostrarEstado('Guardando…');
    // text/plain evita el preflight CORS que Apps Script no responde
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: token, respuestas: respuestas, notas: notas.value })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error);
        personalizar(data);
        mostrarEstado(mensaje(data.personas, respuestas, true));
        const elegido = acciones.querySelector('[aria-pressed="true"]');
        if (elegido) elegido.classList.add('confirmado');
        avisar('¡Respuesta guardada!', despedida(personas, respuestas), op.color, '✓');
      })
      .catch(function () {
        mostrarEstado('No se guardó la respuesta. Revisa tu conexión e inténtalo otra vez.', true);
        avisar('No se guardó', 'Revisa tu conexión e inténtalo otra vez.', 'var(--rojo)', '!');
      })
      .finally(function () { bloquear(false); });
  }

  fetch(url + '?action=get&token=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok) {
        sinLink.textContent = 'Este link no es válido. Pídele a Fer el tuyo.';
        sinLink.hidden = false;
        return;
      }
      personalizar(data);
    })
    .catch(function () {
      sinLink.textContent = 'No pude cargar tu invitación. Revisa tu conexión y recarga la página.';
      sinLink.hidden = false;
    })
    .finally(mostrarSaludo);
})();
