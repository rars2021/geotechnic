// Geotechnic · juez · un hilo de juzgarConjuntoHilos (juez/fisica.mjs). Arma el ciclo con el mismo montaje y paso que
// el principal, manda su firma (el principal la compara con la suya) y juzga los tramos [desde, hasta) que le dan.
import { parentPort, workerData } from "node:worker_threads";
import { contextoConjunto, tramoConjunto, firmaCiclo } from "./fisica.mjs";

try {
  const P = (await import(workerData.modulo)).pruebas(workerData.paso);
  const ctx = contextoConjunto(P.maquinas, { tol: workerData.tol || undefined, max: workerData.max });
  parentPort.on("message", (m) => {
    if (m.fin) return parentPort.close();
    try { parentPort.postMessage({ parte: tramoConjunto(ctx, P.ciclo, m.desde, m.hasta, P.terreno || null) }); }
    catch (e) { parentPort.postMessage({ error: String(e?.stack || e) }); }
  });
  parentPort.postMessage({ firma: firmaCiclo(P.ciclo, P.maquinas) });
} catch (e) { parentPort.postMessage({ error: String(e?.stack || e) }); }
