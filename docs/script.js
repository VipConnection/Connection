// script.js

// 1) URL de tu pestaña UsuariosDiamond (gid=0)
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Fetch + parse CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status);
    }
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(function(line) {
        return line
          .split(',')
          .map(function(cell) {
            return cell.replace(/^"|"$/g, '').trim();
          });
      });

    // 3) Encabezados e índices
    const headers      = rows.shift();
    const idxUser      = headers.indexOf('UserID');
    const idxParentFor = headers.indexOf('ParentForChart');
    const idxMirror    = headers.indexOf('isMirror');
    const idxName      = headers.indexOf('Nombre');
    const idxSurname   = headers.indexOf('Apellidos');
    if ([idxUser, idxParentFor, idxMirror, idxName, idxSurname].some(function(i){ return i < 0; })) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Montamos el array que pide OrgChart
    const dataArray = [['id','parent','tooltip']];
    rows.forEach(function(r) {
      const id       = r[idxUser];
      if (!id) return;
      // ← ÚNICO cambio: usamos ParentForChart
      const parent   = r[idxParentFor] || '';
      const isMirror = (r[idxMirror] || '').toLowerCase() === 'true';
      const name     = r[idxName]    || '';
      const surname  = r[idxSurname] || '';

      if (!isMirror) {
        // nodo “real”
        const label =
          '<div style="text-align:center;white-space:nowrap">' +
            id + '<br>' +
            '<small>' + name + ' ' + surname + '</small>' +
          '</div>';
        dataArray.push([ { v: id, f: label }, parent, '' ]);
      } else {
        // espejo
        dataArray.push([ id, parent, '' ]);
      }
    });

    // 5) Dibujamos con Google OrgChart
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(function() {
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

// Arranca y refresca cada 30s
drawChart();
setInterval(drawChart, 30 * 1000);

