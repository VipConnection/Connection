// script.js

// URL de la pestaña UsuariosDiamond (gid=0) vía gviz Query
const QUERY_URL =
  'https://docs.google.com/spreadsheets/d/'
  + '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs'
  + '/gviz/tq?gid=0&headers=1';

function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  // Carga Google Charts
  google.charts.load('current', { packages:['orgchart'] });
  google.charts.setOnLoadCallback(() => {
    // Ejecuta la query
    const query = new google.visualization.Query(QUERY_URL);
    query.send(response => {
      if (response.isError()) {
        errorDiv.textContent = 'Error al leer la hoja: ' + response.getMessage();
        return;
      }
      // Obtenemos el DataTable completo
      const dt = response.getDataTable();
      // Columnas: 0=UserID,1=ParentID,2=isMirror,3=Level,4=ParentForChart,5=LabelHTML
      const idxParent    = 4;
      const idxLabelHTML = 5;

      // Creamos un DataView con solo LabelHTML y ParentForChart
      const view = new google.visualization.DataView(dt);
      view.setColumns([
        {
          calc: (dt,row) => ({ v:'', f: dt.getValue(row, idxLabelHTML) }),
          type: 'string',
          label: 'Name'
        },
        idxParent
      ]);

      // Dibujamos
      const chart = new google.visualization.OrgChart(container);
      chart.draw(view, { allowHtml: true });
      errorDiv.textContent = '';
    });
  });
}

// Arranca al cargar
drawChart();
