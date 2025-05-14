// → Asegúrate de que éste sea el gid de tu hoja UsuariosDiamond:
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // parse muy simple de CSV (sin comillas multilínea)
    const rows = csvText
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // detectamos índices
    const idxUser        = headers.indexOf('UserID');
    const idxParentChart = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    const idxLevel       = headers.indexOf('Level');
    const idxName        = headers.indexOf('Nombre');
    const idxSurname     = headers.indexOf('Apellidos');

    if ([idxUser, idxParentChart, idxIsMirror, idxLevel, idxName, idxSurname]
        .some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // descartamos filas en blanco
    const dataRows = rows
      .slice(1)
      .filter(r => r[idxUser] !== '');

    console.log(
      `Filas totales: ${rows.length -1}, filas útiles: ${dataRows.length}`
    );

    // Preparamos el array para OrgChart: etiqueta HTML + padre
    const dataArray = [
      // la primera columna es el texto que se muestra en el nodo,
      // la segunda es el _parent_, la tercera es su tooltip (igual al label)
      ['Name','Parent','Tooltip']
    ].concat(
      dataRows.map(r => {
        const id       = r[idxUser];
        const parent   = r[idxParentChart] || '';
        const name     = r[idxName] || '';
        const surname  = r[idxSurname] || '';
        const isMirror = String(r[idxIsMirror]).toLowerCase() === 'true';
        const level    = r[idxLevel];

        // etiqueta HTML con ID en negrita + nombre apellidos
        const label = `
          <div style="text-align:center; white-space:nowrap">
            <strong>${id}</strong><br>
            ${name} ${surname}
          </div>`.trim();

        return [ label, parent, label ];
      })
    );

    // pintamos con Google Charts
    google.charts.load('current', { packages:['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';  // todo ok
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// arranca
drawChart();
