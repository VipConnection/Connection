// script.js

// URLs a tus hojas
const URL_USUARIOS  = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';
const URL_RESPUESTAS= 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=831917774';

// fetch + parse CSV muy básico
async function fetchCSV(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
function parseCSV(txt) {
  return txt.trim().split(/\r?\n/).map(r =>
    // split on commas, strip surrounding quotes
    r.split(',').map(c => c.replace(/^"|"$/g, '').trim())
  );
}

async function drawChart() {
  const errDiv = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';

  try {
    // 1) Trae simultáneamente las dos hojas
    const [rawU, rawR] = await Promise.all([
      fetchCSV(URL_USUARIOS),
      fetchCSV(URL_RESPUESTAS)
    ]);

    // 2) Parsealas
    const dataU = parseCSV(rawU);
    const dataR = parseCSV(rawR);

    // 3) Indices en UsuariosDiamond
    const hdrU = dataU[0];
    const idxUser     = hdrU.indexOf('UserID');
    const idxParent   = hdrU.indexOf('ParentForChart');
    const idxIsMirror = hdrU.indexOf('isMirror');
    if ([idxUser, idxParent, idxIsMirror].some(i => i<0)) {
      throw new Error('Faltan columnas clave en UsuariosDiamond');
    }

    // 4) Construye un map de ID → "Nombre Apellidos" usando RespuestasDiamond
    const hdrR = dataR[0];
    // buscamos cabeceras que contengan "Tu propio ID", "Nombre" y "Apellidos"
    const idxRUser     = hdrR.findIndex(h=>h.includes('Tu propio ID'));
    const idxRNombre   = hdrR.findIndex(h=>h.includes('Nombre') && !h.includes('Patrocinador'));
    const idxRApell    = hdrR.findIndex(h=>h.includes('Apellidos'));
    if ([idxRUser, idxRNombre, idxRApell].some(i=>i<0)) {
      throw new Error('Faltan Nombre/Apellidos en RespuestasDiamond');
    }
    const nameMap = {};
    dataR.slice(1).forEach(r=>{
      const id = r[idxRUser];
      if (id) nameMap[id] = `${r[idxRNombre]||''} ${r[idxRApell]||''}`.trim();
    });

    // 5) Prepara las filas para OrgChart
    // → OrgChart acepta objetos {v,f} en la celda de label si allowHtml:true
    const rows = dataU.slice(1).filter(r=>r[idxUser]);
    const chartRows = rows.map(r=>{
      const id       = r[idxUser];
      const parent   = r[idxParent] || '';
      const isMir    = r[idxIsMirror].toLowerCase()==='true';
      // si no es espejo y tenemos nombre, lo metemos
      let labelHtml = id;
      if (!isMir && nameMap[id]) {
        labelHtml += `<br><small>${nameMap[id]}</small>`;
      }
      return [
        { v: id, f: `<div style="text-align:center">${labelHtml}</div>` },
        parent,
        ''  // tooltip vacío
      ];
    });

    // 6) Dibuja
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn('string','User');
      dataTable.addColumn('string','Parent');
      dataTable.addColumn('string','ToolTip');
      dataTable.addRows(chartRows);

      const chart = new google.visualization.OrgChart(container);
      chart.draw(dataTable, { allowHtml:true });
      errDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// arranca & refresca cada 30s
drawChart();
setInterval(drawChart, 30*1000);
