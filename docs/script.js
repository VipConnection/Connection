// 1) Pon aquí tu URL de publicación cambiada a "pub?...output=gviz&tq="
const BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-k0yGn0cmwcezx0ey1KYRLkOPt7mtqFXQ_kedc6WGeWYxJIqJEaC-oOYw4lL_dVpF6ooSfOXSflX/pub?gid=0&single=true';
const QUERY_URL = BASE
  + '?gid=0&single=true&headers=1&output=gviz&tq='
  + encodeURIComponent('SELECT B, E, C, M, N');

function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  // 2) Crea y envía la consulta
  const query = new google.visualization.Query(QUERY_URL);
  query.send(res => {
    if (res.isError()) {
      errorDiv.textContent = 'Error Sheet: ' + res.getMessage();
      return;
    }
    // 3) Extrae la DataTable
    const dt = res.getDataTable();

    // 4) Reconstruye el array para OrgChart
    const dataArray = [['UserID','ParentID','LabelHTML']];
    for (let i = 0; i < dt.getNumberOfRows(); i++) {
      const id      = dt.getValue(i, 0);
      if (!id) continue;
      const parent  = dt.getValue(i, 1) || '';
      const isMir   = String(dt.getValue(i, 2)).toLowerCase() === 'true';
      const name    = dt.getValue(i, 3) || '';
      const surname = dt.getValue(i, 4) || '';

      if (!isMir) {
        // Nodo real: ID + nombre/apellidos
        const label = 
          `<div style="white-space:nowrap">`
          + `${id}<br>${name} ${surname}`
          + `</div>`;
        dataArray.push([ { v:id, f:label }, parent, '' ]);
      } else {
        // Espejo: sólo ID
        dataArray.push([ id, parent, '' ]);
      }
    }

    // 5) Dibuja OrgChart
    const data  = google.visualization.arrayToDataTable(dataArray);
    const chart = new google.visualization.OrgChart(container);
    chart.draw(data, { allowHtml:true });
    errorDiv.textContent = '';
  });
}

// 6) Carga la librería y arranca cada 30s
google.charts.load('current', { packages:['orgchart'] });
google.charts.setOnLoadCallback(() => {
  drawChart();
  setInterval(drawChart, 30*1000);
});
