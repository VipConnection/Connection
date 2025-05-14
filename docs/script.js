// script.js

// 1) URLs de exportación CSV
//    - gid=0            → UsuariosDiamond
//    - gid=831917774   → RespuestasDiamond (donde están Nombre y Apellidos)
const CSV_URL_USERS = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';
const CSV_URL_RESP = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=831917774';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // --- a) Cargo UsuariosDiamond ---
    console.log('fetching usuarios:', CSV_URL_USERS);
    const respU = await fetch(CSV_URL_USERS);
    if (!respU.ok) throw new Error(`HTTP ${respU.status} al leer UsuariosDiamond`);
    const txtU = await respU.text();
    const rowsU = txtU.trim().split(/\r?\n/).map(r =>
      r.split(',').map(c => c.replace(/^"|"$/g,'').trim())
    );
    const hdrU = rowsU[0];

    // Índices en UsuariosDiamond
    const idxUser        = hdrU.indexOf('UserID');
    const idxParentChart = hdrU.indexOf('ParentForChart');
    const idxIsMirror    = hdrU.indexOf('isMirror');
    // (no necesitamos Level aquí)
    if (idxUser<0 || idxParentChart<0 || idxIsMirror<0) {
      throw new Error('Faltan columnas clave en CSV de UsuariosDiamond');
    }
    const dataRowsU = rowsU.slice(1).filter(r=> r[idxUser] !== '');

    // --- b) Cargo RespuestasDiamond para sacar Nombre+Apellidos ---
    console.log('fetching respuestas:', CSV_URL_RESP);
    const respR = await fetch(CSV_URL_RESP);
    if (!respR.ok) throw new Error(`HTTP ${respR.status} al leer RespuestasDiamond`);
    const txtR = await respR.text();
    const rowsR = txtR.trim().split(/\r?\n/).map(r =>
      r.split(',').map(c => c.replace(/^"|"$/g,'').trim())
    );
    const hdrR = rowsR[0];
    // Encuentro índices en respuestas
    const idxRUser     = hdrR.indexOf('Tu propio ID');
    const idxRNombre   = hdrR.indexOf('Nombre');
    const idxRApellidos= hdrR.indexOf('Apellidos');
    if (idxRUser<0 || idxRNombre<0 || idxRApellidos<0) {
      throw new Error('Columna faltante en RespuestasDiamond');
    }
    // construyo map ID → "Nombre Apellidos"
    const nameMap = {};
    rowsR.slice(1).forEach(r=>{
      const id = r[idxRUser];
      nameMap[id] = `${r[idxRNombre]} ${r[idxRApellidos]}`.trim();
    });

    // --- c) Preparo la data para OrgChart ---
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ];
    dataRowsU.forEach(r => {
      const id       = r[idxUser];
      const parent   = r[idxParentChart] || '';
      const isMirror = r[idxIsMirror].toLowerCase() === 'true';
      // tooltip con ID y debajo Nombre Apellidos
      const nombre   = nameMap[id] || '';
      const tip = `<div style="white-space:nowrap">
                     ${id}<br>
                     ${nombre}
                   </div>`;
      dataArray.push([ id, parent, tip ]);
    });

    // --- d) Pinto el chart ---
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml:true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos
drawChart();

