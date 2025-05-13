function rebuildUsuariosDiamond() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName('RespuestasDiamond');
  const dst = ss.getSheetByName('UsuariosDiamond');
  if (!src || !dst) {
    throw new Error('No encuentro las pestañas RespuestasDiamond o UsuariosDiamond');
  }

  // 1) Leemos todo el rango, separamos cabecera y filtramos filas válidas
  const all     = src.getDataRange().getValues();
  const headers = all.shift();  // primera fila = títulos de columna

  // Detectamos índices de “Tu propio ID” y “ID de quien te invita”
  const idxUser   = headers.indexOf('Tu propio ID');
  const idxParent = headers.indexOf('ID de quien te invita');
  if (idxUser < 0 || idxParent < 0) {
    throw new Error('No hallé las columnas “Tu propio ID” o “ID de quien te invita”');
  }

  // Filtramos sólo las filas donde ambos campos estén llenos
  const rows = all.filter(r =>
    String(r[idxUser]).trim()   !== '' &&
    String(r[idxParent]).trim() !== ''
  );

  // 2) Construimos un mapa { id → { id, parent, mirrors[], level, chartParent, isMirror } }
  const map = {};
  rows.forEach(r => {
    const id      = r[idxUser];
    const parent  = r[idxParent];
    // Extraemos todos los “Espejo X” (columnas que empiezan por “Espejo”)
    const mirrors = headers
      .map((h,i) => h && String(h).startsWith('Espejo') ? r[i] : null)
      .filter(v => v);
    map[id] = { id, parent, mirrors, level: null, chartParent: null, isMirror: false };
  });

  // 3) Recursión para asignar level, chartParent e incorporar los mirrors con su padre correcto
  function setNode(id) {
    const node = map[id];
    if (!node || node.level !== null) return;  // ya procesado o inexistente

    const p = map[node.parent];
    if (!p) {
      // sin padre conocido → nivel 0
      node.level       = 0;
      node.chartParent = '';
    } else {
      setNode(node.parent);
      node.level       = p.level + 1;
      node.chartParent = node.parent;
    }

    // Ahora procesamos sus mirrors: cada mirror_i cuelga de p.mirrors[i]
    node.mirrors.forEach((m, i) => {
      const parentMirror = (p && p.mirrors[i]) ? p.mirrors[i] : node.parent;
      map[m] = {
        id: m,
        parent: parentMirror,
        mirrors: [],            // los espejos de un espejo no los consideramos
        level: null,
        chartParent: null,
        isMirror: true
      };
      setNode(m);
    });
  }
  Object.keys(map).forEach(setNode);

  // 4) Preparamos la matriz de salida: cabecera + todas las filas (reales y espejos)
  const output = [
    ['UserID','ParentID','isMirror','Level','ParentForChart']
  ];
  Object.values(map).forEach(n => {
    output.push([ n.id, n.parent, n.isMirror, n.level, n.chartParent ]);
  });

  // 5) Volcamos en la hoja UsuariosDiamond
  dst.clearContents();
  dst
    .getRange(1, 1, output.length, output[0].length)
    .setValues(output);
}
