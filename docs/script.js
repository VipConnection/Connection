// script.js

// → GID=0: UsuariosDiamond (la hoja con UserID / ParentForChart / isMirror / Level que generas con AppsScript)
// → GID=539807990: Form_Responses1 (donde están Nombre / Apellidos)
const SPREADSHEET_ID = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const URL_USUARIOS   = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
const URL_FORM       = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=539807990`;

async function drawChart() {
  const errDiv   = document.getElementById('error');
  const chartDiv = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';

  try {
    // ➤ Sólo necesitamos DOS CSVs: UsuariosDiamond y Form_Responses1
    const [rU, rF] = await Promise.all([fetch(URL_USUARIOS), fetch(URL_FORM)]);
    if (!rU.ok) throw new Error(`UsuariosDiamond HTTP ${rU.status}`);
    if (!rF.ok) throw new Error(`Form_Responses1 HTTP ${rF.status}`);
    const [csvU, csvF] = await Promise.all([rU.text(), rF.text()]);

    // ➤ Parser CSV sencillo
    const parse = txt => txt.trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '')));

    const rowsU = parse(csvU);
    const rowsF = parse(csvF);

    // 1) Detectamos índices en UsuariosDiamond
    const hdrU   = rowsU.shift();
    const idxID  = hdrU.indexOf('UserID');
    const idxPar = hdrU.indexOf('ParentForChart');
    if (idxID < 0 || idxPar < 0) {
      console.log('Cabecera UsuariosDiamond:', hdrU);
      throw new Error('Faltan UserID o ParentForChart en UsuariosDiamond');
    }

    // 2) Detectamos índices en Form_Responses1 (lower-case + trim)
    const hdrF = rowsF.shift().map(h => h.trim().toLowerCase());
    const idxF_ID   = hdrF.indexOf('tu propio id');
    const idxF_nom  = hdrF.indexOf('nombre');
    const idxF_ape  = hdrF.indexOf('apellidos');
    if (idxF_ID < 0 || idxF_nom < 0 || idxF_ape < 0) {
      console.log('Cabecera Form_Responses1:', rowsF[0]);
      throw new Error('Faltan columnas Nombre/Apellidos en Form_Responses1');
    }

    // 3) Creamos un map id→"Nombre Apellidos"
    const nameMap = {};
    rowsF.forEach(r => {
      const id = r[idxF_ID].trim();
      if (!id) return;
      const full = `${r[idxF_nom].trim()} ${r[idxF_ape].trim()}`.trim();
      if (full) nameMap[id] = full;
    });

    // 4) Preparamos los datos para OrgChart:
    //    [ {v:id, f: etiqueta HTML}, parent, true ]
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');
      data.addColumn('boolean','IsHtml');

      rowsU.forEach(r => {
        const id     = r[idxID].trim();
        const parent = r[idxPar].trim() || '';
        if (!id) return;

        const nm = nameMap[id] || '';
        const label = nm
          ? `<div style="text-align:center">${id}<br><small>${nm}</small></div>`
          : `<div style="text-align:center">${id}</div>`;

        data.addRow([ {v:id, f:label}, parent, true ]);
      });

      const chart = new google.visualization.OrgChart(chartDiv);
      chart.draw(data, {allowHtml:true});
      errDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos
drawChart();

