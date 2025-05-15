// script.js

// 1) Ajusta tu gid si es otro
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descarga y parse CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // 3) Encabezados e índices
    const headers    = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');
    if ([idxUser,idxParent,idxMirror,idxName,idxSurname].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Construimos el array para OrgChart
    const dataArray = [
      ['UserID','ParentID','LabelHTML']
    ];
    rows.forEach(r => {
      const id       = r[idxUser];
      if (!id) return;
      const parent   = r[idxParent] || '';
      const isMirror = r[idxMirror].toLowerCase() === 'true';
      const name     = r[idxName]    || '';
      const surname  = r[idxSurname] || '';

      if (!isMirror) {
        // Nodo real: ID + salto de línea + Nombre Apellidos
        const label = `<div style="white-space:nowrap;">${id}<br>${name} ${surname}</div>`;
        dataArray.push([ { v: id, f: label }, parent, '' ]);
      } else {
        // Espejo: solo ID
        dataArray.push([ id, parent, '' ]);
      }
    });

    // 5) Dibujamos con Google Charts OrgChart
    google.charts.load('current', { packages:['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  }// Arrancamos y luego refrescamos cada 30 segundos
drawChart();
setInterval(drawChart, 30 * 1000);

    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// 6) Ejecutamos al cargar la página
drawChart();
