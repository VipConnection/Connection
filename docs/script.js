function rebuildUsuariosDiamond() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName('RespuestasDiamond');
  const dst = ss.getSheetByName('UsuariosDiamond');
  if (!src || !dst) {
    throw new Error('No encuentro las pestañas RespuestasDiamond o UsuariosDiamond');
  }

  // 1) Leemos todo el rango, separamos cabecera y filtramos filas válidas
  const all     = src.getDataRange().getValues();
  const headers = all.shift();

  const idxUser   = headers.indexOf('Tu propio ID');
  const idxParent = headers.indexOf('ID de quien te invita');
  if (idxUser < 0 || idxParent < 0) {
    throw new Error('No hallé las columnas “Tu propio ID” o “ID de quien te invita”');
  }

  // filtramos sólo filas donde ambos campos estén llenos
  const rows = all.filter(r =>
    String(r[idxUser]).trim()   !== '' &&
    String(r[idxParent]).trim() !== ''
  );

  // 2) construimos mapa { id → { id, parent, mirrors[], level, chartParent } }
  const map = {};
  rows.forEach(r => {
    const id      = r[idxUser];
    const parent  = r[idxParent];
    // extraemos todas las columnas que empiecen por "Espejo"
    const mirrors = headers
      .map((h,i) => h && String(h).startsWith('Espejo') ? r[i] : null)
      .filter(v => v);
    map[id] = { id, parent, mirrors, level: null, chartParent: null };
  });

  // 3) recursión para asignar level y chartParent
  function setNode(id) {
    const node = map[id];
    if (node.level !== null) return;
    const p = map[node.parent];
    if (!p) {
      node.level       = 0;
      node.chartParent = '';
    } else {
      setNode(node.parent);
      node.level       = p.level + 1;
      node.chartParent = node.parent;
    }
    // luego sus mirrors
    node.mirrors.forEach(m => {
      map[m] = { id: m, parent: id, mirrors: [], level: null, chartParent: null };
      setNode(m);
    });
  }
  Object.keys(map).forEach(setNode);

  // 4) preparamos salida
  const output = [
    ['UserID','ParentID','isMirror','Level','ParentForChart']
  ];
  Object.values(map).forEach(n => {
    // nodo “real”
    output.push([ n.id, n.parent, false, n.level, n.chartParent ]);

    // ahora cada espejo de n
    n.mirrors.forEach((m, i) => {
      const mn = map[m];
      // ----- AQUÍ VA LA LÓGICA NUEVA PARA EL ParentForChart DE LOS ESPEJOS -----
      // abuelo de este espejo = chartParent de n
      const abuID = n.chartParent;
      let abuMirrors = [];
      if (abuID && map[abuID]) {
        abuMirrors = map[abuID].mirrors || [];
      }
      // elegimos el espejo i-ésimo del abuelo, si no existe, fallback al padre directo
      const chartParForMirror = abuMirrors[i] || n.id;
      // ------------------------------------------------------------------------

      output.push([
        m,               // UserID = espejo
        n.id,            // ParentID = quien lo envuelve
        true,            // isMirror
        mn.level,        // mismo nivel calculado
        chartParForMirror
      ]);
    });
  });

  // 5) volcamos en la hoja
  dst.clearContents();
  dst
    .getRange(1, 1, output.length, output[0].length)
    .setValues(output);
  /**
 * Se ejecuta en toda edición del libro.
 * Si la edición está en la hoja "RespuestasDiamond",
 * llama a nuestra función de reconstrucción.
 */
function onEdit(e) {
  const hoja = e.range.getSheet();
  if (hoja.getName() === 'RespuestasDiamond') {
    rebuildUsuariosDiamond();
  }
}
  
}

