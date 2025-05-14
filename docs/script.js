// script.js

const SPREADSHEET_ID  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
// CSV de UsuariosDiamond (jerarquía resuelta con mirrors)
const URL_USUARIOS    = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
// CSV de RespuestasDiamond (para nombre y apellidos)
const URL_RESPUESTAS  = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=831917774`;

async function drawChart() {
  const err = document.getElementById('error');
  const div = document.getElementById('gráfico_div');
  err.textContent = 'Cargando datos…';

  try {
    // 1) Traemos ambos CSV
    const [rU, rA] = await Promise.all([ fetch(URL_USUARIOS), fetch(URL_RESPUESTAS) ]);
    if (!rU.ok) throw new Error(`UsuariosDiamond HTTP ${rU.status}`);
    if (!rA.ok) throw new Error(`RespuestasDiamond HTTP ${rA.status}`);
    const [csvU, csvA] = await Promise.all([rU.text(), rA.text()]);

    // 2) Parse CSVs de forma sencilla
    const parse = txt => txt.trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '')));

    const rowsU = parse(csvU);
    const rowsA = parse(csvA);

    // 3) Índices en UsuariosDiamond
    const hdrU = rowsU[0];
    const iUID = hdrU.indexOf('UserID');
    const iPar = hdrU.indexOf('ParentForChart');
    if (iUID<0 || iPar<0) {
      throw new Error('No encuentro UserID o ParentForChart en UsuariosDiamond');
    }

    // 4) Índices en RespuestasDiamond para Nombre y Apellidos
    const hdrA = rowsA[0].map(h=>h.trim());
    const iA_UID = hdrA.indexOf('Tu propio ID');
    const iA_Nom = hdrA.indexOf('Nombre');
    const iA_Ape = hdrA.indexOf('Apellidos');
    if (iA_UID<0||iA_Nom<0||iA_Ape<0) {
      throw new Error('No encuentro Tu propio ID, Nombre o Apellidos en RespuestasDiamond');
    }

    // 5) Construimos nameMap[id] = "Nombre Apellidos"
    const nameMap = {};
    rowsA.slice(1).forEach(r=>{
      const id = r[iA_UID].trim();
      if (id) nameMap[id] = `${r[iA_Nom].trim()||''} ${r[iA_Ape].trim()||''}`.trim();
    });

    // 6) Preparamos Google DataTable para OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=> {
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');
      data.addColumn('boolean','IsHtml');

      // 7) Añadimos cada fila de UsuariosDiamond
      rowsU.slice(1).forEach(r => {
        const id     = r[iUID].trim();
        if (!id) return;
        const parent = r[iPar].trim() || '';
        const full   = nameMap[id] || '';
        // HTML para la burbuja: ID + <br> + Nombre Apellidos
        const htmlLabel = `<div style="text-align:center">
                             ${id}${ full ? `<br>${full}` : '' }
                           </div>`;
        // isHtml=true para que se renderice tu HTML
        data.addRow([ { v: id, f: htmlLabel }, parent, true ]);
      });

      // 8) Dibujamos el OrgChart
      const chart = new google.visualization.OrgChart(div);
      chart.draw(data, { allowHtml: true });
      err.textContent = '';
    });

  } catch(e) {
    console.error(e);
    err.textContent = 'Error cargando datos: ' + e.message;
  }
}

// Arrancamos
drawChart();
