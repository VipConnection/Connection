// script.js

// 1) Pon aquí tu ID de spreadsheet y el nombre exacto de la pestaña “UsuariosDiamond”
var SHEET_ID   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
var SHEET_NAME = 'UsuariosDiamond';

function drawChart() {
  var errorDiv  = document.getElementById('error');
  var container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  // Carga Google Charts
  google.charts.load('current', { packages: ['orgchart'] });
  google.charts.setOnLoadCallback(function() {
    // Consulta (sin CORS) usando la API de Visualization
    var tq = encodeURIComponent('select A,B,C,D,E where A<>""');
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
              '/gviz/tq?sheet=' + SHEET_NAME + '&headers=1&tq=' + tq;

    var query = new google.visualization.Query(url);
    query.send(function(resp) {
      if (resp.isError()) {
        errorDiv.textContent = 'Error hoja: ' + resp.getMessage();
        return;
      }

      var dt = resp.getDataTable();
      // Columnas: 0=UserID,1=ParentForChart,2=isMirror,3=Nombre,4=Apellidos
      var map = {};
      var rows = dt.getNumberOfRows();
      for (var i = 0; i < rows; i++) {
        var id       = dt.getValue(i, 0);
        var parent   = dt.getValue(i, 1) || '';
        var mirror   = String(dt.getValue(i, 2)).toLowerCase() === 'true';
        var name     = dt.getValue(i, 3) || '';
        var surname  = dt.getValue(i, 4) || '';

        // Creamos nodo si no existe
        if (!map[id]) map[id] = { parent: parent, mirrors: [], name: name, surname: surname };
        // Si es espejo, lo acumulamos bajo su padre
        if (mirror) map[parent] && map[parent].mirrors.push(id);
      }

      // Construimos la DataTable de OrgChart
      var data = new google.visualization.DataTable();
      data.addColumn('string', 'UserID');
      data.addColumn('string', 'ParentID');
      data.addColumn('string', 'Tooltip');

      // Primero nodos “reales” (no-espejos), con label HTML de ID + nombre
      Object.keys(map).forEach(function(id) {
        var n = map[id];
        // ¿Es espejo de alguien?
        var isMirror = map[n.parent] && map[n.parent].mirrors.indexOf(id) !== -1;
        if (!isMirror) {
          var label = '<div style="white-space:nowrap;">'
                    + id + '<br>' + n.name + ' ' + n.surname
                    + '</div>';
          data.addRow([ { v: id, f: label }, n.parent, '' ]);
        }
        // Luego sus espejos “colgados” bajo el espejo correspondiente de su abuelo
        n.mirrors.forEach(function(mid, idx) {
          var abu = map[n.parent] && map[n.parent].mirrors
                  ? map[n.parent].mirrors[idx] || n.parent
                  : n.parent;
          data.addRow([ mid, id, '' ]);  // en OrgChart, el tercer campo puede quedar vacío
        });
      });

      // Dibujamos
      var chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });
  });
}

// Arrancamos + refresco cada 30 s
drawChart();
setInterval(drawChart, 30 * 1000);
