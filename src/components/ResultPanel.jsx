import TransportTable from "./TransportTable";

export default function ResultPanel({ basicSolution, optimalSolution, cost, onReset }) {
  const makeLabels = (matrix) => ({
    rowLabels: Array.from({ length: matrix.length }, (_, k) =>
      String.fromCharCode(65 + k),
    ),
    colLabels: Array.from(
      { length: matrix[0]?.length ?? 0 },
      (_, k) => String(k + 1),
    ),
  });

  const basicLabels = makeLabels(basicSolution);
  const optimalLabels = makeLabels(optimalSolution);

  // Check if basic and optimal are identical (no improvement needed)
  const isAlreadyOptimal = JSON.stringify(basicSolution) === JSON.stringify(optimalSolution);

  return (
    <div className="space-y-6">
      {/* Result Card */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/40 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Résultats
          </h2>
          {onReset && (
            <button
              className="px-3 py-2 rounded-lg border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-600 transition-all duration-200"
              onClick={onReset}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Nouveau calcul
              </span>
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Cost Display */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-emerald-900/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-400/70 font-semibold mb-1">
                  Coût total minimal
                </p>
                <p className="text-3xl font-bold text-emerald-300">
                  Z = {cost}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {isAlreadyOptimal && (
              <p className="text-xs text-emerald-400/80 mt-2">
                La solution de base est déjà optimale (aucune amélioration Stepping-Stone nécessaire).
              </p>
            )}
          </div>

          {/* Two Tables side by side on large screens, stacked on small */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Solution Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Solution de base (MINITAB)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Solution initiale obtenue par la méthode MINITAB
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30 p-3">
                <TransportTable
                  table={basicSolution}
                  rowLabels={basicLabels.rowLabels}
                  colLabels={basicLabels.colLabels}
                />
              </div>
            </div>

            {/* Optimal Solution Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Solution optimale (Stepping-Stone)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Solution finale après optimisation Stepping-Stone
              </p>
              <div className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3">
                <TransportTable
                  table={optimalSolution}
                  rowLabels={optimalLabels.rowLabels}
                  colLabels={optimalLabels.colLabels}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
