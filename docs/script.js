// 1) Pon aquí tu URL pública CSV de Google Sheets (publicada en Archivo→Publicar)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRy-k0yGn0cmwcezx0ey1KYRLkOPt7mtqFXQ_kedc6WGeWYxJIqJEaC-oOYw4lL_dVpF6ooSfOXSflX/pub?gid=0&single=true&output=csv';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descarga y parsea el CSV
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // 3) Cabeceras e índices
    const headers    = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');
    if ([idxUser,idxParent,idxMirror,idxName,idxSurname].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Construimos array para Google OrgChart
    const dataArray = [
      ['UserID','ParentID','LabelHTML']
    ];
    rows.forEach(r => {
      const id       = r[idxUser];
      if (!id) return;
      const parent   = r[idxParent] || '';
      const isMirror = r[idxMirror].toLowerCase() === 'true';
      const name     = r[idxName]    || '';
      const surname  = r[idxSurname] || '';

      if (!isMirror) {
        // Nodo principal: muestra ID + nombre/apellidos
        const label = `<div style="white-space:nowrap;">${id}<br>${name} ${surname}</div>`;
        dataArray.push([ { v: id, f: label }, parent, '' ]);
      } else {
        // Espejo: solo ID, y colocamos bajo su abuelo
        dataArray.push([ id, parent, '' ]);
      }
    });

    // 5) Dibujamos OrgChart
    google.charts.load('current', { packages:['orgchart'] });
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

// Arranca y refresca cada 30 segundos
drawChart();
setInterval(drawChart, 30 * 1000);
