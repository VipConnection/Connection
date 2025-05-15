// → Ajusta estos valores a tu documento y pestaña
const SHEET_ID     = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const QUERY_SHEET  = 'UsuariosDiamond';  // nombre exacto de la pestaña

// Función principal que descarga y dibuja el organigrama
function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  // Montamos la query SQL-like: columnas A..E, filas donde A (UserID) no esté vacío,
  // y ordenamos por nivel / parent para que Google Charts las coloque correctamente.
  const tq = encodeURIComponent(
    'select A,B,C,D,E where A is not null order by D asc, E asc'
  );
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
              `/gviz/tq?sheet=${QUERY_SHEET}&headers=1&tq=${tq}`;

  // Cargamos el paquete OrgChart
  google.charts.load('current', { packages: ['orgchart'] });
  google.charts.setOnLoadCallback(() => {
    const query = new google.visualization.Query(url);
    query.send(response => {
      if (response.isError()) {
        errorDiv.textContent = 
          'Error al consultar la hoja: ' + response.getMessage();
        console.error(response.getDetailedMessage());
        return;
      }

      // Obtenemos directamente el DataTable ya filtrado y ordenado
      const dataTable = response.getDataTable();

      // Dibujamos el OrgChart
      const chart = new google.visualization.OrgChart(container);
      chart.draw(dataTable, {
        allowHtml: true,
        // si quieres estilos extra: color de nodos, tamaño de fuente, etc.
      });

      errorDiv.textContent = '';
    });
  });
}

// Arrancamos y refrescamos cada 30 segundos
drawChart();
setInterval(drawChart, 30 * 1000);

