// Geotechnic · juez · fidelidad: cada medida del equipo contra su valor con fuente (el catálogo de fuentes + página).
// Bloquea solo con medidas CON fuente; las «estimado» se informan.

/** registro: EQUIPO_X (medidas, modelo, medir); M: el modelo ya armado. */
export function juzgarFidelidad(registro, M) {
  const med = registro.medir(M);
  const filas = registro.medidas.medidas.map((m) => {
    const v = med[m.id];
    if (v === undefined) return { ...m, medido: null, error: null, ok: !m.fuente, nota: "sin medidor en el modelo" };
    const error = (v - m.valor) / m.valor;
    const ok = Math.abs(error) <= m.tol + 1e-9;
    return { ...m, medido: v, error, ok: ok || !m.fuente, fuera: !ok };
  });
  const aprobado = filas.every((f) => f.ok);
  return { aprobado, filas, equipo: registro.medidas.equipo };
}

export function textoFidelidad(r) {
  const out = [`fidelidad · ${r.equipo}`];
  for (const f of r.filas) {
    const tipo = f.fuente ? `${f.fuente.autor} ${f.fuente.anio}` : "estimado";
    const est = f.medido === null ? "—" : `${f.medido.toFixed(3)} (${f.error >= 0 ? "+" : ""}${(f.error * 100).toFixed(1)} %)`;
    out.push(`${f.ok ? (f.fuera ? "aviso" : "ok   ") : "FALLA"} ${f.dato.padEnd(52)} ${String(f.valor).padStart(7)} ${f.unidad.padEnd(3)} → ${est.padEnd(22)} tol ±${(f.tol * 100).toFixed(0)} % · ${tipo}`);
  }
  out.push(r.aprobado ? "fidelidad aprobada" : "fidelidad reprobada");
  return out.join("\n");
}
