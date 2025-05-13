// script.js

async function drawChart() {
  const chartDiv = document.getElementById('chart');
  const msgDiv   = document.getElementById('error');
  try {
    // 1) Carga el CSV desde Google Sheets (RespuestasDiamond)
    const sheetID = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
    const csvUrl  = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:csv`;
    console.log('Fetching:', csvUrl);
    const resp    = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();

    // 2) Parse CSV a DataTable de Google Charts
    const data = google.visualization.arrayToDataTable(
      Papa.parse(csvText, { header: true }).data
        .filter(r => r['Tu propio ID'] && r['ID de quien te invita'])
        .flatMap(r => {
          // Para cada fila original sacamos su nodo…
          const id      = r['Tu propio ID'];
          const parent  = r['ID de quien te invita'];
          const mirrors = Object.keys(r)
            .filter(h => h.startsWith('Espejo') && r[h])
            .map(h => r[h]);

          // Y lo transformamos en varias filas: 
          //   • el nodo “real”
          //   • cada espejo convertido en nodo “mirror”
          const out = [[
            id, parent, false, 0, parent  // level y chartParent se recalculan luego
          ]];
          mirrors.forEach((m, i) => {
            // POR AHORA colgamos del padre directo; luego ajustamos posición:
            out.push([ m, id, true,  0, id ]);
          });
          return out;
        })
    );

    console.log('DataTable cols:', data.getNumberOfColumns(),
                'rows:', data.getNumberOfRows());

    // 3) Construir el map de nodos para calcular niveles y chartParent correcto
    const map = {};
    // Paso 1: leemos todas las filas
    for (let i = 0; i < data.getNumberOfRows(); i++) {
      const id         = data.getValue(i, 0);
      const parent     = data.getValue(i, 1);
      const isMirror   = data.getValue(i, 2);
      map[id] = map[id] || { id, parent, mirrors: [], isMirror, level: null, chartParent: null };
      if (isMirror) {
        // se añade a la lista de mirrors de su “real” padre
        map[parent].mirrors.push(id);
      }
    }
    // Paso 2: Función recursiva para asignar level/chartParent
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
      // aquí ajustamos la **posición** de cada mirror:
      node.mirrors.forEach((m, i) => {
        const grand = map[p && p.id];
        let attach = node.id;        // por defecto cuelga del propio padre
        if (grand &&
            Array.isArray(grand.mirrors) &&
            typeof grand.mirrors[i] !== 'undefined') {
          // si el abuelo tiene espejo en la misma posición `i`, colgamos ahí
          attach = grand.mirrors[i];
        }
        map[m].parent = attach;
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 4) Reemplazamos la DataTable con { id, parent, isMirror, level, chartParent }
    const outTable = new google.visualization.DataTable();
    ['string','string','boolean','number','string']
      .forEach((t,i) => outTable.addColumn(t,
        ['UserID','ParentID','isMirror','Level','ParentForChart'][i]
      ));
    Object.values(map).forEach(n => {
      outTable.addRow([
        n.id, n.parent, n.isMirror, n.level, n.chartParent
      ]);
    });

    // 5) Dibujamos el orgChart
    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(outTable, { allowHtml: true, size: 'medium' });
    msgDiv.textContent = '';
  }
  catch (e) {
    msgDiv.textContent = 'Error cargando datos: ' + e.message;
    console.error(e);
  }
}

// Inicializa Google Charts
google.charts.load('current', { packages:['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

