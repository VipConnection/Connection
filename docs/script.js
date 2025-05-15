// script.js

// 1) Ajusta aquí tu gid si fuera otro
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descargar y parsear CSV
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // 3) Índices de columnas
    const headers    = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ID de quien te invita') >= 0
                     ? headers.indexOf('ID de quien te invita')
                     : headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');
    if ([idxUser, idxParent, idxMirror, idxName, idxSurname].some(i => i < 0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Construir mapa de nodos
    const map = {};
    // leemos cada fila real
    rows.forEach(r => {
      const id      = r[idxUser];
      const parent  = r[idxParent];
      // extraemos espejos EN ORDEN
      const mirrors = headers
        .map((h,i) =>
          h.startsWith('Espejo') && r[i] ? r[i] : null
        )
        .filter(v => v);
      if (id) {
        map[id] = { id, parent, mirrors, level: null, chartParent: null, name: r[idxName], surname: r[idxSurname] };
      }
    });

    // recursión para asignar nivel y chartParent
    function setNode(id) {
      const node = map[id];
      if (!node || node.level !== null) return;
      const p = map[node.parent];
      if (!p) {
        node.level       = 0;
        node.chartParent = '';
      } else {
        setNode(node.parent);
        node.level       = p.level + 1;
        node.chartParent = node.parent;
      }
      // luego procesamos sus espejos
      node.mirrors.forEach((m, i) => {
        // creamos entrada temporal si no existe
        if (!map[m]) {
          map[m] = { id: m, parent: id, mirrors: [], level: null, chartParent: null, name: '', surname: '' };
        }
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 5) Preparar array para OrgChart (HTML labels)
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ];
    Object.values(map).forEach(n => {
      // nodo real
      const label = `<div style="white-space:nowrap;">${n.id}<br>${n.name || ''} ${n.surname || ''}</div>`;
      dataArray.push([ { v: n.id, f: label }, n.chartParent, '' ]);

      // cada espejo, con lógica de “espejo bajo espejo de abuelo”
      n.mirrors.forEach((m, i) => {
        const abuID = n.chartParent;
        let abuMirrors = [];
        if (abuID && map[abuID]) abuMirrors = map[abuID].mirrors;
        const chartParForMirror = abuMirrors[i] || n.id;
        dataArray.push([ m, chartParForMirror, '' ]);
      });
    });

    // 6) Dibujar con Google OrgChart
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

// 7) Al cargar + refresco cada 30 s
drawChart();
setInterval(drawChart, 30 * 1000);
