// script.js

// 1) Pon aquí la URL CSV de tu pestaña UsuariosDiamond
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Fetch + texto
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // 3) Parse CSV muy simple (nada de comillas especiales)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));

    // 4) Cabecera y detección flexible de índices:
    const headers = rows[0];
    console.log('Cabecera CSV:', headers);
    const idxUser   = headers.findIndex(h => h.toLowerCase().replace(/\s/g,'') === 'userid');
    const idxParent = headers.findIndex(h => /parentforchar/i.test(h));
    const idxMirror = headers.findIndex(h => h.toLowerCase().replace(/\s/g,'') === 'ismirror');
    const idxLevel  = headers.findIndex(h => h.toLowerCase().replace(/\s/g,'') === 'level');

    if ([idxUser, idxParent, idxMirror, idxLevel].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 5) Filtramos sólo filas con ID no vacío
    const dataRows = rows
      .slice(1)
      .filter(r => r[idxUser] !== '');

    console.log(`Filas totales: ${rows.length - 1}, filas útiles: ${dataRows.length}`);

    // 6) Armamos el array para arrayToDataTable (ID, ParentID, Tooltip)
    const dataArray = [
      ['UserID', 'ParentID', 'Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];
        const parent   = r[idxParent] || null;
        const isMirror = /^true$/i.test(r[idxMirror]);
        // Si es espejo, añadimos “(m)” al tooltip
        const tooltip  = isMirror ? `${id} (m)` : `${id}`;
        return [ id, parent, tooltip ];
      })
    );

    // 7) Cargamos Google Charts y dibujamos
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, {
        allowHtml: true,
        nodeClass: 'node',
        tooltip:   { isHtml: false }
      });
      errorDiv.textContent = '';
    });

  } catch (err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arranca
drawChart();

