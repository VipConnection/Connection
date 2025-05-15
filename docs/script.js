// 1) Sustituye por la URL que te da "Publicar en la web"
//    Cambia "pubhtml" por "pub", y añade "&output=gviz"
const BASE = 
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-k0yGn0cmwcezx0ey1KYRLkOPt7mtqFXQ_kedc6WGeWYxJIqJEaC-oOYw4lL_dVpF6ooSfOXSflX'
  + '/pub?gid=0&single=true&output=gviz';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Carga la librería de Google Charts
    await new Promise(res => google.charts.load('current',{packages:['orgchart'],callback:res}));

    // 3) Construye y envía la consulta
    const query = new google.visualization.Query(BASE + '&tq=' + encodeURIComponent(`
      SELECT UserID, ParentForChart, isMirror, Nombre, Apellidos
    `));
    const response = await new Promise((res, rej) =>
      query.send(r => r.isError() ? rej(r.getMessage()) : res(r))
    );

    // 4) Extrae datos
    const dt = response.getDataTable();
    const dataArray = [['UserID','ParentID','LabelHTML']];

    for (let i = 0; i < dt.getNumberOfRows(); i++) {
      const id       = dt.getValue(i, 0);
      if (!id) continue;
      const parent   = dt.getValue(i, 1) || '';
      const isMir    = String(dt.getValue(i, 2)).toLowerCase() === 'true';
      const name     = dt.getValue(i, 3) || '';
      const surname  = dt.getValue(i, 4) || '';

      if (!isMir) {
        // Nodo "real": ID + nombre y apellidos
        const label = `<div style="white-space:nowrap">
          ${id}<br>${name} ${surname}
        </div>`;
        dataArray.push([ {v:id, f:label}, parent, '' ]);
      } else {
        // Espejo: solo ID
        dataArray.push([ id, parent, '' ]);
      }
    }

    // 5) Dibuja el organigrama
    const data  = google.visualization.arrayToDataTable(dataArray);
    const chart = new google.visualization.OrgChart(container);
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err;
  }
}

// 6) Arranca y refresca cada 30 segundos
drawChart();
setInterval(drawChart, 30_000);
