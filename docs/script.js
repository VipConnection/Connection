// script.js
google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetGid = '0';  // ← GID de la hoja UsuariosDiamond
  const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
  const errorDiv = document.getElementById('error');
  try {
    // 1) Traemos el CSV y lo parseamos en filas
    const res  = await fetch(csvUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const rows = text.trim().split('\n').map(r => r.split(','));

    // 2) Montamos un mapa de nodos { id → { id, parent, isMirror, chartParent, mirrors[], children[] } }
    const nodes = {};
    // cabecera: [UserID, ParentID, isMirror, Level, ParentForChart]
    rows.slice(1).forEach(fields => {
      const id       = fields[0];
      const parent   = fields[4];
      const isMirror = (fields[2].toUpperCase() === 'TRUE');
      nodes[id] = nodes[id] || { id, parent, isMirror, chartParent: null, mirrors: [], children: [] };
      // para los normales: chartParent = ParentForChart (ya lo calculaste en Apps Script)
      if (!isMirror) {
        nodes[id].chartParent = parent;
      }
    });
    // 3) Rellenamos arrays de mirrors (espejos) y children
    Object.values(nodes).forEach(node => {
      if (node.isMirror) {
        const p = nodes[node.parent];
        if (p) p.mirrors.push(node.id);
      } else {
        const p = nodes[node.parent];
        if (p) p.children.push(node.id);
      }
    });

    // 4) Creamos la DataTable de Google Charts
    const data = new google.visualization.DataTable();
    data.addColumn('string','Name');
    data.addColumn('string','Parent');
    data.addColumn('boolean','IsMirror');

    // 5) Recorremos recursivamente desde la raíz ('7') inyectando:
    //    - cada nodo normal bajo su chartParent
    //    - cada espejo bajo el espejo correspondiente del padre
    function recurse(id) {
      const node = nodes[id];
      // fila del nodo “original” (no espejo)
      data.addRow([ node.id, node.chartParent, false ]);

      // filas de sus espejos: uno a uno, ubicándolos bajo
      // el espejo “coincidente” de su abuelo
      node.mirrors.forEach((mid, i) => {
        const padre       = nodes[node.parent];
        const abueloEspejo = padre && padre.mirrors[i];
        // si abueloEspejo existe, lo usamos; si no, caemos en node.parent
        const parentForMirror = abueloEspejo || node.parent;
        data.addRow([ mid, parentForMirror, true ]);
      });

      // y ahora los hijos “normales”
      node.children.forEach(childId => recurse(childId));
    }

    // arrancamos desde tu ID raíz (7)
    recurse('7');

    // 6) Dibujamos el OrgChart
    const chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';  // limpia posible error previo

  } catch (err) {
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}
