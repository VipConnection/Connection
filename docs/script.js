// script.js

const SPREADSHEET_ID   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const URL_USUARIOS     = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;           // UsuariosDiamond
const URL_RESPUESTAS   = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=831917774`;  // RespuestasDiamond

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Traemos ambos CSV
    const [rUsers, rAns] = await Promise.all([fetch(URL_USUARIOS), fetch(URL_RESPUESTAS)]);
    if (!rUsers.ok) throw new Error(`Usuarios: HTTP ${rUsers.status}`);
    if (!rAns.ok)   throw new Error(`Respuestas: HTTP ${rAns.status}`);
    const [csvUsers, csvAns] = await Promise.all([rUsers.text(), rAns.text()]);

    // 2) Parse CSV a matrices
    const parse = txt => txt.trim().split(/\r?\n/).map(r=>r.split(',').map(c=>c.replace(/^"|"$/g,'')));
    const uRows = parse(csvUsers);
    const aRows = parse(csvAns);

    // 3) Índices en UsuariosDiamond
    const hdrU = uRows[0];
    const iUID = hdrU.indexOf('UserID');
    const iPar = hdrU.indexOf('ParentForChart');
    const iMir = hdrU.indexOf('isMirror');
    if ([iUID,iPar,iMir].some(i=>i<0)) throw new Error('Columna faltante en UsuariosDiamond');

    // 4) Índices en RespuestasDiamond
    const hdrA = aRows[0].map(h=>h.trim());
    const iA_UID = hdrA.indexOf('Tu propio ID');
    const iA_Nom = hdrA.indexOf('Nombre');
    const iA_Ape = hdrA.indexOf('Apellidos');
    if ([iA_UID,iA_Nom,iA_Ape].some(i=>i<0)) throw new Error('Columna faltante en RespuestasDiamond');

    // 5) nameMap: id → "Nombre Apellidos"
    const nameMap = {};
    aRows.slice(1).forEach(r=>{
      const id = r[iA_UID].trim();
      if (id) nameMap[id] = `${r[iA_Nom].trim()||''} ${r[iA_Ape].trim()||''}`.trim();
    });

    // 6) Datos para el org chart
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Name');
    data.addColumn('string', 'Parent');
    data.addColumn('boolean','IsHtml');

    uRows.slice(1).forEach(r=>{
      const id       = r[iUID].trim();
      if (!id) return;
      const parent   = r[iPar].trim() || '';
      // const isMirror= r[iMir].trim().toLowerCase()==='true'; // si quieres usarlo
      const fullName = nameMap[id] || '';
      const labelHtml = `<div style="text-align:center">
                           ${id}${fullName?'<br>'+fullName:''}
                         </div>`;
      // Metemos siempre IsHtml=true para que el chart renderice el HTML
      data.addRow([ labelHtml, parent, true ]);
    });

    // 7) Dibujamos el OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos
drawChart();
