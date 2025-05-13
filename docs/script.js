// script.js
google.charts.load('current',{packages:['corechart','orgchart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  // 1) Tu ID de spreadsheet
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  // 2) El nombre EXACTO de la pestaña que has publicado
  const sheetName = 'UsuariosDiamond';
  // Seleccionamos A–E y saltamos la fila de cabecera
  const queryStr  = encodeURIComponent('SELECT A,B,C,D,E OFFSET 1');
  const queryUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tq=${queryStr}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');

  const query = new google.visualization.Query(queryUrl);
  query.send(response => {
    if (response.isError()) {
      errorDiv.textContent = 'Error cargando datos: ' + response.getMessage();
      return;
    }

    const dt = response.getDataTable();

    // 3) Construimos el mapa de nodos
    const nodes = {};
    for (let r = 0; r < dt.getNumberOfRows(); r++) {
      const id       = dt.getValue(r, 0) + '';
      const parent   = dt.getValue(r, 4) + '';
      const isMirror = Boolean(dt.getValue(r, 2));

      nodes[id] = {
        id,
        parent,
        isMirror,
        mirrors: [],
        children: []
      };
    }

    // 4) Rellenamos mirrors y children
    Object.values(nodes).forEach(node => {
      if (node.isMirror) {
        const p = nodes[node.parent];
        if (p) p.mirrors.push(node.id);
      } else {
        const p = nodes[node.parent];
        if (p) p.children.push(node.id);
      }
    });

    // 5) Preparamos la DataTable para el OrgChart
    const data = new google.visualization.DataTable();
    data.addColumn('string','Name');
    data.addColumn('string','Parent');
    data.addColumn('boolean','IsMirror');

    // 6) Función recursiva que pone:
    //    • Cada nodo “original” (isMirror=false)
    //    • Luego sus espejos debajo del espejo correspondiente de su abuelo
    function recurse(id) {
      const node = nodes[id];
      // 6.1 Nodo normal
      data.addRow([ node.id, node.parent, false ]);

      // 6.2 Espejos: los ponemos bajo el espejo i-ésimo del abuelo
      node.mirrors.forEach((mid, i) => {
        const abuelo = nodes[node.parent];
        // el i-ésimo espejo del abuelo
        const abueloEspejo = (abuelo && abuelo.mirrors[i]) || node.parent;
        data.addRow([ mid, abueloEspejo, true ]);
      });

      // 6.3 Hijos “reales”
      node.children.forEach(childId => recurse(childId));
    }

    // 7) Arrancamos desde la raíz (aquí tu usuario “7”)
    recurse('7');

    // 8) Dibujamos el org chart
    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(data, { allowHtml:true });
    errorDiv.textContent = '';
  });
}
