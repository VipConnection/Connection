function rebuildUsuariosDiamond() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName('RespuestasDiamond');
  const dst = ss.getSheetByName('UsuariosDiamond');
  if (!src || !dst) {
    throw new Error('No encuentro las pestañas RespuestasDiamond o UsuariosDiamond');
  }

  // 1) Leemos todo el rango, separamos cabecera y filtramos filas válidas
  const all     = src.getDataRange().getValues();
  const headers = all.shift();  // títulos

  const idxUser   = headers.indexOf('Tu propio ID');
  const idxParent = headers.indexOf('ID de quien te invita');
  if (idxUser < 0 || idxParent < 0) {
    throw new Error('No hallé las columnas “Tu propio ID” o “ID de quien te invita”');
  }

  // filas con ID y padre no vacíos
  const rows = all.filter(r =>
    String(r[idxUser]).trim()   !== '' &&
    String(r[idxParent]).trim() !== ''
  );

  // 2) Mapa { id → { id, parent, mirrors[], level, chartParent } }
  const map = {};
  rows.forEach(r => {
    const id      = r[idxUser];
    const parent  = r[idxParent];
    // extraemos todas las columnas “Espejo X”
    const mirrors = headers
      .map((h,i) => h && String(h).startsWith('Espejo') ? r[i] : null)
      .filter(v => v);
    map[id] = { id, parent, mirrors, level: null, chartParent: null };
  });

  // 3) Recursión para level y chartParent
  function setNode(id) {
    const node = map[id];
    if (node.level !== null) return;  // ya hecho
    const p = map[node.parent];
    if (!p) {
      node.level       = 0;
      node.chartParent = '';
    } else {
      setNode(node.parent);
      node.level       = p.level + 1;
      node.chartParent = node.parent;
    }
    // luego sus mirrors “colgados”
    node.mirrors.forEach(m => {
      map[m] = { id: m, parent: id, mirrors: [], level: null, chartParent: null };
      setNode(m);
    });
  }
  Object.keys(map).forEach(setNode);

  // 4) Preparamos la matriz de salida
  const output = [
    ['UserID','ParentID','isMirror','Level','ParentForChart']
  ];
  Object.values(map).forEach(n => {
    // 4.a) nodo “real”
    output.push([ n.id, n.parent, false, n.level, n.chartParent ]);

    // 4.b) cada espejo de n
    n.mirrors.forEach((m, i) => {
      const mn = map[m];
      // === NUEVA LÓGICA de ParentForChart para espejos ===
      // tomamos el chartParent de n (el abuelo real)
      const abuID = n.chartParent;
      let abuMirrors = [];
      if (abuID && map[abuID]) {
        abuMirrors = map[abuID].mirrors || [];
      }
      // espejo i-ésimo del abuelo, o fallback a n.id
      const chartParForMirror = abuMirrors[i] || n.id;
      // ====================================================
      output.push([
        m,                    // UserID = este espejo
        n.id,                 // ParentID = su nodo real
        true,                 // isMirror
        mn.level,             // mismo level
        chartParForMirror     // nuevo ParentForChart
      ]);
    });
  });

  // 5) Volcamos en UsuariosDiamond
  dst.clearContents();
  dst.getRange(1,1,output.length,output[0].length)
     .setValues(output);
}

// Se dispara en cada edición de RespuestasDiamond
function onEdit(e) {
  const hoja = e.range.getSheet();
  if (hoja && hoja.getName() === 'RespuestasDiamond') {
    rebuildUsuariosDiamond();
  }
}
