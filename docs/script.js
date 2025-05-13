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

  // 2) Construimos un mapa { id → { id, parent, mirrors[], level, chartParent } }
  const map = {};
  rows.forEach(r => {
    const id      = r[idxUser];
    const parent  = r[idxParent];
    // Extraemos todos los “Espejo X” (columnas que empiezan por “Espejo”)
    const mirrors = headers
      .map((h,i) => String(h||'').startsWith('Espejo') ? r[i] : null)
      .filter(v => v);
    map[id] = { id, parent, mirrors, level: null, chartParent: null };
  });

  // 3) Recursión para asignar level y chartParent, colgando mirrors bajo
  //    el espejo correspondiente del abuelo (si existe), o bajo el padre.
  function setNode(id) {
    const node = map[id];
    if (!node || node.level !== null) return;  // ya procesado o inexistente

    const p = map[node.parent];
    if (!p) {
      // nivel 0 si no hay padre
      node.level       = 0;
      node.chartParent = '';
    } else {
      // aseguramos procesar primero al padre
      setNode(node.parent);
      node.level       = p.level + 1;
      node.chartParent = node.parent;
    }

    // ahora procesamos los mirrors originales de este nodo
    node.mirrors.forEach((m, i) => {
      // buscamos el espejo 'i' del padre (p.mirrors[i]); si no existe, colgamos del nodo.id
      const attachTo = (p && Array.isArray(p.mirrors) && p.mirrors[i])
        ? p.mirrors[i]
        : node.id;

      // creamos/reescribimos la definición del mirror
      map[m] = {
        id: m,
        parent: attachTo,
        mirrors: [],        // los espejos de un espejo no se reflejan
        level: null,
        chartParent: null
      };
      // lo procesamos recursivamente
      setNode(m);
    });
  }

  // aplicamos a todos
  Object.keys(map).forEach(setNode);

  // 4) Preparamos la matriz de salida: cabecera + filas
  const output = [
    ['UserID','ParentID','isMirror','Level','ParentForChart']
  ];
  Object.values(map).forEach(n => {
    // primero el nodo “real”
    output.push([ n.id, n.parent, false, n.level, n.chartParent ]);
    // luego cada espejo “real→mirror”
    n.mirrors.forEach(m => {
      const mn = map[m];
      output.push([ m, mn.parent, true, mn.level, mn.chartParent ]);
    });
  });

  // 5) Volcamos en la hoja UsuariosDiamond
  dst.clearContents();
  dst
    .getRange(1, 1, output.length, output[0].length)
    .setValues(output);
}
