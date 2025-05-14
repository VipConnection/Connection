const SHEET_KEY = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const QUERY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_KEY}/gviz/tq?gid=0`;

function drawChart() {
  const errDiv = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';

  google.charts.load('current', { packages: ['orgchart'] });
  google.charts.setOnLoadCallback(() => {
    const query = new google.visualization.Query(QUERY_URL);
    query.send(res => {
      if (res.isError()) {
        errDiv.textContent = 'Error en Query: ' + res.getMessage();
        return;
      }
      const dt = res.getDataTable();
      const data = new google.visualization.DataView(dt);
      // asumiendo: col0=UserID, col4=ParentForChart, col5=LabelHTML
      data.setColumns([5, 4]);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errDiv.textContent = '';
    });
  });
}

drawChart();
