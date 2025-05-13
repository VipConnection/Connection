// script.js
google.charts.load('current',{packages:['corechart','orgchart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  const sheetId  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetName = 'UsuariosDiamond';       // nombre de tu pestaña final
  const queryStr = encodeURIComponent(`SELECT A,B,C,D,E`);
  const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tq=${queryStr}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');

  // lanzamos una query
  const query = new google.visualization.Query(queryUrl);
  query.send(response => {
    if (response.isError()) {
      errorDiv.textContent = 'Error cargando datos: ' + response.getMessage();
      return;
    }
    // 1) Tenemos ya una DataTable limpia
    const dt = response.getDataTable();

    // 2) Montamos nuestro mapa de nodos
    const nodes = {};
    // Recorremos todas las filas
    for (let r = 0; r < dt.getNumberOfRows(); r++) {
      const id         = dt.getValue(r, 0) + '';
      const parent     = dt.getValue(r, 4) + '';
      const isMirror   = !!dt.getValue(r, 2);
      nodes[id] = {
        id,
        parent,
        isMirror,
        chartParent: isMirror ? null : parent,
        mirrors: [],
        children: []
      };
    }
    // 3) Rellenamos mirrors y children
    Object.values(nodes).forEach(node => {
      if (node.isMirror) {
        const p = nodes[node.parent];
        if (p) p.mirrors.push(node.id);
      } else {
        const p = nodes[node.parent];
        if (p) p.children.push(node.id);
      }
    });

    // 4) Preparamos la DataTable para el OrgChart
    const data = new google.visualization.DataTable();
    data.addColumn('string','Name');
    data.addColumn('string','Parent');
    data.addColumn('boolean','IsMirror');

    // 5) Función recursiva
    function recurse(id) {
      const node = nodes[id];
      // Nodo “original”
      data.addRow([node.id, node.chartParent, false]);

      // Espejos bajo espejo correspondiente de su abuelo
      node.mirrors.forEach((mid, i) => {
        const padre         = nodes[node.parent];
        const abueloEspejo  = padre && padre.mirrors[i];
        const parentMirror  = abueloEspejo || node.parent;
        data.addRow([mid, parentMirror, true]);
      });

      // Hijos “normales”
      node.children.forEach(childId => recurse(childId));
    }

    // 6) Arrancamos desde la raíz
    recurse('7');

    // 7) Dibujamos
    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(data, {allowHtml:true});
    errorDiv.textContent = '';
  });
}
