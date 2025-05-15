// → Url CSV export de tu hoja UsuariosDiamond (gid=0)
const CSV_URL = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // parse CSV sencillo
    const rows = text.trim().split(/\r?\n/).map(r=>
      r.split(',').map(c=>c.replace(/^"|"$/g,'').trim())
    );
    const headers = rows[0];
    console.log('Cabecera CSV:', headers);

    // índices
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxLevel   = headers.indexOf('Level');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');
    if ([idxUser,idxParent,idxMirror,idxLevel,idxName,idxSurname].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // filas útiles
    const dataRows = rows.slice(1).filter(r=>r[idxUser]);

    console.log(`Filas totales: ${rows.length-1}, útiles: ${dataRows.length}`);

    // preparar array para OrgChart: [ID, Parent, LabelHTML]
    const dataArray = [
      ['UserID','ParentID','Label']
    ].concat( dataRows.map(r=>{
      const id       = r[idxUser];
      const parent   = r[idxParent] || '';
      // formatear etiqueta con salto de línea HTML
      const nombre   = r[idxName] || '';
      const apellido = r[idxSurname] || '';
      const label    = 
        `<div style="white-space:nowrap;">` +
        `${id}<br>${nombre} ${apellido}` +
        `</div>`;
      return [ id, parent, label ];
    }) );

    // dibujar
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{
        allowHtml:true
      });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// inicializa
drawChart();
