// script.js

// → GID=0: UsuariosDiamond (ya pre-procesada por tu Apps Script con espejos en su sitio)
// → GID=539807990: Form_Responses1 (la hoja de respuestas donde tienes Nombre y Apellidos)
const SPREADSHEET_ID = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
const URL_USUARIOS   = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
const URL_FORM       = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=539807990`;

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descargamos **simultáneamente** los dos CSVs
    const [respU, respF] = await Promise.all([
      fetch(URL_USUARIOS),
      fetch(URL_FORM)
    ]);
    if (!respU.ok) throw new Error(`UsuariosDiamond HTTP ${respU.status}`);
    if (!respF.ok) throw new Error(`Form_Responses1 HTTP ${respF.status}`);
    const [csvU, csvF] = await Promise.all([respU.text(), respF.text()]);

    // 2) Parse CSV (sin soporte de comillas multilinea, rápido y sencillo)
    const parse = txt => txt.trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));

    const rowsU = parse(csvU);
    const rowsF = parse(csvF);

    // 3) Índices en UsuariosDiamond (gid=0)
    const hdrU   = rowsU.shift();
    const idxID  = hdrU.indexOf('UserID');
    const idxPar = hdrU.indexOf('ParentForChart');
    if (idxID < 0 || idxPar < 0) {
      console.error('Cabecera UsuariosDiamond:', hdrU);
      throw new Error('Faltan UserID o ParentForChart en UsuariosDiamond');
    }

    // 4) Índices en Form_Responses1 (gid=539807990)
    const hdrF = rowsF.shift().map(h=>h.toLowerCase());
    const idxF_ID  = hdrF.indexOf('tu propio id');
    const idxF_nom = hdrF.indexOf('nombre');
    const idxF_ape = hdrF.indexOf('apellidos');
    if (idxF_ID < 0 || idxF_nom < 0 || idxF_ape < 0) {
      console.error('Cabecera Form_Responses1:', hdrF);
      throw new Error('Faltan columnas Nombre/Apellidos en Form_Responses1');
    }

    // 5) Montamos un mapa id → "Nombre Apellidos"
    const nameMap = {};
    rowsF.forEach(r => {
      const id = r[idxF_ID].trim();
      if (!id) return;
      const full = [ r[idxF_nom].trim(), r[idxF_ape].trim() ]
        .filter(x=>x).join(' ');
      if (full) nameMap[id] = full;
    });

    // 6) Esperamos a que cargue la librería OrgChart de Google
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(() => {
      // 7) Preparamos el DataTable
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');
      data.addColumn('boolean','IsHtml');

      // 8) Rellenamos
      rowsU.forEach(r => {
        const id     = r[idxID].trim();
        const parent = r[idxPar].trim() || '';
        if (!id) return;

        // Etiqueta HTML: ID arriba, NombreApellidos abajo en pequeño
        const nm    = nameMap[id] || '';
        const label = nm
          ? `<div style="text-align:center">
               <strong>${id}</strong><br>
               <small>${nm}</small>
             </div>`
          : `<div style="text-align:center">${id}</div>`;

        data.addRow([ {v:id, f:label}, parent, true ]);
      });

      // 9) Dibujamos el organigrama
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data, {allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos
drawChart();

