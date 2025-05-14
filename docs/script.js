// → Sustituye el gid si fuera distinto
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

    // parse sencillo (sin multilíneas con comillas)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows.shift();
    console.log('Cabecera CSV:', headers);

    // detectamos índices *exactos*
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');

    if (idxUser < 0 || idxParentChart < 0 || idxIsMirror < 0) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // filtramos filas que tengan ID
    const dataRows = rows.filter(r => r[idxUser] !== '');

    console.log(`Filas totales: ${rows.length}, filas útiles: ${dataRows.length}`);

    // preparamos la tabla para OrgChart:
    // [ [ 'ID', 'Parent', 'HTML-tooltip' ], ... ]
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const rawId      = r[idxUser];                // e.g. "4735 Aaron"
        const parent     = r[idxParentChart] || '';
        const isMirror   = r[idxIsMirror].toLowerCase() === 'true';

        // Desglosamos rawId por espacio para separar ID de nombre
        const [ id, ...nameParts ] = rawId.split(' ');
        const nombreCompleto = nameParts.join(' ');

        // Creamos un tooltip en HTML: primera línea ID, segunda nombre completo
        const tip = `<div style="text-align:center">
                       <strong>${id}</strong><br/>
                       ${nombreCompleto}
                     </div>`;

        return [ rawId, parent, tip ];
      })
    );

    // cargamos y dibujamos
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

// ¡Arrancamos!
drawChart();
