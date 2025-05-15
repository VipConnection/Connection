// script.js

// 1) URL de tu pestaña UsuariosDiamond (gid=0)
const CSV_URL = 
  "https://docs.google.com/spreadsheets/d/" +
  "1p6hq4WWXzwUQfU3DqWsp1H50BWHqS93sQIPioNy9Cbs" +
  "/export?format=csv&gid=0";

async function drawChart() {
  var errorDiv  = document.getElementById("error");
  var container = document.getElementById("gráfico_div");
  errorDiv.textContent = "Cargando datos…";

  try {
    // 2) Fetch + parse CSV
    var resp = await fetch(CSV_URL);
    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }
    var text = await resp.text();
    var rows = text
      .trim()
      .split(/\r?\n/)
      .map(function(line) {
        return line
          .split(",")
          .map(function(cell) {
            return cell.replace(/^"|"$/g, "").trim();
          });
      });

    // 3) Encabezados e índices
    var headers      = rows.shift();
    var idxUser      = headers.indexOf("UserID");
    var idxParentFor = headers.indexOf("ParentForChart");
    var idxMirror    = headers.indexOf("isMirror");
    var idxName      = headers.indexOf("Nombre");
    var idxSurname   = headers.indexOf("Apellidos");
    if (
      idxUser < 0 ||
      idxParentFor < 0 ||
      idxMirror < 0 ||
      idxName < 0 ||
      idxSurname < 0
    ) {
      throw new Error("Faltan columnas clave en CSV");
    }

    // 4) Montamos el array que pide OrgChart
    var dataArray = [["id", "parent", "tooltip"]];
    rows.forEach(function(r) {
      var id = r[idxUser];
      if (!id) {
        return;
      }
      // ← El único cambio: parent sale de ParentForChart
      var parent   = r[idxParentFor] || "";
      var isMirror = (r[idxMirror] || "").toLowerCase() === "true";
      var name     = r[idxName]    || "";
      var surname  = r[idxSurname] || "";

      if (!isMirror) {
        // nodo “real”
        var label = 
          "<div style=\"text-align:center;white-space:nowrap\">" +
            id + "<br>" +
            "<small>" + name + " " + surname + "</small>" +
          "</div>";
        dataArray.push([ { v: id, f: label }, parent, "" ]);
      } else {
        // espejo
        dataArray.push([ id, parent, "" ]);
      }
    });

    // 5) Dibujamos con Google OrgChart
    google.charts.load("current", { packages: ["orgchart"] });
    google.charts.setOnLoadCallback(function() {
      var data  = google.visualization.arrayToDataTable(dataArray);
      var chart = new google.visualization.OrgChart(container);
      chart.draw(data, { allowHtml: true });
      errorDiv.textContent = "";
    });

  } catch (err) {
    console.error(err);
    errorDiv.textContent = "Error cargando datos: " + err.message;
  }
}

// Arranca y refresca cada 30 s
drawChart();
setInterval(drawChart, 30 * 1000);
