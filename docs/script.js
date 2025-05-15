// 1) URLs CSVs
const URL_USERS      = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';         // UsuariosDiamond
const URL_RESPUESTAS = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=539807990'; // RespuestasDiamond

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Descargamos ambos CSV en paralelo
    const [respU, respR] = await Promise.all([fetch(URL_USERS), fetch(URL_RESPUESTAS)]);
    if (!respU.ok) throw new Error(`HTTP users ${respU.status}`);
    if (!respR.ok) throw new Error(`HTTP respuestas ${respR.status}`);

    const [textU, textR] = await Promise.all([respU.text(), respR.text()]);

    // 3) Parseamos a matrices
    const rowsU = textU.trim().split(/\r?\n/).map(r=>r.split(',').map(c=>c.replace(/^"|"$/g,'').trim()));
    const rowsR = textR.trim().split(/\r?\n/).map(r=>r.split(',').map(c=>c.replace(/^"|"$/g,'').trim()));

    // 4) Índices en UsuariosDiamond
    const hdrU       = rowsU.shift();
    const idxUser    = hdrU.indexOf('UserID');
    const idxParent  = hdrU.indexOf('ParentID');
    const idxMirror  = hdrU.indexOf('isMirror');
    const idxChart   = hdrU.indexOf('ParentForChart');
    if ([idxUser,idxParent,idxMirror,idxChart].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en UsuariosDiamond');
    }

    // 5) Índices en RespuestasDiamond (para Nombre y Apellidos)
    const hdrR       = rowsR.shift();
    // el ID en Respuestas puede llamarse "Tu propio ID"
    const idxRUser   = hdrR.indexOf('Tu propio ID') >= 0
      ? hdrR.indexOf('Tu propio ID')
      : hdrR.indexOf('UserID');
    const idxNombre  = hdrR.indexOf('Nombre');
    const idxApell   = hdrR.indexOf('Apellidos');
    if (idxRUser<0||idxNombre<0||idxApell<0) {
      throw new Error('Faltan columnas Nombre/Apellidos en RespuestasDiamond');
    }

    // 6) Creamos mapa de nombres: nameMap[id] = { nombre, apellidos }
    const nameMap = {};
    rowsR.forEach(r=>{
      const id = r[idxRUser];
      if (!id) return;
      nameMap[id] = {
        nombre   : r[idxNombre]||'',
        apellidos: r[idxApell]||''
      };
    });

    // 7) Construimos el mapa de nodos de Usuarios + espejos
    const map = {};
    rowsU.forEach(r=>{
      const id     = r[idxUser];
      const parent = r[idxParent];
      if (!id||!parent) return;
      // extraemos todos los "Espejo X"
      const mirrors = hdrU
        .map((h,i)=> h&&h.startsWith('Espejo') ? r[i] : null )
        .filter(x=>x);
      map[id] = { id, parent, mirrors, level:null, chartParent:null };
    });

    // 8) Recursión para asignar level y chartParent
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
      // procesamos sus mirrors como nodos independientes
      node.mirrors.forEach(m=>{
        if (!map[m]) {
          map[m] = { id:m, parent:id, mirrors:[], level:null, chartParent:null };
        }
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 9) Armamos el array para OrgChart
    const dataArray = [['User','Parent','Tooltip']];
    Object.values(map).forEach(n=>{
      // — nodo “real” con nombre/apellidos si existe —
      const nm = nameMap[n.id]||{};
      const label = nm.nombre
        ? `${n.id}<br><small>${nm.nombre} ${nm.apellidos}</small>`
        : n.id;
      dataArray.push([
        { v: n.id, f:`<div style="text-align:center;white-space:nowrap">${label}</div>` },
        n.chartParent||'',
        ''
      ]);

      // — cada espejo bajo el espejo correspondiente de su abuelo —
      n.mirrors.forEach((m,i)=>{
        // espejo i-ésimo de este nodo → debe colgar del i-ésimo espejo de su abuelo
        const abuID = n.chartParent;
        let abuMirrors = [];
        if (abuID && map[abuID]) {
          abuMirrors = map[abuID].mirrors || [];
        }
        const chartParForMirror = abuMirrors[i] || n.id;
        dataArray.push([ m, chartParForMirror, '' ]);
      });
    });

    // 10) Pintamos con Google OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data  = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: '+err.message;
  }
}

// Arrancamos + refrescamos cada 30s
drawChart();
setInterval(drawChart, 30*1000);

