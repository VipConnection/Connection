// 1) Carga Google Charts
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';  // tu ID de spreadsheet
  const sheetGid = '0';                                          // GID de la pestaña "Usuarios"
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;

  const errorDiv = document.getElementById('error');
  try {
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Convertimos CSV a array de filas
    const rows = text.trim().split('\n').map(r => r.split(','));
    // 3) Identificamos columnas
    const headers = rows.shift();
    const idxUser = headers.indexOf('UserID');
    const idxParent = headers.indexOf('ParentForChart');
    const idxMirror = headers.indexOf('isMirror');

    if (idxUser < 0 || idxParent < 0) {
      throw new Error(`No encontré UserID o ParentForChart en: ${headers.join(',')}`);
    }

    // 4) Creamos DataTable de orgchart
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Name');
    data.addColumn('string', 'Manager');

    // 5) Filtramos sólo los mirrors y los insertamos debajo de su mirror-abuelo
    //    Asumimos que ParentForChart ya refleja el árbol con espejos anidados correctamente
    rows.forEach(r => {
      const name = r[idxUser];
      const manager = r[idxMirror] === 'TRUE' ? r[idxParent] : '';
      data.addRow([ name, manager ]);
    });

    // 6) Dibujamos
    const chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    chart.draw(data, { allowHtml: true });
    errorDiv.textContent = '';
  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'Error: ' + e.message;
  }
}
