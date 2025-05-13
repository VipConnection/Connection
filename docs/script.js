// script.js
google.charts.load('current',{packages:['orgchart']});
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';
  const sheetName = 'UsuariosDiamond';
  const queryUrl  =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`
    + `?sheet=${encodeURIComponent(sheetName)}`
    + `&tq=${encodeURIComponent('SELECT * OFFSET 1')}`;

  const errorDiv = document.getElementById('error');
  const chartDiv = document.getElementById('chart_div');
  errorDiv.textContent = 'Cargando datos…';

  try {
    // 1) Fetch y parseamos el JSON “gviz”
    const res  = await fetch(queryUrl);
    const txt  = await res.text();
    // el payload está envuelto en: /*O_o*/\ngoogle.visualization.Query.setResponse(...)
    const json = JSON.parse(
      txt
        .slice(txt.indexOf('(')+1, txt.lastIndexOf(')'))
    );

    // 2) Extraemos filas y columnas
    const cols = json.table.cols.map(c=>c.label);
    const rows = json.table.rows.map(r =>
      r.c.map(cell => cell ? cell.v : '')
    );

    // 3) Montamos el mapa de nodos
    // Cada nodo: { id, parent, mirrors: [m1…m9], level, chartParent }
    const map = new Map();
    rows.forEach(r => {
      const id          = String(r[1]);     // En “Tu propio ID”
      const parent      = String(r[2]);     // En “ID de quien te invita”
      const mirrors     = r.slice(3, 12)    // Columnas D→L
                            .map(String)
                            .filter(x=>x!=='');
      map.set(id, {
        id,
        parent,
        mirrors,
        // level= 0 si es raíz, 1 si tiene espejo
        level: mirrors.length>0 ? 1 : 0,
      });
    });

    // 4) Generamos el array para el OrgChart
    // Empezamos por la cabecera
    const output = [['UserID','ParentID','isMirror','Nivel','ParentForChart']];

    // 4.1) Añadimos los nodos “normales” (no espejos), en orden raíz→hojas
    //    (primero los que su parent no existe en el map = raíces)
    map.forEach(node => {
      if (!map.has(node.parent)) {
        output.push([node.id, '', false, 0, '']);
      }
    });
    map.forEach(node => {
      if (map.has(node.parent)) {
        output.push([node.id, node.parent, false, 0, node.parent]);
      }
    });

    // 4.2) Ahora añadimos los **espejos** de cada nodo, uno a uno,
    //      colocándolos bajo su “abuelo” espejo correspondiente.
    map.forEach(node => {
      // si no hay mirrors, ignoramos
      if (!node.mirrors.length) return;

      // localizamos la fila de su padre en output:
      // buscamos el índice de la fila `[ parentID, … ]`
      const parentRowIndex =
        output.findIndex(r => r[0]===node.parent && r[2]===false);

      // si no encontramos, abortamos
      if (parentRowIndex<0) return;

      // para cada espejo, insertamos en output:
      node.mirrors.forEach((mId, idx) => {
        // calculamos “ParentForChart”:
        // si el padre tiene espejo en idx, lo usamos
        const padreMirrors = map.get(node.parent)?.mirrors || [];
        const chartParent  = padreMirrors[idx] || node.parent;

        output.push([
          mId,                       // UserID espejo
          node.id,                   // ParentID = nodo original
          true,                      // isMirror
          1,                         // Nivel espejo
          chartParent                // ParentForChart
        ]);
      });
    });

    // 5) Dibujamos el OrgChart
    const data = new google.visualization.DataTable();
    data.addColumn('string','UserID');
    data.addColumn('string','ParentID');
    data.addColumn('boolean','isMirror');
    data.addColumn('number','Nivel');
    data.addColumn('string','ParentForChart');

    data.addRows(output.slice(1));
    const chart = new google.visualization.OrgChart(chartDiv);
    chart.draw(data, { allowHtml:true, nodeClass:'org-node' });

    errorDiv.textContent = '';

  } catch(err) {
    console.error(err);
    errorDiv.textContent = 'Error cargando datos: ' + err.message;
  }
}
