// script.js
google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetName = 'Respuestas Diamond';

  // <-- Aquí es donde agregamos "&range=A1:L"
  const queryUrl  =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`
    + `?sheet=${encodeURIComponent(sheetName)}`
    + `&range=${encodeURIComponent('A1:L')}`
    + `&tq=${encodeURIComponent('SELECT * OFFSET 1')}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Fetch + parse gviz
    console.log('fetching:', queryUrl);
    const res  = await fetch(queryUrl);
    const txt  = await res.text();
    const json = JSON.parse(
      txt.slice(txt.indexOf('(')+1, txt.lastIndexOf(')'))
    );

    // 2) Extract cols/rows
    const cols = json.table.cols.map(c=>c.label);
    const rows = json.table.rows.map(r =>
      r.c.map(cell => cell ? cell.v : '')
    );
    console.log('✅ Response OK – DataTable columns:', cols.length, 'rows:', rows.length);

    // 3) Build id→node map
    const map = new Map();
    rows.forEach(r => {
      const id      = String(r[1]);
      const parent  = String(r[2]);
      const mirrors = r.slice(3,12).map(String).filter(x=>x!=='');
      map.set(id, { id, parent, mirrors, level: mirrors.length>0 ? 1 : 0 });
    });

    // 4) Build output array
    const output = [['UserID','ParentID','isMirror','Nivel','ParentForChart']];

    // 4.1) nodos “normales”
    map.forEach(node => {
      if (!map.has(node.parent)) {
        output.push([node.id,'',false,0,'']);
      }
    });
    map.forEach(node => {
      if (map.has(node.parent)) {
        output.push([node.id,node.parent,false,0,node.parent]);
      }
    });

    // 4.2) espejos bajo el espejo correspondiente del abuelo
    map.forEach(node => {
      if (!node.mirrors.length) return;
      // fila del padre original en output
      const pr = output.findIndex(r => r[0]===node.parent && r[2]===false);
      if (pr<0) return;
      node.mirrors.forEach((mId, idx) => {
        const padreMirrors = map.get(node.parent)?.mirrors || [];
        const chartParent  = padreMirrors[idx] || node.parent;
        output.push([ mId, node.id, true, 1, chartParent ]);
      });
    });

    // 5) Dibujo
    const data = new google.visualization.DataTable();
    data.addColumn('string','UserID');
    data.addColumn('string','ParentID');
    data.addColumn('boolean','isMirror');
    data.addColumn('number','Nivel');
    data.addColumn('string','ParentForChart');
    data.addRows(output.slice(1));

    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(data,{allowHtml:true,nodeClass:'org-node'});
    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}
