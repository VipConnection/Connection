// script.js

// 1) URL de exportación CSV: asegúrate de que el gid coincide con tu hoja UsuariosDiamond
const CSV_URL = 
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs' +
  '/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descarga y parseo muy simple del CSV
    console.log('fetching:', CSV_URL);
    const resp = await fetch(CSV_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));

    // 3) Cabecera e índices
    const headers    = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentForChart');
    const idxMirror  = headers.indexOf('isMirror');
    const idxName    = headers.indexOf('Nombre');
    const idxSurname = headers.indexOf('Apellidos');
    if ([idxUser,idxParent,idxMirror,idxName,idxSurname].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }

    // 4) Construcción de mapa para calcular abuelo→espejo
    //    Reproducimos aquí la lógica de Apps Script que ya funcionaba:
    const map = {};
    rows.forEach(r => {
      const id      = r[idxUser];
      const parent  = r[idxParent] || '';
      // recogemos todos los espejos de este id (no los desplegamos aquí, sólo guardamos)
      if (!map[id]) map[id] = { id, parent, mirrors: [], level: null, chartParent: null };
      const node = map[id];
      // isMirror no lo almacenamos, sólo hace falta para el chart
      // pero extraemos los espejos "hijos"
      if (r[idxMirror].toLowerCase()==='false') {
        // buscamos espejos en todos los índices 'EspejoX' que haya tras el idxParent
        headers.forEach((h,i) => {
          if (h && h.startsWith('Espejo') && r[i]) {
            node.mirrors.push(r[i]);
          }
        });
      }
    });
    // recursión para asignar nivel y chartParent
    function setNode(id) {
      const node = map[id];
      if (!node || node.level!==null) return;
      const p = map[node.parent];
      if (!p) {
        node.level       = 0;
        node.chartParent = '';
      } else {
        setNode(node.parent);
        node.level       = p.level+1;
        node.chartParent = node.parent;
      }
      // “colgamos” cada espejo de este nodo
      node.mirrors.forEach(m => {
        if (!map[m]) map[m] = { id:m, parent:id, mirrors:[], level:null, chartParent:null };
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 5) Preparamos array para OrgChart con HTML en nodos “reales”
    const dataArray = [['UserID','ParentID','LabelHTML']];
    Object.values(map).forEach(n => {
      // 5.a) Nodo “real” = ID + salto + Nombre Apellidos
      const name    = rows.find(r=>r[idxUser]===n.id)?.[idxName]    || '';
      const surname = rows.find(r=>r[idxUser]===n.id)?.[idxSurname] || '';
      const label   = `<div style="white-space:nowrap;">${n.id}<br>${name} ${surname}</div>`;
      dataArray.push([{ v:n.id, f:label }, n.chartParent, '']);

      // 5.b) Cada espejo “colgado” con lógica abuelo→espejo
      n.mirrors.forEach((m,i) => {
        const abuID = n.chartParent;
        const abuMirrors = abuID && map[abuID] ? map[abuID].mirrors : [];
        const chartParForMirror = abuMirrors[i] || n.id;
        dataArray.push([ m, chartParForMirror, '' ]);
      });
    });

    // 6) Dibujamos
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// Arrancamos y refrescamos cada 30 s
drawChart();
setInterval(drawChart, 30*1000);
