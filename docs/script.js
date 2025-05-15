// 1) URL de tu pestaña RespuestasDiamond (contiene ID, Parent, espejos y nombre/apellidos)
const URL_RESP =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=539807990';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descargamos y parseamos CSV
    const resp = await fetch(URL_RESP);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // 3) Cabecera e índices
    const headers     = rows.shift();
    // columnas clave
    const idxUser     = headers.indexOf('Tu propio ID');
    const idxParent   = headers.indexOf('ID de quien te invita');
    const idxName     = headers.indexOf('Nombre');
    const idxSurname  = headers.indexOf('Apellidos');
    if ([idxUser, idxParent, idxName, idxSurname].some(i => i < 0)) {
      throw new Error('Faltan columnas “Tu propio ID” / “ID de quien te invita” / Nombre / Apellidos');
    }
    // detectamos todas las columnas que empiecen por "Espejo"
    const mirrorIdxs = headers
      .map((h,i) => String(h||'').startsWith('Espejo') ? i : -1)
      .filter(i => i >= 0);

    // 4) Construimos el mapa
    const map = {};
    rows.forEach(r => {
      const id     = r[idxUser];
      const parent = r[idxParent];
      if (!id || !parent) return;
      // extraer espejos
      const mirrors = mirrorIdxs.map(i => r[i]).filter(v => v);
      map[id] = { id, parent, mirrors, level: null, chartParent: null };
    });

    // 5) Recursión para level y chartParent
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
      node.mirrors.forEach(m => {
        if (!map[m]) map[m] = { id: m, parent: id, mirrors: [], level: null, chartParent: null };
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 6) Preparamos array para OrgChart
    const dataArray = [['User','Parent','Tooltip']];
    Object.values(map).forEach(n => {
      // → nodo real con nombre y apellidos si existen
      const row = rows.find(r => r[idxUser] === n.id);
      const name    = row ? row[idxName]    : '';
      const surname = row ? row[idxSurname] : '';
      const label = name
        ? `<div style="text-align:center;white-space:nowrap">
             ${n.id}<br>
             <small>${name} ${surname}</small>
           </div>`
        : `<div style="text-align:center;white-space:nowrap">${n.id}</div>`;
      dataArray.push([ { v: n.id, f: label }, n.chartParent || '', '' ]);

      // → espejos: colgar del espejo i-ésimo del abuelo
      n.mirrors.forEach((m, i) => {
        const abuID       = n.chartParent;
        const abuMirrors  = abuID && map[abuID] ? map[abuID].mirrors : [];
        const chartParent = abuMirrors[i] || n.id;
        dataArray.push([ m, chartParent, '' ]);
      });
    });

    // 7) Pintamos con Google OrgChart
    google.charts.load('current', { packages:['orgchart'] });
    google.charts.setOnLoadCallback(() => {
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml:true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// arranca y refresca cada 30 s
drawChart();
setInterval(drawChart, 30*1000);
