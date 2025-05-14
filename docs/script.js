// → URL CSV de UsuariosDiamond (gid = 0)
const CSV_URL_USERS = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

// → URL CSV de RespuestasDiamond (ajusta aquí el gid real)
const CSV_URL_RESP = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=539807990';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // ————————————— 1) CARGO UsuariosDiamond —————————————
    const respU = await fetch(CSV_URL_USERS);
    if (!respU.ok) throw new Error(`HTTP ${respU.status} leyendo UsuariosDiamond`);
    const textU = await respU.text();
    const rowsU = textU
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const hdrU = rowsU.shift();
    const iUser       = hdrU.indexOf('UserID');
    const iParentForC = hdrU.indexOf('ParentForChart');
    const iMirror     = hdrU.indexOf('isMirror');
    if ([iUser, iParentForC, iMirror].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en UsuariosDiamond');
    }
    const dataU = rowsU.filter(r => r[iUser] !== '');

    // ————————————— 2) CARGO RespuestasDiamond PARA NOMBRES —————————————
    const respR = await fetch(CSV_URL_RESP);
    if (!respR.ok) throw new Error(`HTTP ${respR.status} leyendo RespuestasDiamond`);
    const textR = await respR.text();
    const rowsR = textR
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    const hdrR = rowsR.shift();
    const iRuser = hdrR.indexOf('Tu propio ID');
    const iRnom  = hdrR.indexOf('Nombre');
    const iRape  = hdrR.indexOf('Apellidos');
    if ([iRuser, iRnom, iRape].some(i => i < 0)) {
      throw new Error('Faltan columnas “Tu propio ID”, “Nombre” o “Apellidos” en RespuestasDiamond');
    }

    // — construyo un mapa { id → "Nombre Apellidos" }
    const nameMap = {};
    rowsR.forEach(r => {
      const id = r[iRuser];
      if (id) {
        nameMap[id] = `${r[iRnom] || ''} ${r[iRape] || ''}`.trim();
      }
    });

    // ————————————— 3) PREPARO ARRAY PARA OrgChart —————————————
    const dataArray = [
      ['Name', 'Parent', 'ToolTip']
    ].concat(
      dataU.map(r => {
        const idKey    = r[iUser];
        const parent   = r[iParentForC] || '';
        const nombre   = nameMap[idKey] || '';    // si no hay nombre, cadena vacía

        // ETIQUETA HTML: ID en negrita + salto + Nombre Apellidos
        const labelHtml = `
          <div style="white-space:nowrap;text-align:center;">
            <strong>${idKey}</strong><br>${nombre}
          </div>
        `;
        // OrgChart: [col0=label, col1=parent, col2=tooltip]
        return [ labelHtml, parent, nombre ];
      })
    );

    // ————————————— 4) DIBUJO —————————————
    google.charts.load('current', { packages: ['orgchart'] });
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

// arrancamos
drawChart();
