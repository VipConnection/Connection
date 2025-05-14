    dataRows.map(r => {
      const idKey    = r[idxUser];                // p.ej. "4716"
      const parent   = r[idxParentChart] || '';   // p.ej. "4711"
      const nombre   = nameMap[idKey] || '';      // p.ej. "Aaron Pérez"

      // construimos el HTML que irá COMO LABEL del nodo:
      const labelHtml = `
        <div style="white-space:nowrap;text-align:center">
          <strong>${idKey}</strong><br>
          ${nombre}
        </div>
      `;

      // OrgChart interpreta columna 0 como contenido del nodo,
      // columna 1 el parent, y columna 2 el tooltip al pasar el ratón.
      return [ labelHtml, parent, nombre ];
    })

