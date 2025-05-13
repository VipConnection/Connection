// script.js
google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetName = 'UsusariosDiamond';

  // 1) Forzamos SELECT A→L en el query
  const query = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L OFFSET 1';
  const queryUrl =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`
    + `?sheet=${encodeURIComponent(sheetName)}`
    + `&tq=${encodeURIComponent(query)}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 2) Fetch + parse
    console.log('fetching:', queryUrl);
    const res  = await fetch(queryUrl);
    const txt  = await res.text();
    const json = JSON.parse(
      txt.slice(txt.indexOf('(')+1, txt.lastIndexOf(')'))
    );

    // 3) Columns & rows
    const cols = json.table.cols.map(c=>c.label);
    const rows = json.table.rows.map(r =>
      r.c.map(cell => cell && cell.v!==null ? cell.v : '')
    );
    console.log(`✅ DataTable columns: ${cols.length}, rows: ${rows.length}`);

    // 4) Montamos el mapa id→node
    const map = new Map();
    rows.forEach(r => {
      const id      = String(r[1]);
      const parent  = String(r[2]);
      // mirrors vendrán en r[3]..r[11] (9 espejos)
      const mirrors = r.slice(3,12).map(String).filter(x=>x!=='');
      map.set(id, { id, parent, mirrors });
    });

    // 5) Prepara filas de salida
    const output = [['UserID','ParentID','isMirror','Nivel','ParentForChart']];

    // 5a) Nodos “raíz” (sin parent en el mapa)
    map.forEach(node => {
      if (!map.has(node.parent)) {
        output.push([node.id,'',false,0,'']);
      }
    });

    // 5b) Nodos “normales” (con parent)
    map.forEach(node => {
      if (map.has(node.parent)) {
        output.push([node.id,node.parent,false,0,node.parent]);
      }
    });

    // 5c) Espejos: cada mirror bajo el espejo correspondiente del abuelo
    map.forEach(node => {
      node.mirrors.forEach((mId, idx) => {
        // parentMirrors = los mirrors del padre (el abuelo de este espejo)
        const pm = map.get(node.parent)?.mirrors || [];
        // chartParent: espejo idx del abuelo, o si no, el parent normal
        const chartParent = pm[idx] || node.parent;
        output.push([mId, node.id, true, 1, chartParent]);
      });
    });

    // 6) Dibuja el orgchart
    const data = new google.visualization.DataTable();
    data.addColumn('string','UserID');
    data.addColumn('string','ParentID');
    data.addColumn('boolean','isMirror');
    data.addColumn('number','Nivel');
    data.addColumn('string','ParentForChart');
    data.addRows(output.slice(1));

    new google.visualization.OrgChart(chartDiv)
      .draw(data,{allowHtml:true,nodeClass:'org-node'});

    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}
