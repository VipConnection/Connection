// script.js

// ————————————————————————————————————————————————
// 1) URL de tu hoja PUBLICADA EN LA WEB:
//    fíjate que sea del tipo `/d/e/<ID>/gviz/tq`
//    y estamos leyendo la pestaña que tiene gid=0
// ————————————————————————————————————————————————
const GVIZ_URL = 
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-k0yGn0cmwcezx0ey1KYRLkOPt7mtqFXQ_kedc6WGeWYxJIqJEaC-oOYw4lL_dVpF6ooSfOXSflX'
  + '/gviz/tq?gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Cargo la librería/orgchart
    await new Promise(res =>
      google.charts.load('current',{packages:['orgchart'],callback:res})
    );

    // 3) Preparo la consulta SQL para obtener las 5 columnas
    const sql = `
      SELECT UserID, ParentForChart, isMirror, Nombre, Apellidos
    `.trim();

    // 4) Lanzo la Query evitando CORS
    const query = new google.visualization.Query(
      GVIZ_URL + '&tq=' + encodeURIComponent(sql)
    );
    const response = await new Promise((res, rej) =>
      query.send(r => r.isError() ? rej(r.getMessage()) : res(r))
    );

    // 5) Construyo el array que OrgChart necesita
    const dt = response.getDataTable();
    const dataArray = [['UserID','ParentID','LabelHTML']];

    for (let i = 0; i < dt.getNumberOfRows(); i++) {
      const id      = dt.getValue(i, 0);
      if (!id) continue;
      const parent  = dt.getValue(i, 1) || '';
      const mirror  = String(dt.getValue(i, 2)).toLowerCase() === 'true';
      const name    = dt.getValue(i, 3) || '';
      const surname = dt.getValue(i, 4) || '';

      if (!mirror) {
        // nodo "real": ID + nombre/apellidos
        const label = `<div style="white-space:nowrap;">
                         ${id}<br>${name} ${surname}
                       </div>`;
        dataArray.push([ {v:id, f:label}, parent, '' ]);
      } else {
        // espejo: sólo ID
        dataArray.push([ id, parent, '' ]);
      }
    }

    // 6) Pinto el organigrama
    const data  = google.visualization.arrayToDataTable(dataArray);
    const chart = new google.visualization.OrgChart(container);
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err;
  }
}

// 7) Arranco y refresco cada 30 s
drawChart();
setInterval(drawChart, 30_000);
