// script.js

// → Sustituye estos URLs por los tuyos si cambian las hojas
const URL_USUARIOS = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';
const URL_RESPUESTAS = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=831917774';

async function fetchCSV(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function drawChart() {
  const errDiv = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errDiv.textContent = 'Cargando datos…';

  try {
    // 1) Traemos ambos CSVs en paralelo
    const [csvU, csvR] = await Promise.all([
      fetchCSV(URL_USUARIOS),
      fetchCSV(URL_RESPUESTAS)
    ]);

    // 2) Parse sencillo
    const parse = txt => txt.trim()
      .split(/\r?\n/)
      .map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
    const dataU = parse(csvU);
    const dataR = parse(csvR);

    // 3) Índices en sheet UsuariosDiamond
    const hdrU = dataU[0];
    const idxUser       = hdrU.indexOf('UserID');
    const idxParent     = hdrU.indexOf('ParentForChart');
    const idxIsMirror   = hdrU.indexOf('isMirror');
    const idxLevel      = hdrU.indexOf('Level');
    if ([idxUser,idxParent,idxIsMirror,idxLevel].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en UsuariosDiamond');
    }

    // 4) Creamos un map de nombres desde RespuestasDiamond
    const hdrR = dataR[0];
    const idxRUser     = hdrR.indexOf('Tu propio ID');
    const idxRNombre   = hdrR.indexOf('Nombre');
    const idxRApellidos= hdrR.indexOf('Apellidos');
    if ([idxRUser,idxRNombre,idxRApellidos].some(i=>i<0)) {
      throw new Error('Faltan columnas Nombre/Apellidos en RespuestasDiamond');
    }
    const nameMap = {};
    dataR.slice(1).forEach(r=>{
      const id = r[idxRUser];
      if (id) nameMap[id] = `${r[idxRNombre]||''} ${r[idxRApellidos]||''}`.trim();
    });

    // 5) Filtramos filas útiles y preparamos la tabla de datos para OrgChart
    const rowsU = dataU.slice(1).filter(r=>r[idxUser]);
    const dataArray = [
      ['UserID','ParentID','Tooltip']
    ].concat(rowsU.map(r=>{
      const id       = r[idxUser];
      const parent   = r[idxParent] || '';
      const isMirror = r[idxIsMirror].toLowerCase()==='true';
      // tooltip = html con ID siempre, y si no es espejo, añadimos nombre/apellidos
      let tip = `<div style="white-space:nowrap">${id}`;
      if (!isMirror && nameMap[id]) {
        tip += `<br><i>${nameMap[id]}</i>`;
      }
      tip += `</div>`;
      return [ id, parent, tip ];
    }));

    // 6) Dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data = google.visualization.arrayToDataTable(dataArray, false);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// refresca cada 30s
drawChart();
setInterval(drawChart, 30*1000);
