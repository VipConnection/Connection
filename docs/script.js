// 1) Carga Google Charts
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs'; // tu ID de Spreadsheet
  const sheetGid = '0';                                          // GID de la pestaña “UsuariosDiamond”
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;

  const errorDiv = document.getElementById('error');
  try {
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Convertimos CSV a array de filas
    const rows = text.trim().split('\n').map(r => r.split(','));

    // 3) Eliminamos la primera fila (la de la fórmula)
    rows.shift();

    // 4) Creamos DataTable
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Name');
    data.addColumn('string', 'Manager');

    // 5) Fijos índices:
    const IDX_USER   = 0;   // columna A → UserID
    const IDX_PARENT = 4;   // columna E → ParentForChart
    const IDX_MIRROR = 2;   // columna C → isMirror

    // 6) Añadimos cada fila: si es espejo, manager=ParentForChart, si no, manager vacío
    rows.forEach(r => {
      const name    = r[IDX_USER];
      const manager = (r[IDX_MIRROR] === 'TRUE') ? r[IDX_PARENT] : '';
      data.addRow([ name, manager ]);
    });

    // 7) Dibujamos
    const chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';
  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'Error: ' + e.message;
  }
}
