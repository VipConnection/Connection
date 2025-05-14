// → URLs CSV export (ajusta el gid de RESPUESTAS aquí)
const CSV_URL_USERS = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';
const CSV_URL_RESP  = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=123456789';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Cargo UsuariosDiamond
    const respU = await fetch(CSV_URL_USERS);
    if (!respU.ok) throw new Error(`HTTP ${respU.status} al leer UsuariosDiamond`);
    const txtU = await respU.text();
    const rowsU = txtU.trim().split(/\r?\n/).map(r=>
      r.split(',').map(c=>c.replace(/^"|"$/g,'').trim())
    );
    const hdrU = rowsU.shift();
    const idxUser        = hdrU.indexOf('UserID');
    const idxParentChart = hdrU.indexOf('ParentForChart');
    const idxIsMirror    = hdrU.indexOf('isMirror');
    if ([idxUser,idxParentChart,idxIsMirror].some(i=>i<0))
      throw new Error('Faltan columnas clave en UsuariosDiamond');
    const dataRowsU = rowsU.filter(r=>r[idxUser]);

    // 2) Cargo RespuestasDiamond (para nombre/apellidos)
    const respR = await fetch(CSV_URL_RESP);
    if (!respR.ok) throw new Error(`HTTP ${respR.status} al leer RespuestasDiamond`);
    const txtR = await respR.text();
    const rowsR = txtR.trim().split(/\r?\n/).map(r=>
      r.split(',').map(c=>c.replace(/^"|"$/g,'').trim())
    );
    const hdrR = rowsR.shift();
    const idxRUser      = hdrR.indexOf('Tu propio ID');
    const idxRNombre    = hdrR.indexOf('Nombre');
    const idxRApellidos = hdrR.indexOf('Apellidos');
    if ([idxRUser,idxRNombre,idxRApellidos].some(i=>i<0))
      throw new Error('Faltan columnas “Tu propio ID”, “Nombre” o “Apellidos” en RespuestasDiamond');
    const nameMap = {};
    rowsR.forEach(r=>{
      nameMap[r[idxRUser]] = `${r[idxRNombre]} ${r[idxRApellidos]}`.trim();
    });

    // 3) Construyo el array para OrgChart
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ];
    dataRowsU.forEach(r=>{
      const rawId    = r[idxUser];                // ej. "4711 Jesús"
      const idKey    = rawId.split(' ')[0];       // "4711"
      const parent   = r[idxParentChart] || '';
      const nombre   = nameMap[idKey] || '';
      const tip = `<div style="white-space:nowrap">
                     ${rawId}<br>${nombre}
                   </div>`;
      dataArray.push([rawId, parent, tip]);
    });

    // 4) Pinto OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arranco
drawChart();
