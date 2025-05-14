// script.js

// → Sustituye el gid por el de tu pestaña "UsuariosDiamond"
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=TU_GID_USUARIOS';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // parse muy simple (no comillas multilínea)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // detectamos índices *exactos*
    const idxUser         = headers.indexOf('UserID');
    const idxParentChart  = headers.indexOf('ParentForChart');
    const idxIsMirror     = headers.indexOf('isMirror');
    const idxLevel        = headers.indexOf('Level');

    if ([idxUser, idxParentChart, idxIsMirror, idxLevel].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    const dataRows = rows.slice(1).filter(r => r[idxUser] !== '');

    console.log(`Filas totales: ${rows.length -1}, filas útiles: ${dataRows.length}`);

    // Preparamos sólo las tres columnas que OrgChart necesita
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];
        const parent   = r[idxParentChart] || '';
        const isMirror = r[idxIsMirror].toLowerCase() === 'true';
        const tip      = isMirror
          ? `${id} (m)`
          : `${id}`;
        return [ id, parent, tip ];
      })
    );

    // dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// ¡Arrancamos!
drawChart();
