// script.js

// 1) Función principal para dibujar el organigrama
async function drawChart() {
  const sheetId = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cb';    // tu ID de Spreadsheet
  const sheetGid = '539807990';                                     // el GID de la pestaña "RespuestasDiamond"
  const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('grafico_div');

  try {
    console.log('Fetching CSV:', csvUrl);
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // 2) Parse CSV a matriz de filas y extraer cabecera
    const rows = text.trim().split('\n').map(line => line.split(','));
    const headers = rows.shift().map(h => h.trim()).filter(h => h.length > 0);
    console.log('Cabecera CSV:', headers);

    // 3) Crear DataTable y añadir columnas en el orden correcto
    const data = new google.visualization.DataTable();
    headers.forEach(h => {
      let tipo = 'string';
      if (h === 'isMirror') tipo = 'boolean';
      else if (h === 'Level')  tipo = 'number';
      // si tuvieras más columnas numéricas:
      // else if (h === 'OtraColumnaNumérica') tipo = 'number';

      // IMPORTANTE: primero el tipo, luego la etiqueta
      data.addColumn(tipo, h);
    });

    // 4) Filtrar filas verdaderas y volcarlas
    const useful = rows.filter(r => r[0]?.trim() !== '' && r.length >= headers.length);
    console.log('Filas totales:', rows.length, 'filas útiles:', useful.length);

    useful.forEach(r => {
      const parsed = headers.map((h,i) => {
        const v = r[i] ?? '';
        if (h === 'isMirror') return v.toLowerCase() === 'true';
        if (h === 'Level')    return Number(v) || 0;
        return v;
      });
      data.addRow(parsed);
    });

    // 5) Dibujar el OrgChart
    new google.visualization.OrgChart(chartDiv).draw(data, { allowHtml: true });
    errorDiv.textContent = '';  // borrar posible mensaje de error
  } catch (err) {
    console.error(err);
    errorDiv.textContent = `Error cargando datos: ${err.message}`;
  }
}

// 0) Cargar la librería de Google Charts y lanzar drawChart()
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);
