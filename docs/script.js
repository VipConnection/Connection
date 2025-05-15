// script.js

// ID de tu hoja y nombre de pestaña
var SHEET_ID    = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
var SHEET_NAME  = 'UsuariosDiamond';

function drawChart() {
  var errorDiv  = document.getElementById('error');
  var container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // Query para leer UserID, ParentForChart, isMirror, Nombre y Apellidos
    var tq = encodeURIComponent(
      'select A,B,C,D,E where A <> ""'
    );
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
              '/gviz/tq?sheet=' + SHEET_NAME +
              '&headers=1&tq=' + tq;

    google.charts.load('current', { packages:['orgchart'] });
    google.charts.setOnLoadCallback(function() {
      var query = new google.visualization.Query(url);
      query.send(function(resp) {
        if (resp.isError()) {
          errorDiv.textContent = 'Error Sheet: ' + resp.getMessage();
          return;
        }
        var dt = resp.getDataTable();
        // Reconstruimos espejo-abuelo: 
        // dt tiene columnas A:UserID B:ParentForChart C:isMirror D:Nombre E:Apellidos
        var out = new google.visualization.DataTable();
        out.addColumn('string','UserID');
        out.addColumn('string','ParentID');
        out.addColumn('string','Tooltip');

        // Mapa id→mirrors y niveles
        var map = {};
        for (var i=0; i<dt.getNumberOfRows(); i++) {
          var id        = dt.getValue(i,0);
          var parent    = dt.getValue(i,1);
          var mirror    = String(dt.getValue(i,2)).toLowerCase() === 'true';
          var nombre    = dt.getValue(i,3)||'';
          var apel      = dt.getValue(i,4)||'';
          if (!map[id]) map[id] = { parent:parent, mirrors:[], name:nombre, last:apel };
          if (mirror) map[parent].mirrors.push(id);
        }
        // Ordenamos las claves para dibujar en orden
        var keys = Object.keys(map);
        // Primero nodos reales
        for (var k=0; k<keys.length; k++) {
          var n = map[keys[k]];
          // Si no es espejo (su ParentForChart no es otro espejo)
          var isMir = n.parent && map[n.parent] && map[n.parent].mirrors.indexOf(keys[k])>=0;
          if (!isMir) {
            var label = '<div style="white-space:nowrap;">'
                      + keys[k] + '<br>'
                      + n.name + ' ' + n.last
                      + '</div>';
            out.addRow([ {v:keys[k],f:label}, n.parent||'', '' ]);
          }
          // luego sus espejos
          for (var j=0; j<n.mirrors.length; j++) {
            var mid = n.mirrors[j];
            // debajo del espejo j-ésimo de su abuelo:
            var abu = map[n.parent] && map[n.parent].mirrors ? map[n.parent].mirrors[j] : n.parent;
            out.addRow([ mid, keys[k], '' ]);
          }
        }

        var chart = new google.visualization.OrgChart(container);
        chart.draw(out, { allowHtml:true });
        errorDiv.textContent = '';
      });
    });

  } catch(e) {
    errorDiv.textContent = 'Error general: ' + e.message;
    console.error(e);
  }
}

drawChart();
setInterval(drawChart, 30000);

