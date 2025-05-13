// script.js
// --------------

// 1) Carga la librería
google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Construye la URL CSV (asegúrate de tu sheetId y gid)
    const sheetId = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
    const gid     = '0'; 
    const csvUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    // 3) Trae el CSV y lo parsea
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 4) Convierte a arreglo de filas
    const rows = text
      .trim()
      .split('\n')
      .map(r => r.split(',').map(c => c.trim()));

    if (rows.length < 2) throw new Error('CSV no tiene datos.');

    // 5) Mira la cabecera y averigua índices
    const header = rows[0];
    console.log('Cabecera CSV:', header);

    const idxId    = header.indexOf('UserID');
    const idxParentFor = header.indexOf('ParentForChart');
    if (idxId < 0 || idxParentFor < 0) {
      throw new Error(
        `No encontré columnas necesarias en CSV: ` +
        `UserID @${idxId}, ParentForChart @${idxParentFor}`
      );
    }

    // 6) Arma el DataTable de Google
    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string','Name');
    dataTable.addColumn('string','Manager');
    dataTable.addColumn('string','ToolTip');

    // 7) Rellena filas (ignora la cabecera)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const id   = cols[idxId];
      const parent = cols[idxParentFor] || '';
      dataTable.addRow([ id, parent, '' ]);
    }

    // 8) Dibuja
    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(dataTable, {allowHtml:true});
    errorDiv.textContent = '';

  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'Error cargando datos:\n' + e.message;
  }
}
