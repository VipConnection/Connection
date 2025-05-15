// 1) Pon aquí tu ID de hoja y gid=0 (UsuariosDiamond) en modo "cualquiera con enlace"
const CSV_URL = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching CSV:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // Parseo CSV
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g,'').trim()));

    const headers = rows.shift();
    console.log('Cabecera CSV:', headers);

    // Índices de columna
    const idxUser        = headers.indexOf('UserID');
    const idxParentFor   = headers.indexOf('ParentForChart');
    const idxIsMirror    = headers.indexOf('isMirror');
    const idxNombre      = headers.indexOf('Nombre');
    const idxApellidos   = headers.indexOf('Apellidos');

    if ([idxUser, idxParentFor, idxIsMirror, idxNombre, idxApellidos]
        .some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // Filtramos filas válidas
    const dataRows = rows.filter(r => r[idxUser]);

    // <-- Aquí va tu lógica de espejos bajo espejos de abuelo -->
    // 1) Construimos mapa id → nodo
    const map = {};
    dataRows.forEach(r => {
      const id      = r[idxUser];
      const parent  = r[idxParentFor];
      // extraemos espejos: columnas que empiecen por "Espejo"
      const mirrors = headers
        .map((h,i) =>
          h.startsWith('Espejo') ? r[i] : null
        )
        .filter(v => v);
      map[id] = { id, parent, mirrors, level: null, chartParent: null };
    });

    // 2) Recursión para fijar nivel y chartParent
    function setNode(id) {
      const node = map[id];
      if (node.level !== null) return;
      const p = map[node.parent];
      if (!p) {
        node.level       = 0;
        node.chartParent = '';
      } else {
        setNode(p.id);
        node.level       = p.level + 1;
        node.chartParent = p.id;
      }
      // luego sus espejos
      node.mirrors.forEach((m, i) => {
        map[m] = {
          id: m,
          parent: id,
          mirrors: [],
          level: null,
          chartParent: null
        };
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 3) Preparamos output para OrgChart
    const output = [
      ['UserID','ParentID','isMirror','Level','ParentForChart']
    ];
    Object.values(map).forEach(n => {
      // nodo real
      output.push([
        n.id, n.parent, false, n.level, n.chartParent
      ]);
      // sus espejos
      n.mirrors.forEach((m, i) => {
        const mn = map[m];
        // abuelo = chartParent de n
        const abuID = n.chartParent;
        const abuMirrors = abuID && map[abuID]
          ? map[abuID].mirrors
          : [];
        // espejo i-ésimo del abuelo o fallback
        const cp = abuMirrors[i] || n.id;
        output.push([ m, n.id, true, mn.level, cp ]);
      });
    });

    // 4) Ahora convertimos a arrayToDataTable
    // Construcción del array final con HTML (nombre y apellidos debajo)
    const dataArray = [['UserID','ParentID','Tooltip']];
    output.slice(1).forEach(r => {
      const [ id, parent, isMirror ] = r;
      if (!isMirror) {
        // buscamos nombre y apellidos en dataRows
        const row = dataRows.find(rr => rr[idxUser] === id) || [];
        const name    = row[idxNombre]    || '';
        const surname = row[idxApellidos] || '';
        const label = `<div style="white-space:nowrap;">
                         ${id}<br>${name} ${surname}
                       </div>`;
        dataArray.push([ {v:id,f:label}, parent, '' ]);
      } else {
        dataArray.push([ id, parent, '' ]);
      }
    });

    // 5) Dibujamos con Google Charts OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos y refrescamos cada 30s
drawChart();
setInterval(drawChart, 30_000);
