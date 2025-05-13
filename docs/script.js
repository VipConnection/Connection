// script.js

// 1) Carga de la librería y callback
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  const sheetId   = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';    // tu ID de spreadsheet
  const sheetName = 'RespuestasDiamond';                              // el nombre de tu pestaña

  // 2) Hacemos la query a Google Sheets
  const query = new google.visualization.Query(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}`
  );
  query.send(res => {
    if (res.isError()) {
      return showError(res.getMessage());
    }

    const dt       = res.getDataTable();
    const nCols    = dt.getNumberOfColumns();
    const nRows    = dt.getNumberOfRows();
    const headers  = [];
    for (let c = 0; c < nCols; c++) {
      headers.push(dt.getColumnLabel(c));
    }

    // 3) Detectar índices de ID y Parent
    const idxUser   = headers.indexOf('Tu propio ID');
    const idxParent = headers.indexOf('ID de quien te invita');
    if (idxUser < 0 || idxParent < 0) {
      return showError('Columnas “Tu propio ID” o “ID de quien te invita” no encontradas');
    }
    // 3b) Detectar índices de todos los “Espejo X”
    const mirrorCols = headers
      .map((h,i) => (typeof h==='string' && h.startsWith('Espejo')) ? i : -1)
      .filter(i => i >= 0);

    // 4) Extraer filas útiles
    const raw = [];
    for (let r = 0; r < nRows; r++) {
      const uid = dt.getValue(r, idxUser);
      const pid = dt.getValue(r, idxParent);
      if (uid != null && pid != null && String(uid).trim() && String(pid).trim()) {
        // recoger sus espejos
        const mirrors = mirrorCols
          .map(ci => dt.getValue(r, ci))
          .filter(v => v != null && String(v).trim());
        raw.push({ id: uid, parent: pid, mirrors });
      }
    }

    // 5) Construir mapa de nodos
    const map = {};
    raw.forEach(o => {
      map[o.id] = { ...o, level: null, chartParent: null, isMirror: false };
    });

    // 6) Recursión para asignar level y chartParent,
    //    y colgar cada espejo_i bajo el espejo_i del padre
    function setNode(id) {
      const node = map[id];
      if (!node || node.level !== null) return;  // sin nodo o ya procesado

      const p = map[node.parent];
      if (!p) {
        node.level       = 0;
        node.chartParent = '';
      } else {
        setNode(p.id);
        node.level       = p.level + 1;
        node.chartParent = p.id;
      }

      // procesar mirrors: espejo_i colgado de p.mirrors[i] o de p.id
      node.mirrors.forEach((m, i) => {
        const pm = (p && p.mirrors[i]) ? p.mirrors[i] : node.parent;
        map[m] = {
          id:           m,
          parent:       pm,
          mirrors:      [],      // no anidamos espejos de espejos
          level:        null,
          chartParent:  null,
          isMirror:     true
        };
        setNode(m);
      });
    }
    Object.keys(map).forEach(setNode);

    // 7) Preparar DataTable de salida
    const out = new google.visualization.DataTable();
    out.addColumn('string','Name');
    out.addColumn('string','Manager');
    out.addColumn('boolean','IsHtml');  // para allowHtml:true

    Object.values(map).forEach(n => {
      // la etiqueta que mostramos puede ser n.id o incluir más info
      out.addRow([ String(n.id), String(n.chartParent), false ]);
    });

    // 8) Dibujar OrgChart
    const chart = new google.visualization.OrgChart(
      document.getElementById('chart_div')
    );
    chart.draw(out, { allowHtml: true, size: 'medium' });
  });
}

function showError(msg) {
  const e = document.getElementById('error');
  if (e) e.textContent = 'Error cargando datos: ' + msg;
  else alert(msg);
}
