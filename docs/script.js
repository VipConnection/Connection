// script.js

// → URLs CSV
const URL_CSV = 'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=539807990';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Descarga y parse CSV
    const resp = await fetch(URL_CSV);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = text
      .trim()
      .split(/\r?\n/).map(r =>
        r.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      );

    // 2) Encabezados e índices
    const headers    = rows.shift();
    const idxUser    = headers.indexOf('UserID');
    const idxParent  = headers.indexOf('ParentID');
    const idxMirror  = headers.indexOf('isMirror');
    const idxLevel   = headers.indexOf('Level');
    const idxChart   = headers.indexOf('ParentForChart');
    const idxNombre  = headers.indexOf('Nombre');
    const idxApell   = headers.indexOf('Apellidos');
    if ([idxUser,idxParent,idxMirror,idxLevel,idxChart].some(i=>i<0)) {
      throw new Error('Faltan columnas clave en CSV');
    }
    // Nombre/Apellidos son extras opcionales, pero si existen los usamos
    const hasNombre = idxNombre>=0 && idxApell>=0;

    // 3) Construye mapa {id→node} para recursión espejos-abuelos
    const map = {};
    // leemos filas válidas
    rows.forEach(r=>{
      const id     = r[idxUser];
      const parent = r[idxParent];
      if (!id || !parent) return;
      const mirrors = headers
        .map((h,i)=>(h&&h.startsWith('Espejo')?r[i]:null))
        .filter(v=>v);
      map[id] = { id, parent, mirrors, level:null, chartParent:null };
    });

    // 4) recursión nivel/parentForChart
    function setNode(id) {
      const node = map[id];
      if (!node || node.level!==null) return;
      const p = map[node.parent];
      if (!p) {
        node.level = 0;
        node.chartParent = '';
      } else {
        setNode(node.parent);
        node.level       = p.level + 1;
        node.chartParent = node.parent;
      }
      // ahora sus mirrors
      node.mirrors.forEach((m,i)=>{
        if (!map[m]) {
          map[m] = { id:m, parent:id, mirrors:[], level:null, chartParent:null };
        }
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 5) Prepara dataArray: [ [label, parent, tooltip], ... ]
    //    Consolida ID real + mirrors, y aplica lógica abuelo para mirrors
    const dataArray = [
      ['User','Parent','Tooltip']
    ];
    Object.values(map).forEach(n=>{
      // — nodo real —
      let labelHtml = `${n.id}`;
      if (hasNombre) {
        // buscamos la fila original para extraer nombre y apellidos
        const fila = rows.find(r=>r[idxUser]===n.id);
        if (fila) {
          const nom = fila[idxNombre]||'';
          const ape = fila[idxApell]||'';
          labelHtml += `<br><small>${nom} ${ape}</small>`;
        }
      }
      dataArray.push([
        { v: n.id, f: `<div style="text-align:center;white-space:nowrap">${labelHtml}</div>` },
        n.chartParent || '',
        ''
      ]);

      // — cada espejo —
      n.mirrors.forEach((m,i)=>{
        const mn = map[m];
        // abuelo de este espejo:
        const abuID = n.chartParent;
        const abuMirrors = abuID && map[abuID]
          ? map[abuID].mirrors
          : [];
        // espejo correspondiente del abuelo o fallback al padre directo:
        const chartParForMirror = abuMirrors[i] || n.id;
        dataArray.push([
          m,
          chartParForMirror,
          ''
        ]);
      });
    });

    // 6) Dibuja con Google Charts OrgChart
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data = google.visualization.arrayToDataTable(dataArray);
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{ allowHtml:true });
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}

// arranca y refresca cada 30s
drawChart();
setInterval(drawChart,30*1000);
