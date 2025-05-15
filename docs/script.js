// script.js

// 1) URL de tu pestaña UsuariosDiamond (gid=0)
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Fetch + parse CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(r => r
        .split(',')
        .map(c => c.replace(/^"|"$/g, '').trim())
      );

    // 3) Encabezados e índices
    const headers      = rows.shift();
    const idxUser      = headers.indexOf('UserID');
    const idxParentFor = headers.indexOf('ParentForChart');
    const idxMirror    = headers.indexOf('isMirror');
    const idxName      = headers.indexOf('Nombre');
    const idxSurname   = headers.indexOf('Apellidos');
    if ([idxUser, idxParentFor, idxMirror, idxName, idxSurname].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Montamos el array que pide OrgChart
    const dataArray = [['id','parent','toolt]()]()
