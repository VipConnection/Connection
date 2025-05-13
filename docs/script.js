// script.js

// ID de tu spreadsheet y nombre de la hoja RespuestasDiamond
const SPREADSHEET_ID   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const SHEET_NAME       = 'RespuestasDiamond';
const CSV_ENDPOINT     = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

async function drawChart() {
  const errDiv = document.getElementById('error');
  const div     = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';
  try {
    console.log('fetching:', CSV_ENDPOINT);
    const res = await fetch(CSV_ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = text.trim().split('\n').map(r => r.split(','));
    const headers = rows.shift().map(h => h.trim());
    console.log('Cabecera CSV:', headers);

    // 1) Encuentra índices
    const idxId     = headers.indexOf('Tu propio ID');
    const idxDad    = headers.indexOf('ID de quien te invita');
    const mirrorIdx = headers.map((h,i) =>
      h.startsWith('Espejo') ? i : -1
    ).filter(i => i >= 0);
    if (idxId<0 || idxDad<0 || mirrorIdx.length===0) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 2) Filtra y construye mapa { id→node }
    const originals = [];
    const map = {};
    rows.forEach(r => {
      const id   = r[idxId].trim();
      const dad  = r[idxDad].trim();
      if (!id || !dad) return;
      originals.push(id);
      const mirrors = mirrorIdx.map(i => r[i].trim()).filter(v => v);
      map[id] = { id, parent: dad, mirrors, level: null, chartParent: null };
    });

    // 3) Recursión para level/chartParent
    function setNode(id) {
      const node = map[id];
      if (!node || node.level !== null) return;
      const p = map[node.parent];
      if (!p) {
        node.level = 0;
        node.chartParent = '';
      } else {
        setNode(p.id);
        node.level = p.level + 1;
        node.chartParent = p.id;
      }
      // añade espejos al mapa
      node.mirrors.forEach(m => {
        map[m] = map[m] || { id: m, parent: node.id, mirrors: [], level: null, chartParent: null };
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 4) Monta DataTable rows:
    //   - Primero nodos originales (isMirror=false)
    //   - Luego espejos (isMirror=true), y su ParentForChart = espejo correspondiente de chartParent padre
    const data = [];
    data.push(['UserID','ParentID','isMirror','Level','ParentForChart']);
    originals.forEach(id => {
      const n = map[id];
      data.push([n.id, n.parent, false, n.level, n.chartParent]);
    });
    originals.forEach(id => {
      const parentNode = map[id];
      parentNode.mirrors.forEach((m, i) => {
        const mirrorNode = map[m];
        // encuentra el espejo "abuelo" en la lista de mirrors del abuelo:
        const grandpa = map[parentNode.parent];
        let gpMirror = parentNode.parent; // fallback: directamente el padre
        if (grandpa && grandpa.mirrors[i]) {
          gpMirror = grandpa.mirrors[i];
        }
        data.push([m, parentNode.id, true, mirrorNode.level, gpMirror]);
      });
    });

    // Dibuja el chart
    google.charts.load('current', {packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const dataTable = google.visualization.arrayToDataTable(data);
      const chart = new google.visualization.OrgChart(div);
      chart.draw(dataTable, {allowHtml:true, nodeClass:'node'});
      errDiv.textContent = '';
    });

  } catch (e) {
    errDiv.textContent = `Error cargando datos: ${e.message}`;
    console.error(e);
  }
}

window.addEventListener('DOMContentLoaded', drawChart);
