// 0) Cargamos Google Charts
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs'; // tu ID de Spreadsheet
  const sheetGid = '0';  // GID de la pestaña "UsuariosDiamond"
  const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
  
  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('gráfico_div');
  
  try {
    console.log('Fetching CSV:', csvUrl);
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    
    // 1) Parsear CSV en matriz de filas
    const rowsRaw = text.trim().split('\n').map(r => r.split(','));
    const headers = rowsRaw.shift().map(h => h.trim());
    console.log('Cabecera CSV:', headers);
    
    // 2) Sólo filas donde el UserID no esté vacío
    const filas = rowsRaw.filter(r => r[0].trim() !== '');
    console.log('Filas totales:', rowsRaw.length, 'filas útiles:', filas.length);
    
    // 3) Crear DataTable explícito con las 5 columnas fijas
    const data = new google.visualization.DataTable();
    data.addColumn('string',  'UserID');
    data.addColumn('string',  'ParentID');
    data.addColumn('boolean', 'isMirror');
    data.addColumn('number',  'Level');
    data.addColumn('string',  'ParentForChart');
    
    // 4) Llenar DataTable
    filas.forEach(r => {
      data.addRow([
        r[0],                        // UserID
        r[1],                        // ParentID
        r[2].toLowerCase()==='true', // isMirror
        Number(r[3]) || 0,           // Level
        r[4]                         // ParentForChart
      ]);
    });
    
    // 5) Dibujar el OrgChart
    new google.visualization.OrgChart(chartDiv)
      .draw(data, { allowHtml: true });
    
    errorDiv.textContent = '';  // ya no hay error
  } catch (e) {
    console.error(e);
    errorDiv.textContent = `Error cargando datos: ${e.message}`;
  }
}
