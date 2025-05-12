// 1) Igual que antes: fetch CSV → rows
// Suponemos header en rows[0] y datos en rows.slice(1)
const header = rows[0];
const data   = rows.slice(1);
const idxUser    = header.indexOf('UserID');
const idxParent  = header.indexOf('ParentID');
const idxMirror  = header.indexOf('isMirror');
const firstMir   = 4;  // columna E en adelante: tus espejos
// 2) Monta mirrorMap igual que arriba
const mirrorMap = {};
data.forEach(r=>{
  const pid = r[idxParent];
  mirrorMap[pid] = mirrorMap[pid]||[];
  mirrorMap[pid].push(r.slice(firstMir));
});
// 3) Genera filas:
const chartRows = [];
// no espejos
data.filter(r=>r[idxMirror]!=="TRUE").forEach(r=>{
  chartRows.push([ r[idxUser], '' ]);
});
// espejos
data.filter(r=>r[idxMirror]==="TRUE").forEach(r=>{
  const uid=r[idxUser], pid=r[idxParent];
  // posición dentro de mirrorMap[pid]
  const pos = mirrorMap[pid].findIndex(arr=>arr.includes(uid));
  // espejo del abuelo en la misma posición
  const grandMir = mirrorMap[pid][pos][pos];
  chartRows.push([ uid, grandMir ]);
});
// 4) Pon chartRows en tu DataTable y dibuja…
