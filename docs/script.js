google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetGid  = '0';           // el GID de tu pestaña "Respuestas Diamond"
  const errorDiv  = document.getElementById('error');
  const chartDiv  = document.getElementById('chart_div');

  errorDiv.textContent = 'Cargando datos…';
  try {
    // 1) Traer CSV completo (columnas A→L)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export`
                 + `?format=csv&gid=${sheetGid}`;
    console.log('fetching CSV:', csvUrl);
    const res     = await fetch(csvUrl);
    const text    = await res.text();
    const allRows = text.trim().split('\n').map(r => r.split(','));

    // 2) Separar encabezado + datos
    const header = allRows[0];             // ['Marca temporal','Tu propio ID',...,'Espejo 9']
    const rows   = allRows.slice(1)
      // Opcional: filtrar líneas en blanco
      .filter(r => r[2] !== '');

    // 3) Build mapa id→{ parent, mirrors[] }
    //    * parent = columna C
    //    * mirrors = col D→L
    const map = new Map();
    rows.forEach(r => {
      const id      = r[1].trim();       // Tu propio ID (col B)
      const parent  = r[2].trim();       // ID de quien te invita (col C)
      const mirrors = r.slice(3,12).map(v=>v.trim()).filter(v=>v!=='');
      map.set(id,{ parent, mirrors });
    });

    // 4) Construir tabla para el OrgChart
    //    columnas: [UserID, ParentID, isMirror, Nivel, ParentForChart]
    const table = [];
    table.push(['UserID','ParentID','isMirror','Nivel','ParentForChart']);

    // 4a) Primero los “raíz” (sin padre en el mapa)
    map.forEach((node,id) => {
      if (!map.has(node.parent)) {
        table.push([ id,'', false, 0,'' ]);
      }
    });

    // 4b) Luego los hijos directos
    map.forEach((node,id) => {
      if (map.has(node.parent)) {
        table.push([ id, node.parent, false, 0, node.parent ]);
      }
    });

    // 4c) Por último los *espejos*, cada uno bajo el espejo i del abuelo
    map.forEach((node,id) => {
      node.mirrors.forEach((mid,i) => {
        // espejos del abuelo:
        const pmirrors = map.get(node.parent)?.mirrors || [];
        // Si el abuelo tiene espejo en la misma posición i, lo usas;
        // si no, cuelga del parent "normal"
        const chartParent = pmirrors[i] || node.parent;
        table.push([ mid, id, true, 1, chartParent ]);
      });
    });

    // 5) Dibujar con Google Charts
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
