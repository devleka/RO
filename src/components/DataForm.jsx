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

export default function DataForm({ value, onChange, onSolve, editMode, onClose }) {
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
        `Problème non équilibré: Σ(offres)=${sumSupply} ≠ Σ(demandes)=${sumDemand}.`,
      );
    }

    setErrors(nextErrors);
    if (nextErrors.length === 0) onSolve(parsed);
  }

  return (
    <form
      onSubmit={validateAndSolve}
      className="space-y-6"
    >
      {/* Card: Problem Definition */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`${editMode ? 'text-base' : 'text-lg'} font-semibold text-slate-100 flex items-center gap-2`}>
                {editMode ? (
                  <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                {editMode ? 'Modification des données' : 'Données du problème'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {editMode
                  ? 'Modifiez les valeurs puis cliquez sur Recalculer'
                  : 'Définissez les coûts de transport, les offres et les demandes'}
              </p>
            </div>

            {/* Size Controls — hidden in edit mode */}
            {!editMode && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50">
                  <label className="text-xs text-slate-400 whitespace-nowrap">Sources</label>
                  <input
                    className="w-12 text-center rounded-md bg-slate-800 border border-slate-600 px-1 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition"
                    value={m}
                    onChange={(e) => updateSize(e.target.value, n)}
                    type="number"
                    min="1"
                    max="12"
                  />
                </div>
                <span className="text-slate-600 text-xs">×</span>
                <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50">
                  <label className="text-xs text-slate-400 whitespace-nowrap">Destinations</label>
                  <input
                    className="w-12 text-center rounded-md bg-slate-800 border border-slate-600 px-1 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60 transition"
                    value={n}
                    onChange={(e) => updateSize(m, e.target.value)}
                    type="number"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Matrix */}
        <div className="px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Matrice des coûts
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full border-collapse">
              <tbody>
                {/* Column headers */}
                <tr>
                  <td className="w-12 bg-slate-900/70 border border-slate-700/40" />
                  {ui.costs[0]?.map((_, j) => (
                    <td
                      key={j}
                      className="bg-slate-900/70 border border-slate-700/40 px-1 py-2.5 text-center text-xs font-bold text-slate-300"
                    >
                      {j + 1}
                    </td>
                  ))}
                  <td className="bg-slate-900/70 border border-slate-700/40 px-1 py-2.5 text-center text-xs font-bold text-amber-400/80">
                    Offre
                  </td>
                </tr>

                {/* Data rows */}
                {ui.costs.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"}>
                    <td className="bg-slate-900/70 border border-slate-700/40 px-1 py-2 text-center text-xs font-bold text-slate-300">
                      {String.fromCharCode(65 + i)}
                    </td>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-slate-700/40 p-1">
                        <input
                          className="w-full h-10 text-center rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 hover:border-slate-600 transition"
                          value={cell}
                          onChange={(e) => updateCost(i, j, e.target.value)}
                          inputMode="decimal"
                        />
                      </td>
                    ))}
                    <td className="border border-slate-700/40 p-1 bg-amber-950/10">
                      <input
                        className="w-full h-10 text-center rounded-md bg-slate-900/50 border border-amber-700/40 text-amber-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:border-amber-600/50 transition"
                        value={ui.supply[i] ?? ""}
                        onChange={(e) => updateSupply(i, e.target.value)}
                        inputMode="decimal"
                        title="Offre (supply)"
                      />
                    </td>
                  </tr>
                ))}

                {/* Demand row */}
                <tr className="bg-emerald-950/10">
                  <td className="bg-slate-900/70 border border-slate-700/40 px-1 py-2 text-center text-xs font-bold text-emerald-400/80">
                    Dem.
                  </td>
                  {ui.demand.map((v, j) => (
                    <td key={j} className="border border-slate-700/40 p-1">
                      <input
                        className="w-full h-10 text-center rounded-md bg-slate-900/50 border border-emerald-700/40 text-emerald-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-emerald-600/50 transition"
                        value={v ?? ""}
                        onChange={(e) => updateDemand(j, e.target.value)}
                        inputMode="decimal"
                        title="Demande (demand)"
                      />
                    </td>
                  ))}
                  <td className="border border-slate-700/40 bg-slate-900/70 px-1 text-center text-xs text-slate-500 font-medium">
                    Σ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
{/* 
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400/60" />
              Offre (supply) par source
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400/60" />
              Demande (demand) par destination
            </span>
          </div> */}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-6 mb-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <ul className="space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx} className="text-sm text-rose-200">{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between gap-3">
          {editMode ? (
            <>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-600/60 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500 transition-all duration-200"
                onClick={onClose}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recalculer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-slate-600/60 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500 transition-all duration-200"
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
                Charger exemple
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Résoudre
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
