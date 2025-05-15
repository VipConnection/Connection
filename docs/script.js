// 1) URL de tu hoja publicada en “Archivo → Publicar en web”
//    adaptada al formato de Query API de Google Charts:
const QUERY_URL = 
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-k0yGn0cmwcezx0ey1KYRLkOPt7mtqFXQ_kedc6WGeWYxJIqJEaC-oOYw4lL_dVpF6ooSfOXSflX/pub' +
  '?gid=0&single=true&headers=1&output=gviz&tq=' + encodeURIComponent(
    // seleccionamos sólo las columnas que necesitamos
    'SELECT B, E, C, M, N'
  );

function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  // 2) Consulta por Query API
  const query = new google.visualization.Query(QUERY_URL);
  query.send(response => {
    if (response.isError()) {
      errorDiv.textContent = 
        'Error Sheet: ' + response.getMessage();
      return;
    }
    const dt = response.getDataTable();
    // columnas temprales:
    // 0 → UserID
    // 1 → ParentForChart
    // 2 → isMirror (TRUE/FALSE)
    // 3 → Nombre
    // 4 → Apellidos

    // 3) Montamos un nuevo array para OrgChart
    const dataArray = [
      ['UserID','ParentID','LabelHTML']
    ];
    for (let i = 0; i < dt.getNumberOfRows(); i++) {
      const id       = dt.getValue(i, 0);
      if (!id) continue;
      const parent   = dt.getValue(i, 1) || '';
      const isMir    = String(dt.getValue(i, 2)).toLowerCase() === 'true';
      const name     = dt.getValue(i, 3) || '';
      const surname  = dt.getValue(i, 4) || '';

      if (!isMir) {
        // nodo “real”: ID + nombre/apellidos
        const label = `<div style="white-space:nowrap;">`
                    + `${id}<br>${name} ${surname}`
                    + `</div>`;
        dataArray.push([ { v: id, f: label }, parent, '' ]);
      } else {
        // espejo: sólo ID
        dataArray.push([ id, parent, '' ]);
      }
    }

    // 4) Dibujamos OrgChart
    const data = google.visualization.arrayToDataTable(dataArray);
    const chart = new google.visualization.OrgChart(container);
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';
  });
}

// 5) Cargamos la librería y arrancamos
google.charts.load('current', { packages:['orgchart'] });
google.charts.setOnLoadCallback(() => {
  drawChart();
  // refresca cada 30 s
  setInterval(drawChart, 30*1000);
});
