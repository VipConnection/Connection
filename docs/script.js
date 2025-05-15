// script.js

// 1) URL de export CSV apuntando solo a tu pestaña "UsuariosDiamond" (gid=0):
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // parse simple CSV → array filas×columnas
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    // detectamos columnas clave:
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    if ([idxUser, idxParentChart, idxIsMirror].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // preparamos data para OrgChart
    const dataRows = rows.slice(1).filter(r => r[idxUser] !== '');
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];
        const parent   = r[idxParentChart] || '';
        const isMirror = r[idxIsMirror].toLowerCase() === 'true';
        // si no es espejo, mostramos ID línea <br> con nombre/apellidos tal cual vienen en el CSV
        // (suponiendo que la celda UserID ya contiene "4711 Jesús", etc.)
        const tip = `<div style="white-space:nowrap">${id}</div>`;
        return [ id, parent, tip ];
      })
    );

    // 2) Dibuja con Google Charts
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

// 3) Arranca y refresca cada 30 segundos
drawChart();
setInterval(drawChart, 30_000);
