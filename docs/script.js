// → URL de export CSV de UsuariosDiamond
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

    // parse simple CSV (sin multilínea)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // Solo usamos las 3 columnas que el Apps Script volcó:
    // [UserID, ParentForChart, Tooltip]
    if (rows[0].length < 3) {
      throw new Error('CSV incompleto: faltan columnas UserID/Parent/Tooltip');
    }

    // Preparamos el array para OrgChart
    const dataArray = rows.map(r => [ r[0], r[1], r[2] ]);

    // Dibujamos con Google Charts
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos al cargar la página
drawChart();

