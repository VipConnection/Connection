// script.js

// → URL CSV de UsuariosDiamond (gid=0)
const CSV_URL_USERS =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargamos el CSV
    const resp = await fetch(CSV_URL_USERS);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} leyendo UsuariosDiamond`);
    const csvText = await resp.text();

    // 2) Parse muy básico
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows.shift();
    const idxLabel = headers.indexOf('LabelHTML');
    const idxParent= headers.indexOf('ParentForChart');
    if (idxLabel < 0 || idxParent < 0) {
      throw new Error('Faltan columnas LabelHTML o ParentForChart en CSV');
    }

    // 3) Preparamos array para OrgChart
    const dataArray = [
      ['Name','Parent','Tooltip']
    ];
    rows.forEach(r => {
      const label  = r[idxLabel];
      const parent = r[idxParent] || '';
      dataArray.push([ label, parent, '' ]);
    });

    // 4) Dibujamos con Google Charts
    google.charts.load('current', { packages: ['orgchart'] });
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

// Arrancamos
drawChart();

