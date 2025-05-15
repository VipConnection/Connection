// → Ajusta a tu documento y pestaña
var SHEET_ID    = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
var QUERY_SHEET = 'UsuariosDiamond';

function drawChart() {
  var errorDiv  = document.getElementById('error');
  var container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // Montamos la Query: columns A–E, filas con A no nulo, ordenadas por nivel y padre
    var tq = encodeURIComponent(
      'select A,B,C,D,E where A is not null order by D asc, E asc'
    );
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
              '/gviz/tq?sheet=' + QUERY_SHEET +
              '&headers=1&tq=' + tq;

    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(function() {
      var query = new google.visualization.Query(url);
      query.send(function(response) {
        if (response.isError()) {
          errorDiv.textContent = 'Error al consultar hoja: ' + response.getMessage();
          console.error(response.getDetailedMessage());
          return;
        }
        var dataTable = response.getDataTable();
        var chart = new google.visualization.OrgChart(container);
        chart.draw(dataTable, { allowHtml: true });
        errorDiv.textContent = '';
      });
    });

  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'Error cargando datos: ' + e.message;
  }
}

// Arrancamos y refrescamos cada 30 segundos
drawChart();
setInterval(drawChart, 30 * 1000);
