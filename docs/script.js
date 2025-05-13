google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetName = 'UsuariosDiamond';       // ← Pégalo exacto
  const q         = 'SELECT A,B,C,D,E OFFSET 1';
  const queryUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`
                  + `?sheet=${encodeURIComponent(sheetName)}`
                  + `&tq=${encodeURIComponent(q)}`;

  console.log('🔗 fetching:', queryUrl);

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');

  const query = new google.visualization.Query(queryUrl);
  query.send(res => {
    if (res.isError()) {
      console.error('📕 Google Charts Error:', res.getMessage());
      errorDiv.textContent = 'Error cargando datos: ' + res.getMessage();
      return;
    }
    console.log('✅ Response OK — DataTable columns:', res.getDataTable().getNumberOfColumns(),
                'rows:', res.getDataTable().getNumberOfRows());

    // ... aquí iría el resto de tu lógica para construir el org chart ...

    errorDiv.textContent = '';
  });
}
