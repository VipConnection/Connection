// script.js

// 1) Función principal para dibujar el organigrama
async function drawChart() {
  const sheetId  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';  // tu ID de Spreadsheet
  const sheetGid = '0';      // <--- AQUÍ: el GID de la pestaña "UsuariosDiamond"
  const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('gráfico_div');

  try {
    console.log('Fetching CSV:', csvUrl);
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Parse CSV a matriz y extraer cabecera
    const rows    = text.trim().split('\n').map(r => r.split(','));
    const headers = rows.shift().map(h => h.trim());
    console.log('Cabecera CSV:', headers);

    // 3) Crear DataTable con las 5 columnas fijas
    const data = new google.visualization.DataTable();
    data.addColumn('string',  'UserID');
    data.addColumn('string',  'ParentID');
    data.addColumn('boolean', 'isMirror');
    data.addColumn('number',  'Level');
    data.addColumn('string',  'ParentForChart');

    // 4) Rellenar filas útiles
    const useful = rows.filter(r => r[0] !== '');
    console.log('Filas totales:', rows.length, 'filas útiles:', useful.length);

    useful.forEach(r => {
      data.addRow([
        r[0],                        // UserID
        r[1],                        // ParentID
        r[2].toLowerCase()==='true', // isMirror
        Number(r[3])||0,             // Level
        r[4]                         // ParentForChart
      ]);
    });

    // 5) Dibujar el OrgChart
    new google.visualization.OrgChart(chartDiv)
      .draw(data, { allowHtml: true });

    errorDiv.textContent = '';
  } catch (err) {
    console.error(err);
    errorDiv.textContent = `Error cargando datos: ${err.message}`;
  }
}

// 0) Cargar la librería y lanzar
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);
