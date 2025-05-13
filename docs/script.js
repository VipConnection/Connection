// script.js

// URL de tu hoja UsuariosDiamond en formato CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';
  try {
    // 1) Traemos el CSV
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Lo parseamos a matriz
    const rows = text
      .trim()
      .split('\n')
      .map(line => line.split(',').map(cell => cell.trim()));

    // 3) Extraemos cabecera e índices
    const headers = rows[0];
    const idxUser   = headers.indexOf('UserID');
    const idxParent = headers.indexOf('ParentForChart');
    const idxMirror = headers.indexOf('isMirror');
    const idxLevel  = headers.indexOf('Level');
    if ([idxUser, idxParent, idxMirror, idxLevel].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }
    console.log('Cabecera CSV:', headers);

    // 4) Filtramos filas útiles (descartamos la cabecera y filas sin ID)
    const dataRows = rows
      .slice(1)
      .filter(r => r[idxUser] !== '');

    console.log('Filas totales:', rows.length - 1,
                'filas útiles:', dataRows.length);

    // 5) Creamos la DataTable con sólo dos columnas (ID y padre)
    const dataArray = [
      // encabezado para arrayToDataTable
      ['UserID', 'ParentID', 'Tooltip']
    ].concat(
      dataRows.map(r => {
        const id      = r[idxUser];
        const parent  = r[idxParent] || null;
        const isMirror = r[idxMirror].toLowerCase() === 'true';
        // para que al pasar el tooltip muestre "ID + (m)" si es espejo
        const tooltip = isMirror ? `${id} (m)` : id;
        return [ id, parent, tooltip ];
      })
    );

    // 6) Dibujamos con la API de Google OrgChart
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, {
        allowHtml: true,
        nodeClass: 'node',
        tooltip: { isHtml: false }
      });
      errorDiv.textContent = '';
    });

  } catch (err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// empezamos
drawChart();
