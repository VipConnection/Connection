// script.js

// → URL CSV apuntando a la pestaña "UsuariosDiamond" (gid=0)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Traer CSV
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // 2) Parse sencillo de CSV a matriz
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // 3) Índices de columnas clave
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    if ([idxUser, idxParentChart, idxIsMirror].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Filtrar filas útiles (UserID no vacío)
    const dataRows = rows.slice(1).filter(r => r[idxUser] !== '');
    console.log(`Filas totales: ${rows.length-1}, útiles: ${dataRows.length}`);

    // 5) Construir dataArray para OrgChart
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];                         // p.ej. "4711 Jesús"
        const parent   = r[idxParentChart] || '';            // p.ej. "7 System" o ""
        const isMirror = r[idxIsMirror].toLowerCase() === 'true';
        // el tooltip mostramos el mismo contenido id (que ya incluye nombre/apellidos)
        const tip = `<div style="white-space:nowrap">${id}</div>`;
        return [ id, parent, tip ];
      })
    );

    // 6) Cargar y dibujar con Google Charts
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  } catch (err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Ejecutar al cargar y luego cada 30 s
drawChart();
setInterval(drawChart, 30_000);
