// 0) Carga Google Charts
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const errorDiv = document.getElementById('error');
  try {
    // 1) Configura tu Sheet ID y pestaña “UsuariosDiamond”
    const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
    const sheetName = 'Usuarios';
    // GID: para export CSV usamos el GID numérico de la pestaña (mira en URL de tu hoja)
    const sheetGid  = '0';

    // 2) Construye la URL de export CSV (tiene header en la primera fila)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;

    // 3) Fetch y parse CSV a array de filas
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    // split por líneas y comas simples (sin comillas)
    const rows = text
      .trim()
      .split('\n')
      .map(r=>r.split(','));

    // 4) Extrae header y datos
    const header = rows.shift();
    const data   = rows;

    // 5) Índices de columnas en tu hoja
    const idxUser    = header.indexOf('UserID');
    const idxParent  = header.indexOf('ParentID');
    const idxMirror  = header.indexOf('isMirror');
    // tus espejos empiezan en la columna 5 (E), que en el CSV es índice 4
    const firstMirror = 4;

    // 6) Monta mirrorMap: para cada padre, lista de arrays de espejos
    const mirrorMap = {};
    data.forEach(r=>{
      const pid = r[idxParent];
      if (!mirrorMap[pid]) mirrorMap[pid] = [];
      mirrorMap[pid].push(r.slice(firstMirror));
    });

    // 7) Prepara DataTable con columnas string
    const chartData = new google.visualization.DataTable();
    chartData.addColumn('string', 'Name');
    chartData.addColumn('string', 'Manager');

    // 8) Filas “normales” (no espejo)
    data.filter(r=>r[idxMirror]!=='TRUE').forEach(r=>{
      chartData.addRow([ r[idxUser], '' ]);
    });

    // 9) Filas “espejos” alineadas bajo espejos del abuelo
    data.filter(r=>r[idxMirror]==='TRUE').forEach(r=>{
      const uid = r[idxUser];
      const pid = r[idxParent];
      // posición de este espejo dentro de su padre
      const listOfLists = mirrorMap[pid];
      const pos = listOfLists.findIndex(arr=>arr.includes(uid));
      // espejo correspondiente del abuelo en misma posición
      const grandMirror = listOfLists[pos][pos];
      chartData.addRow([ uid, grandMirror ]);
    });

    // 10) Dibuja el organigrama
    const chart = new google.visualization.OrgChart(
      document.getElementById('chart_div')
    );
    chart.draw(chartData, { allowHtml: true });

    // todo OK
    errorDiv.textContent = '';

  } catch (e) {
    console.error(e);
    errorDiv.textContent = 'Error cargando datos:\n' + e.message;
  }
}
