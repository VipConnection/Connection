/**
 * Reconstruye el organigrama con espejos “alineados”
 * Usando la hoja “UsuariosDiamond” completa
 */
function rebuildUsuariosDiamond() {
  const ss  = SpreadsheetApp.getActive();
  const src = ss.getSheetByName('UsuariosDiamond');
  const dst = ss.getSheetByName('UsuariosDiamond'); // no la tocamos, solo leemos
  if (!src) throw new Error('No encuentro la hoja “UsuariosDiamond”');

  // Leemos B:L (UserID, ParentID, isMirror, Nivel, espejo1… espejo9)
  const last = src.getLastRow();
  const raw  = src.getRange(`B1:L${last}`).getValues();
  const header = raw.shift();
  // columnas:
  const IDX_USER    = header.indexOf('UserID');
  const IDX_PARENT  = header.indexOf('ParentID');
  const IDX_ISMIRROR= header.indexOf('isMirror');
  // a partir de la 5ª columna están tus espejos espejo1…espejo9
  const firstMirrorCol = 4;

  // Construimos mapa de hijos: para cada padre, array de sus espejos por posición
  const mirrorMap = {}; // mirrorMap[parentID] = [ [mir1_of_childA, mir2…], [mir1_of_childB…], … ]
  raw.forEach(r => {
    const pid = r[IDX_PARENT];
    if (!mirrorMap[pid]) mirrorMap[pid] = [];
    mirrorMap[pid].push(r.slice(firstMirrorCol));
  });

  // Ahora generamos el array final de “filas” para el chart:
  // 1) Primero las filas «normales» (no espejo): [ UserID, '' ]
  // 2) Luego por cada hijo, sus espejos bajo cada espejo de padre
  const rows = [];
  // 1) No espejos
  raw.filter(r => !r[IDX_ISMIRROR]).forEach(r => {
    rows.push([ String(r[IDX_USER]), '' ]);
  });
  // 2) Espejos:
  raw.filter(r => r[IDX_ISMIRROR]).forEach(r => {
    const uid = String(r[IDX_USER]);
    const pid = r[IDX_PARENT];
    const pos = mirrorMap[pid].findIndex(arr => arr.includes(uid)); 
    // pos = cuál posición dentro del array de espejos de ese padre
    // buscamos en mirrorMap[pid] dónde aparece este uid
    const parentMirrors = mirrorMap[pid]; // matriz: [ [mirrors of child1], [mirrors of child2], … ]
    const mgr = parentMirrors.map(row=>row)[pos]; 
    // mgr = array de espejos de ese padre para la posición pos
    // en realidad queremos coger el valor en esa misma columna:
    const mirrorOfGrandpa = mgr[pos]; 
    // ojo: asumimos mismo índice
    rows.push([ uid, String(mirrorOfGrandpa) ]);
  });

  // Escribimos esas filas en una hoja intermedia (por ejemplo “ParaChart”), o las devolvemos a la UI
  const out = ss.getSheetByName('ParaChart');
  out.clear();
  out.getRange(1,1,rows.length,2).setValues(rows);
}
