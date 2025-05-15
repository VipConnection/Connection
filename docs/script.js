// script.js

// → URL de export CSV de tu hoja UsuariosDiamond (gid=0)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargar CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Parse sencillo
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');

    if ([idxUser,idxParent,idxMirror,idxName,idxSurname].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 3) Construimos el array para OrgChart
    const dataArray = [
      ['Name','Parent','ToolTip']
    ].concat(
      rows
        .filter(r => r[idxUser])  // sólo filas con ID
        .map(r => {
          const id        = r[idxUser];
          const parent    = r[idxParent] || '';
          const isMirror  = r[idxMirror].toLowerCase() === 'true';
          const name      = r[idxName] || '';
          const surname   = r[idxSurname] || '';

          // Para nodos reales, HTML con ID + <br> + Nombre Apellidos
          // Para espejos, solo el ID
          const cell = !isMirror
            ? { v: id, f: `<div style="white-space:nowrap;">${id}<br>${name} ${surname}</div>` }
            : id;

          return [ cell, parent, '' ];
        })
    );

    // 4) Dibujamos
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

// Arrancamos al cargar la página
drawChart();
