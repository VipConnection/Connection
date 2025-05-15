// → Sustituye el GID si cambias de pestaña
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp    = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // parse muy simple
    const rows    = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // buscamos los índices que necesitamos
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    const idxName        = headers.indexOf('Nombre');
    const idxSurname     = headers.indexOf('Apellidos');

    if ([idxUser, idxParentChart, idxIsMirror, idxName, idxSurname].some(i => i <
