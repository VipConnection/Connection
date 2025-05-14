// script.js

// URLs (gid=0 → UsuariosDiamond, gid=831917774 → RespuestasDiamond)
const CSV_URL_USERS = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';
const CSV_URL_RESP  = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=831917774';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // --- 1) Cargo UsuariosDiamond ---
    console.log('fetching usuarios:', CSV_URL_USERS);
    const respU = await fetch(CSV_URL_USERS);
    if (!respU.ok) throw new Error(`HTTP ${respU.status} al leer UsuariosDiamond`);
    const txtU = await respU.text();
    const rowsU = txtU.trim().split(/\r?\n/).map(r =>
      r.split(',').map(c => c.replace(/^"|"$/g,'').trim())
    );
    const hdrU = rowsU[0];
    const idxUser        = hdrU.indexOf('UserID');
    const idxParentChart = hdrU.indexOf('ParentForChart');
    const idxIsMirror    = hdrU.indexOf('isMirror');
    if (idxUser<0 || idxParentChart<0 || idxIsMirror<0) {
      throw new Error('Faltan columnas clave en CSV de UsuariosDiamond');
    }
    const dataRowsU = rowsU.slice(1).filter(r=> r[idxUser] !== '');

    // --- 2) Cargo RespuestasDiamond para nombres ---
    console.log('fetching respuestas:', CSV_URL_RESP);
    const respR = await fetch(CSV_URL_RESP);
    if (!respR.ok) throw new Error(`HTTP ${respR.status} al leer RespuestasDiamond`);
    const txtR = await respR.text();
    const rowsR = txtR.trim().split(/\r?\n/).map(r =>
      r.split(',').map(c => c.replace(/^"|"$/g,'').trim())
    );
    const hdrR = rowsR[0];
    const idxRUser      = hdrR.indexOf('Tu propio ID');
    const idxRNombre    = hdrR.indexOf('Nombre');
    const idxRApellidos = hdrR.indexOf('Apellidos');
    if (idxRUser<0 || idxRNombre<0 || idxRApellidos<0) {
      throw new Error('Columna faltante en RespuestasDiamond');
    }
    const nameMap = {};
    rowsR.slice(1).forEach(r=>{
      nameMap[ r[idxRUser] ] = 
        (`${r[idxRNombre]} ${r[idxRApellidos]}`).trim();
    });

    // --- 3) Preparo data para OrgChart ---
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ];
    dataRowsU.forEach(r=>{
      const rawId    = r[idxUser];                      // ej. "4711 Jesús"
      const idKey    = rawId.split(' ')[0];             // "4711"
      const parent   = r[idxParentChart] || '';
      const isMirror = r[idxIsMirror].toLowerCase() === 'true';
      const nombre   = nameMap[idKey] || '';            // mapa por "4711"
      // Construyo el tooltip con salto de línea
      const tip = `<div style="white-space:nowrap">
                     ${rawId}<br>
                     ${nombre}
                   </div>`;
      dataArray.push([ rawId, parent, tip ]);
    });

    // --- 4) Pinto el organigrama ---
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{ allowHtml:true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arranca al cargar la página
drawChart();
