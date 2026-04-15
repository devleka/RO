import { useMemo, useState } from "react";

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function toNumber(value) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function resizeMatrix(matrix, rows, cols, fillValue = "") {
  const next = Array.from({ length: rows }, (_, i) => {
    const row = Array.from(
      { length: cols },
      (_, j) => matrix?.[i]?.[j] ?? fillValue,
    );
    return row;
  });
  return next;
}

function resizeVector(vec, len, fillValue = "") {
  return Array.from({ length: len }, (_, i) => vec?.[i] ?? fillValue);
}

export default function DataForm({ value, onChange, onSolve }) {
  const [m, setM] = useState(value.costs.length);
  const [n, setN] = useState(value.costs[0]?.length ?? 1);

  const [errors, setErrors] = useState([]);

  const ui = useMemo(() => {
    const costs = resizeMatrix(value.costs, m, n, "");
    const supply = resizeVector(value.supply, m, "");
    const demand = resizeVector(value.demand, n, "");
    return { costs, supply, demand };
  }, [value, m, n]);

  function updateSize(nextM, nextN) {
    const nm = clampInt(nextM, 1, 12);
    const nn = clampInt(nextN, 1, 12);
    setM(nm);
    setN(nn);

    onChange({
      costs: resizeMatrix(value.costs, nm, nn, ""),
      supply: resizeVector(value.supply, nm, ""),
      demand: resizeVector(value.demand, nn, ""),
    });
  }

  function updateCost(i, j, v) {
    const next = ui.costs.map((row, ri) =>
      row.map((cell, cj) => (ri === i && cj === j ? v : cell)),
    );
    onChange({ ...value, costs: next });
  }

  function updateSupply(i, v) {
    const next = ui.supply.map((x, idx) => (idx === i ? v : x));
    onChange({ ...value, supply: next });
  }

  function updateDemand(j, v) {
    const next = ui.demand.map((x, idx) => (idx === j ? v : x));
    onChange({ ...value, demand: next });
  }

  function validateAndSolve(e) {
    e?.preventDefault?.();

    const parsed = {
      costs: ui.costs.map((r) => r.map(toNumber)),
      supply: ui.supply.map(toNumber),
      demand: ui.demand.map(toNumber),
    };

    const nextErrors = [];
    if (parsed.costs.length === 0 || parsed.costs[0].length === 0) {
      nextErrors.push("La matrice des coûts est vide.");
    }

    const sumSupply = parsed.supply.reduce((a, b) => a + b, 0);
    const sumDemand = parsed.demand.reduce((a, b) => a + b, 0);
    if (Math.abs(sumSupply - sumDemand) > 1e-9) {
      nextErrors.push(
        `Problème non équilibré: somme(offres)=${sumSupply} ≠ somme(demandes)=${sumDemand}.`,
      );
    }

    setErrors(nextErrors);
    if (nextErrors.length === 0) onSolve(parsed);
  }

  return (
    <form
      onSubmit={validateAndSolve}
      className="bg-slate-800/60 border border-slate-700 rounded-xl p-7 shadow-lg shadow-slate-950/50 space-y-4 w-full"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Données</h2>
          <p className="text-xs text-slate-300">
            Saisis coûts, offres, demandes. (Le problème doit être équilibré.)
          </p>
        </div>

        <div className="flex items-end gap-2">
          <label className="text-xs text-slate-300">
            Sources (m)
            <input
              className="mt-1 w-20 block rounded-lg bg-slate-900/60 border border-slate-700 px-2 py-1 text-slate-100 appearance-none hover:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition"
              value={m}
              onChange={(e) => updateSize(e.target.value, n)}
              type="number"
            />
          </label>
          <label className="text-xs text-slate-300">
            Destinations (n)
            <input
              className="mt-1 w-24 block rounded-lg bg-slate-900/60 border border-slate-700 px-2 py-1 text-slate-100 appearance-none hover:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition"
              value={n}
              onChange={(e) => updateSize(m, e.target.value)}
              type="number"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-200">
          Matrice des coûts (offres à droite, demandes en bas)
        </h3>
        <div className="overflow-auto">
          <table className="border border-collapse border-slate-600 bg-slate-900/60 rounded-lg overflow-hidden">
            <tbody>
              <tr>
                <td className="border-0 p-1 bg-slate-950/40 text-slate-300 text-xs font-semibold text-center w-10">
                  {/* coin */}
                </td>
                {ui.costs[0]?.map((_, j) => (
                  <td
                    key={j}
                    className="border-0 p-1 py-2.5 bg-slate-950/40 text-slate-200 text-xs font-semibold text-center"
                  >
                    {j + 1}
                  </td>
                ))}
                <td className="border-0 p-1 bg-slate-950/40 text-rose-200 text-xs font-semibold text-center"></td>
              </tr>

              {ui.costs.map((row, i) => (
                <tr key={i}>
                  <td className="border-0 p-1 bg-slate-950/40 text-slate-200 text-xs font-semibold text-center w-10">
                    {String.fromCharCode(65 + i)}
                  </td>
                  {row.map((cell, j) => (
                    <td key={j} className="border-0 p-1">
                      <input
                        className="w-16 h-10 text-center rounded-md bg-slate-950/60 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition"
                        value={cell}
                        onChange={(e) => updateCost(i, j, e.target.value)}
                        inputMode="decimal"
                      />
                    </td>
                  ))}

                  <td className="border-0 p-1 bg-slate-950/30">
                    <input
                      className="w-16 h-10 text-center rounded-md bg-slate-950/60 border border-slate-700 text-rose-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                      value={ui.supply[i] ?? ""}
                      onChange={(e) => updateSupply(i, e.target.value)}
                      inputMode="decimal"
                      title="Offre (supply)"
                    />
                  </td>
                </tr>
              ))}

              <tr>
                <td className="border-0 p-1 bg-slate-950/40 text-rose-200 text-xs font-semibold text-center w-10"></td>
                {ui.demand.map((v, j) => (
                  <td key={j} className="border-0 p-1 bg-slate-950/30">
                    <input
                      className="w-16 h-10 text-center rounded-md bg-slate-950/60 border border-slate-700 text-rose-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                      value={v ?? ""}
                      onChange={(e) => updateDemand(j, e.target.value)}
                      inputMode="decimal"
                      title="Demande (demand)"
                    />
                  </td>
                ))}
                <td className="border-0 p-1 bg-slate-950/40 text-slate-400 text-xs text-center">
                  Σ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-100">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm shadow-md shadow-blue-900/40 transition"
        >
          Lancer le calcul
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-100 hover:bg-slate-700/60 transition"
          onClick={() =>
            onChange({
              costs: [
                [24, 22, 61, 49, 83, 35],
                [23, 39, 78, 28, 65, 42],
                [67, 56, 92, 24, 53, 54],
                [71, 43, 91, 67, 40, 49],
              ].map((r) => r.map(String)),
              supply: [18, 32, 14, 9].map(String),
              demand: [9, 11, 28, 6, 14, 5].map(String),
            })
          }
        >
          Exemple
        </button>
      </div>
    </form>
  );
}
