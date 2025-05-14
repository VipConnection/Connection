// script.js

// URL CSV de UsuariosDiamond (gid=0)
const CSV_URL_USERS =
  'https://docs.google.com/spreadsheets/d/1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs/export?format=csv&gid=0';

async function drawChart() {
  const errorDiv  = document.getElementById('error');
  const container = document.getElementById('gráfico_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Fetch CSV
    const resp = await fetch(CSV_URL_USERS);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} al leer UsuariosDiamond`);
    const txt = await resp.text();
    const rows = txt
      .trim()
      .split(/\r?\n/)
      .map(r=>r.split(',').map(c=>c.replace(/^"|"$/g,'').trim()));

    // 2) Cabecera y detección de índices
    const headers = rows.shift();
    const idxLabel  = headers.indexOf('LabelHTML');
    const idxParent = headers.indexOf('ParentForChart');
    if (idxLabel<0||idxParent<0) {
      throw new Error('Faltan LabelHTML o ParentForChart en UsuariosDiamond');
    }

    // 3) Construimos DataTable
    google.charts.load('current',{packages:['orgchart']});
    google.charts.setOnLoadCallback(()=>{
      const data = new google.visualization.DataTable();
      data.addColumn('string','Name');
      data.addColumn('string','Parent');
      // llenamos filas
      rows.forEach(r=>{
        const label  = r[idxLabel];
        const parent = r[idxParent] || '';
        data.addRow([ { v: '', f: label }, parent ]);
      });
      // 4) Dibujamos
      const chart = new google.visualization.OrgChart(container);
      chart.draw(data,{allowHtml:true});
      errorDiv.textContent = '';
    });

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: '+err.message;
  }
}

// arrancamos
drawChart();

