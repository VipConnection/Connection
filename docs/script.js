// script.js

// URLs CSV (reemplaza con tu propio spreadsheet ID si cambia)
const SS_ID        = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const URL_USUARIOS = `https://docs.google.com/spreadsheets/d/${SS_ID}/export?format=csv&gid=0`;           // UsuariosDiamond
const URL_RESPUESTAS = `https://docs.google.com/spreadsheets/d/${SS_ID}/export?format=csv&gid=831917774`; // RespuestasDiamond

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargamos ambas hojas
    const [respUsers, respAnswers] = await Promise.all([
      fetch(URL_USUARIOS),
      fetch(URL_RESPUESTAS)
    ]);
    if (!respUsers.ok)   throw new Error(`Error HTTP usuarios: ${respUsers.status}`);
    if (!respAnswers.ok) throw new Error(`Error HTTP respuestas: ${respAnswers.status}`);

    const [csvUsers, csvAnswers] = await Promise.all([
      respUsers.text(),
      respAnswers.text()
    ]);

    // 2) Parseo simple de CSVs
    const parse = txt => txt
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '')));
    
    const rowsU = parse(csvUsers);
    const rowsA = parse(csvAnswers);

    const hdrU = rowsU[0];
    const hdrA = rowsA[0];

    // Índices clave en UsuariosDiamond
    const iUser      = hdrU.indexOf('UserID');
    const iParent    = hdrU.indexOf('ParentForChart');
    const iIsMirror  = hdrU.indexOf('isMirror');
    // (no necesitamos Level para mostrar nombres)

    if ([iUser,iParent,iIsMirror].some(i=>i<0)) {
      throw new Error('Faltan columnas UserID/ParentForChart/isMirror en UsuariosDiamond');
    }
    
    // Índices clave en RespuestasDiamond para nombre y apellidos
    const iRA_User   = hdrA.indexOf('Tu propio ID');
    const iRA_Nombre = hdrA.indexOf('Nombre');
    const iRA_Apelli = hdrA.indexOf('Apellidos');
    if ([iRA_User,iRA_Nombre,iRA_Apelli].some(i=>i<0)) {
      throw new Error('Faltan columnas Nombre/Apellidos/Tu propio ID en RespuestasDiamond');
    }

    // 3) Construimos mapa de nombres: id → "Nombre Apellidos"
    const nameMap = {};
    rowsA.slice(1).forEach(r => {
      const id = r[iRA_User];
      if (id) {
        nameMap[id] = `${r[iRA_Nombre] || ''} ${r[iRA_Apelli] || ''}`.trim();
      }
    });

    // 4) Filtramos filas útiles de UsuariosDiamond
    const dataRows = rowsU.slice(1).filter(r => r[iUser]);

    // 5) Montamos dataArray con HTML en la celda de nodo
    const dataArray = [
      // OrgChart espera [ 'Label', 'Parent', 'Tooltip' ]
      ['UserID','ParentID','Tooltip']
    ].concat(
      dataRows.map(r => {
        const rawId    = r[iUser];
        const parentId = r[iParent] || '';
        const isMirror = String(r[iIsMirror]).toLowerCase() === 'true';

        // Construimos el label con nombre/apellidos
        const fullName = nameMap[rawId] || '';
        // Podemos usar un pequeño estilo inline para centrar
        const labelHtml = `<div style="text-align:center">
                             ${rawId}${ fullName ? '<br>'+fullName : '' }
                           </div>`;

        // Tooltip o sufijo visual
        const tip = isMirror
          ? `${rawId} (espejo)`
          : `${rawId}`;

        return [ labelHtml, parentId, tip ];
      })
    );

    // 6) Dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, {
        allowHtml: true,
        nodeClass: 'node',
        selectedNodeClass: 'selected-node'
      });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos
drawChart();
