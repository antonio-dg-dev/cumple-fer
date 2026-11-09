/**
 * Backend de confirmaciones para el cumple de Fer.
 *
 * Hoja "Invitados" con columnas: token | nombre | respuesta | notas | actualizado
 * La clave del admin vive en Propiedades del script (ADMIN_KEY), nunca en este archivo.
 */

const SHEET_NAME = 'Invitados';
const RESPUESTAS = ['si', 'no'];
const MAX_NOTAS = 300;

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'get') return json(getInvitado(p.token));
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
  return json(guardarRespuesta(body.token, body.respuesta, body.notas));
}

function getInvitado(token) {
  const fila = buscarFila(token);
  if (!fila) return { ok: false, error: 'token_invalido' };
  return { ok: true, nombre: fila.valores[1], respuesta: fila.valores[2] || null, notas: fila.valores[3] || '' };
}

function guardarRespuesta(token, respuesta, notas) {
  if (RESPUESTAS.indexOf(respuesta) === -1) return { ok: false, error: 'respuesta_invalida' };
  notas = String(notas || '').slice(0, MAX_NOTAS);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const fila = buscarFila(token);
    if (!fila) return { ok: false, error: 'token_invalido' };
    hoja().getRange(fila.indice, 3, 1, 3).setValues([[respuesta, notas, new Date()]]);
    return { ok: true, nombre: fila.valores[1], respuesta: respuesta, notas: notas };
  } finally {
    lock.releaseLock();
  }
}

function getTodos(key) {
  const adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!adminKey || key !== adminKey) return { ok: false, error: 'clave_invalida' };
  const invitados = hoja().getDataRange().getValues().slice(1)
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return { nombre: r[1], respuesta: r[2] || null, notas: r[3] || '', actualizado: r[4] ? new Date(r[4]).toISOString() : null };
    });
  return { ok: true, invitados: invitados };
}

function buscarFila(token) {
  if (!token || typeof token !== 'string') return null;
  const datos = hoja().getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    if (datos[i][0] === token) return { indice: i + 1, valores: datos[i] };
  }
  return null;
}

function hoja() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
