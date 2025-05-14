// → Sustituye el gid por el de tu pestaña "UsuariosDiamond"
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargamos el CSV
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // 2) Parseamos muy simplemente
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // 3) Detectamos índices
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    // Nota: Level no lo usamos para el dibujo, pero podríamos
    if (idxUser < 0 || idxParentChart < 0 || idxIsMirror < 0) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Filtramos filas con ID
    const dataRows = rows.slice(1).filter(r => r[idxUser] !== '');

    console.log(`Filas totales: ${rows.length -1}, filas útiles: ${dataRows.length}`);

    // 5) Construimos el array para OrgChart
    //    Columnas: [ string UserID, string ParentID, HTML Tooltip ]
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];
        const parent   = r[idxParentChart] || '';
        const isMirror = r[idxIsMirror].toLowerCase() === 'true';
        // En el tooltip ponemos ID y, si no es espejo, lo puedes cambiar
        // para añadir nombre/apellidos si los tienes en otra columna.
        const tip = isMirror
          ? `<div style="white-space:nowrap">${id} (m)</div>`
          : `<div style="white-space:nowrap">${id}</div>`;

        // **Aquí forzamos que UserID y ParentID sean siempre string**
        return [
          String(id),
          String(parent),
          tip
        ];
      })
    );

    // 6) Cargamos y dibujamos el gráfico
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

// Ejecutamos al cargar
drawChart();
