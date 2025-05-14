const SHEET_KEY = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const QUERY_URL = 
  'https://docs.google.com/spreadsheets/d/' 
  + SHEET_KEY 
  + '/gviz/tq?gid=0';  // SOLO gid=0, sin &headers

function drawChart() {
  const err = document.getElementById('error');
  const div = document.getElementById('gráfico_div');
  err.textContent = 'Cargando datos…';

  google.charts.load('current',{packages:['orgchart']});
  google.charts.setOnLoadCallback(() => {
    const query = new google.visualization.Query(QUERY_URL);
    query.send(res => {
      if (res.isError()) {
        err.textContent = 'Error en Query: ' + res.getMessage();
        return;
      }
      const dt = res.getDataTable();
      // Columnas: 0=UserID,1=ParentID,2=isMirror,3=Level,4=ParentForChart,5=LabelHTML
      const idxParent    = 4;
      const idxLabelHTML = 5;
      if (idxParent < 0 || idxLabelHTML < 0) {
        err.textContent = 'Faltan ParentForChart o LabelHTML en la hoja';
        return;
      }
      // Creamos un DataView con solo LabelHTML y ParentForChart
      const view = new google.visualization.DataView(dt);
      view.setColumns([
        {
          type: 'string',
          label: 'Name',
          calc: dt => null,
          p: { html: true },
          calc: (dt, row) => ({
            v: '',
            f: dt.getValue(row, idxLabelHTML)
          })
        },
        idxParent
      ]);
      // Dibujamos
      const chart = new google.visualization.OrgChart(div);
      chart.draw(view, { allowHtml: true });
      err.textContent = '';
    });
  });
}

// Ejecutar al cargar
drawChart();
