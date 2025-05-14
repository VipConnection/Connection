// → Ajusta este URL con el gid de tu pestaña UsuariosDiamond:
const CSV_URL = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs'
  + '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // 1) Parse muy simple
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // 2) Índices
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    const idxName        = headers.indexOf('Nombre');
    const idxSurname     = headers.indexOf('Apellidos');
    if ([idxUser, idxParentChart, idxIsMirror, idxName, idxSurname]
        .some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 3) Filtramos datos (quitamos encabezado y filas basura)
    const dataRows = rows
      .slice(1)
      .filter(r => {
        const u = r[idxUser];
        return u && u !== 'UserID' && u !== 'ParentID';
      });

    console.log(`Filas totales: ${rows.length -1}, filas útiles: ${dataRows.length}`);

    // 4) Armamos la matriz que OrgChart necesita
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const rawID   = r[idxUser];
        const parent  = r[idxParentChart] || '';
        const isM     = r[idxIsMirror].toLowerCase() === 'true';
        // mostramos ID y nombre/apellidos en dos líneas:
        const nombre  = r[idxName]    || '';
        const apel    = r[idxSurname] || '';
        const label   = `<div style="white-space:nowrap">`
                      + `${rawID}<br>${nombre} ${apel}`
                      + `</div>`;
        // tooltip podría usarse igual, o quedarse vacío:
        const tip     = isM
                      ? `${rawID} (m)`
                      : label;
        return [ label, parent, tip ];
      })
    );

    // 5) Dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=> {
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
