// script.js

// → URL CSV de UsuariosDiamond (gid=0)
const CSV_URL_USERS =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargamos CSV
    const resp = await fetch(CSV_URL_USERS);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} leyendo UsuariosDiamond`);
    const csvText = await resp.text();

    // 2) Parse básico
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g,'').trim()));

    const headers = rows.shift();
    const idxLabel  = headers.indexOf('LabelHTML');
    const idxParent = headers.indexOf('ParentForChart');
    if (idxLabel < 0 || idxParent < 0) {
      throw new Error('Faltan LabelHTML o ParentForChart en CSV');
    }

    // 3) Montamos DataTable
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');

      // agregamos cada fila: usamos {v:'',f:HTML} para pintar el HTML
      rows.forEach(r => {
        const html   = r[idxLabel];
        const parent = r[idxParent] || '';
        data.addRow([ { v: '', f: html }, parent ]);
      });

      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arranca al cargar la página
drawChart();
