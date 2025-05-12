// 1) Carga OrgChart de Google
google.charts.load('current', { packages: ['orgchart'] });
google.charts.setOnLoadCallback(drawChart);

async function drawChart() {
  console.log('🔔 drawChart arrancó');

  // 2) Sustituye aquí con tu hoja y pestaña “Usuarios”
  const sheetId  = '1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs';   // p.ej. '1Cohw3JDwd_zAFHnfzc3GqAEO0utQEnP7XB9dzD0mzx4'
  const sheetGid = '0';             // p.ej. '0'

  // 3) URL de export CSV
  const csvUrl   = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
  const errorDiv = document.getElementById('error');

  try {
    // 4) Descarga y parsea CSV
    const res  = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // 5) Convierte a array de filas y columnas
    const rowsAll = text
      .trim()
      .split(/\r?\n/)
      .map(r => r.split(','));
    const headers = rowsAll.shift();

    // 6) Índices de columnas
    const idxUser   = headers.indexOf('UserID');
    const idxParent = headers.indexOf('ParentID');
    const idxMirror = headers.indexOf('isMirror');
    if (idxUser < 0 || idxParent < 0 || idxMirror < 0) {
      throw new Error(`No encontré UserID, ParentID o isMirror en: ${headers.join(',')}`);
    }

    // 7) Agrupa espejos por su invitador original
    const mirrorMap = {};
    rowsAll.forEach(r => {
      if (r[idxMirror] === 'TRUE') {
        const inviter = r[idxParent];
        mirrorMap[inviter] = mirrorMap[inviter] || [];
        mirrorMap[inviter].push(r[idxUser]);
      }
    });

    // 8) Construye las filas finales encadenando los espejos
    const finalRows = [];
    rowsAll.forEach(r => {
      const user    = r[idxUser];
      const inviter = r[idxParent];
      const isM     = r[idxMirror] === 'TRUE';

      // Solo procesamos cada usuario no-mirror una vez:
      if (!isM) {
        finalRows.push([ user, inviter || '' ]);

        // Si hay espejos de este usuario, los encadenamos
        const chain = mirrorMap[user];
        if (chain) {
          let prev = user;
          chain.forEach(m => {
            finalRows.push([ m, prev ]);
            prev = m;
          });
        }
      }
    });

    // 9) Crea y dibuja el OrgChart
    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Name');
    dataTable.addColumn('string', 'Manager');
    finalRows.forEach(pair => dataTable.addRow(pair));

    const chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    chart.draw(dataTable, { allowHtml: true });

    // 10) Limpia mensaje de error
    errorDiv.textContent = '';
  }
  catch (e) {
    console.error('Error completo:', e, e.stack);
    errorDiv.textContent =
      '❌ Error: ' + (e.message || e) + '\n\n' +
      (e.stack || JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
  }
}
