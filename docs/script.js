// → Ajusta el gid al de tu pestaña "UsuariosDiamond"
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs'
  + '/export?format=csv&gid=0';

async function drawChart() {
  const $err = document.getElementById('error');
  const $div = document.getElementById('gráfico_div');
  $err.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // 1) Parseo rápido
    const all = text.trim().split(/\r?\n/).map(r =>
      r.split(',').map(c => c.replace(/^"|"$/g, '').trim())
    );

    // 2) Localizo la fila con tu cabecera auténtica
    const headRow = all.findIndex(r =>
      r.includes('UserID') && r.includes('ParentForChart')
    );
    if (headRow < 0) throw new Error('No encuentro tu fila de cabecera');
    const headers = all[headRow];
    console.log('Cabecera CSV:', headers);

    // 3) Índices de columnas clave
    const idxUser       = headers.indexOf('UserID');
    const idxParentFor  = headers.indexOf('ParentForChart');
    const idxIsMirror   = headers.indexOf('isMirror');
    const idxNombre     = headers.indexOf('Nombre');
    const idxApellidos  = headers.indexOf('Apellidos');
    if ([idxUser, idxParentFor, idxIsMirror, idxNombre, idxApellidos]
        .some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Filtro filas útiles (ID no vacío y no “UserID” literal)
    const data = all
      .slice(headRow + 1)
      .filter(r => {
        const v = r[idxUser];
        return v && v !== 'UserID' && v !== 'ParentID';
      });

    console.log(`Filas totales: ${all.length - headRow - 1}, útiles: ${data.length}`);

    // 5) Quitar duplicados (en caso de que existan)
    const seen = new Set();
    const uniq = [];
    data.forEach(r => {
      const key = `${r[idxUser]}|${r[idxParentFor]}|${r[idxIsMirror]}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(r);
      }
    });

    // 6) Construyo la matriz para OrgChart (HTML en la primera columna)
    const dataArray = [
      ['Label','Parent','Tooltip']
    ].concat(uniq.map(r => {
      const rawID    = r[idxUser];
      const parent   = r[idxParentFor] || '';
      const isM      = r[idxIsMirror].toLowerCase() === 'true';
      const nombre   = r[idxNombre]   || '';
      const apel     = r[idxApellidos]|| '';
      // dos líneas: ID arriba, “Nombre Apellidos” abajo
      const label = `<div style="white-space:nowrap;">`
                  + `${rawID}<br>${nombre} ${apel}`
                  + `</div>`;
      const tip = isM ? `${rawID} (m)` : `${nombre} ${apel}`;
      return [label, parent, tip];
    }));

    // 7) Dibujo el gráfico
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const gdata  = google.visualization.arrayToDataTable(dataArray);
      const chart  = new google.visualization.OrgChart($div);
      chart.draw(gdata, { allowHtml: true });
      $err.textContent = '';
    });

  } catch(err) {
    console.error(err);
    $err.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Lanza la función al cargar la página
drawChart();

