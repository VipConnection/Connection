// script.js

// → GID=0: UsuariosDiamond
// → GID=831917774: RespuestasDiamond (solo para la jerarquía y espejos)
// → GID=539807990: Form_Responses1 (donde están Nombre, Apellidos, Teléfono, Billetera…)
const SPREADSHEET_ID   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const URL_USUARIOS     = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
const URL_RESPUESTAS   = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=831917774`;
const URL_FORM_RESP    = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=539807990`;

async function drawChart() {
  const errDiv = document.getElementById('error');
  const chartDiv = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';

  try {
    // 1) Bajamos los tres CSV: UsuariosDiamond, RespuestasDiamond y Form_Responses1
    const [rU, rR, rF] = await Promise.all([
      fetch(URL_USUARIOS),
      fetch(URL_RESPUESTAS),
      fetch(URL_FORM_RESP),
    ]);
    if (!rU.ok) throw new Error(`UsuariosDiamond HTTP ${rU.status}`);
    if (!rR.ok) throw new Error(`RespuestasDiamond HTTP ${rR.status}`);
    if (!rF.ok) throw new Error(`Form_Responses1 HTTP ${rF.status}`);
    const [csvU, csvR, csvF] = await Promise.all([rU.text(), rR.text(), rF.text()]);

    // 2) Simple parser CSV
    const parse = txt => txt.trim().split(/\r?\n/).map(
      line => line.split(',').map(c => c.replace(/^"|"$/g,''))
    );

    const rowsU = parse(csvU);
    const rowsR = parse(csvR);
    const rowsF = parse(csvF);

    // 3) Índices en UsuariosDiamond: UserID + ParentForChart
    const hdrU = rowsU[0];
    const iUID = hdrU.indexOf('UserID');
    const iPar = hdrU.indexOf('ParentForChart');
    if (iUID < 0 || iPar < 0) {
      throw new Error('No hallé UserID o ParentForChart en UsuariosDiamond');
    }

    // 4) Índices en Form_Responses1 ⇒ Nombre y Apellidos
    //    Normalizamos a lower-case y trim para evitar discrepancias
    const hdrF = rowsF[0].map(h => h.trim().toLowerCase());
    const iF_UID = hdrF.indexOf('tu propio id');
    const iF_NOM = hdrF.indexOf('nombre');
    const iF_APE = hdrF.indexOf('apellidos');
    if (iF_UID < 0 || iF_NOM < 0 || iF_APE < 0) {
      console.log('Encabezados Form_Responses1:', rowsF[0]);
      throw new Error('Faltan columnas Tu propio ID, Nombre o Apellidos en Form_Responses1');
    }

    // 5) Construimos map id→"Nombre Apellidos"
    const nameMap = {};
    rowsF.slice(1).forEach(r => {
      const id = r[iF_UID].trim();
      if (!id) return;
      const full = `${r[iF_NOM].trim()} ${r[iF_APE].trim()}`.trim();
      if (full) nameMap[id] = full;
    });

    // 6) Ahora cargamos Google OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');
      data.addColumn('boolean','IsHtml');

      // 7) Rellenamos filas con la jerarquía YA calculada en UsuariosDiamond
      rowsU.slice(1).forEach(r => {
        const id     = r[iUID].trim();
        if (!id) return;
        const parent = r[iPar].trim() || '';
        // Etiqueta HTML: ID + <br> + Nombre Apellidos (si existe)
        const full = nameMap[id] || '';
        const label = full
          ? `<div style="text-align:center">${id}<br>${full}</div>`
          : `<div style="text-align:center">${id}</div>`;
        data.addRow([ { v: id, f: label }, parent, true ]);
      });

      // 8) Dibujamos el gráfico
      const chart = new google.visualization.OrgChart(chartDiv);
      chart.draw(data, { allowHtml:true });
      errDiv.textContent = '';
    });

  } catch(e) {
    console.error(e);
    errDiv.textContent = 'Error cargando datos: ' + e.message;
  }
}

// Arrancamos
drawChart();

