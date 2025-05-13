google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetGid  = '831917774';   // <<– asegúrate de poner aquí el GID **exacto** de la pestaña “Respuestas Diamond”
  const errorDiv  = document.getElementById('error');
  const chartDiv  = document.getElementById('chart_div');

  errorDiv.textContent = 'Cargando datos…';
  try {
    // 1) Traer CSV completo (A→L)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export`
                 + `?format=csv&gid=${sheetGid}`;
    console.log('fetching CSV:', csvUrl);
    const res     = await fetch(csvUrl);
    const text    = await res.text();
    const allRows = text.trim().split('\n').map(r => r.split(','));
    console.log('filas totales:', allRows.length);

    // 2) Separa encabezado y datos, filtrando filas vacías
    const header = allRows[0];
    const rows   = allRows.slice(1)
      .filter(r => r[1].trim() !== '' && r[2].trim() !== '');  // B y C no vacíos

    console.log('filas útiles:', rows.length);

    // 3) Mapa id → { parent, mirrors[] }
    const map = new Map();
    rows.forEach(r => {
      const id      = r[1].trim();          // col B
      const parent  = r[2].trim();          // col C
      const mirrors = r.slice(3,12)         // col D→L
                       .map(v=>v.trim())
                       .filter(v=>v !== '');
      map.set(id,{ parent, mirrors });
    });

    // 4) Construye tabla OrgChart
    const table = [];
    table.push(['UserID','ParentID','isMirror','Nivel','ParentForChart']);

    // 4a) raíces (sin padre en el mapa)
    map.forEach((node,id) => {
      if (!map.has(node.parent)) {
        table.push([ id,'', false, 0,'' ]);
      }
    });

    // 4b) hijos directos
    map.forEach((node,id) => {
      if (map.has(node.parent)) {
        table.push([ id, node.parent, false, 0, node.parent ]);
      }
    });

    // 4c) espejos: cada espejo i del hijo bajo espejo i del abuelo
    map.forEach((node,id) => {
      node.mirrors.forEach((mid,i) => {
        const gp = map.get(node.parent);
        const chartParent = (gp && gp.mirrors[i]) ? gp.mirrors[i] : node.parent;
        table.push([ mid, id, true, 1, chartParent ]);
      });
    });

    // 5) Dibuja
    const data = new google.visualization.DataTable();
    data.addColumn('string','UserID');
    data.addColumn('string','ParentID');
    data.addColumn('boolean','isMirror');
    data.addColumn('number','Nivel');
    data.addColumn('string','ParentForChart');
    data.addRows(table.slice(1));

    new google.visualization.OrgChart(chartDiv)
      .draw(data,{allowHtml:true,nodeClass:'org-node'});

    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}
