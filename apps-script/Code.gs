/**
 * Backend de confirmaciones para el cumple de Fer.
 *
 * Hoja "Invitados", una fila por persona: token | nombre | genero | respuesta | notas | actualizado
 * Las parejas comparten token (un solo link) y cada quien tiene su propia respuesta.
 * La clave del admin vive en Propiedades del script (ADMIN_KEY), nunca en este archivo.
 */

const SHEET_NAME = 'Invitados';
const RESPUESTAS = ['si', 'no'];
const MAX_NOTAS = 300;

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'get') return json(getInvitacion(p.token));
  if (p.action === 'admin') return json(getTodos(p.key));
  return json({ ok: false, error: 'accion_invalida' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'json_invalido' });
  }
  return json(guardarRespuestas(body.token, body.respuestas, body.notas));
}

function getInvitacion(token) {
  const filas = buscarFilas(token);
  if (!filas.length) return { ok: false, error: 'token_invalido' };
  return {
    ok: true,
    personas: filas.map(function (f) {
      return { nombre: f.valores[1], genero: f.valores[2], respuesta: f.valores[3] || null };
    }),
    notas: filas[0].valores[4] || ''
  };
}

// respuestas: { "Lyn": "si", "Ray": "no" }; debe traer a todas las personas del link
function guardarRespuestas(token, respuestas, notas) {
  if (!respuestas || typeof respuestas !== 'object') return { ok: false, error: 'respuesta_invalida' };
  notas = String(notas || '').slice(0, MAX_NOTAS);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const filas = buscarFilas(token);
    if (!filas.length) return { ok: false, error: 'token_invalido' };
    const valida = filas.every(function (f) { return RESPUESTAS.indexOf(respuestas[f.valores[1]]) !== -1; });
    if (!valida) return { ok: false, error: 'respuesta_invalida' };

    const ahora = new Date();
    filas.forEach(function (f) {
      hoja().getRange(f.indice, 4, 1, 3).setValues([[respuestas[f.valores[1]], notas, ahora]]);
    });
    return getInvitacion(token);
  } finally {
    lock.releaseLock();
  }
}

function getTodos(key) {
  const adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!adminKey || key !== adminKey) return { ok: false, error: 'clave_invalida' };
  const filas = hoja().getDataRange().getValues().slice(1).filter(function (r) { return r[0]; });
  const yaConNota = {};
  const invitados = filas.map(function (r) {
    const con = filas.filter(function (o) { return o[0] === r[0] && o[1] !== r[1]; }).map(function (o) { return o[1]; });
    // La nota es del link: se muestra una sola vez por pareja
    const notas = yaConNota[r[0]] ? '' : (r[4] || '');
    yaConNota[r[0]] = true;
    return {
      nombre: r[1],
      con: con,
      respuesta: r[3] || null,
      notas: notas,
      actualizado: r[5] ? new Date(r[5]).toISOString() : null
    };
  });
  return { ok: true, invitados: invitados };
}

function buscarFilas(token) {
  if (!token || typeof token !== 'string') return [];
  const datos = hoja().getDataRange().getValues();
  const filas = [];
  for (let i = 1; i < datos.length; i++) {
    if (datos[i][0] === token) filas.push({ indice: i + 1, valores: datos[i] });
  }
  return filas;
}

function hoja() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
