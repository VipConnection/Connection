// → Sustituye el gid por el de tu pestaña "UsuariosDiamond"
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // parse muy simple (no multilínea)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // índices obligatorios
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    const idxLevel       = headers.indexOf('Level');
    // índices opcionales
    const idxNombre      = headers.indexOf('Nombre');
    const idxApellidos   = headers.indexOf('Apellidos');

    // valida **solo** las 4 obligatorias
    if ([idxUser, idxParentChart, idxIsMirror, idxLevel].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    const dataRows = rows.slice(1).filter(r => r[idxUser] !== '');
    console.log(`Filas totales: ${rows.length - 1}, filas útiles: ${dataRows.length}`);

    // preparamos OrgChart: [ ['UserID','ParentID','Tooltip'], ... ]
    const dataArray = [['UserID','ParentID','Tooltip']];
    dataRows.forEach(r => {
      const id       = r[idxUser];
      const parent   = r[idxParentChart] || '';
      const isMirror = r[idxIsMirror].toLowerCase() === 'true';

      // construye línea de nombre/apellidos sólo si existen
      const nombre    = idxNombre  >= 0 ? r[idxNombre]   : '';
      const apellidos = idxApellidos>= 0 ? r[idxApellidos]: '';
      const linea2    = (nombre + ' ' + apellidos).trim();

      // HTML del tooltip
      const tip = linea2
        ? `<div style="text-align:center"><strong>${id}</strong><br>${linea2}</div>`
        : `<div style="text-align:center"><strong>${id}</strong></div>`;

      dataArray.push([ id, parent, tip ]);
    });

    // dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray, true);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

drawChart();
