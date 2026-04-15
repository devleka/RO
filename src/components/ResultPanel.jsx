import TransportTable from "./TransportTable";

export default function ResultPanel({ solution, cost, onReset }) {
  const rowLabels = Array.from({ length: solution.length }, (_, k) =>
    String.fromCharCode(65 + k),
  );
  const colLabels = Array.from(
    { length: solution[0]?.length ?? 0 },
    (_, k) => String(k + 1),
  );

  return (
    <div>
      <div className="h-full p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-sky-300">Solution Optimale</h2>
          {onReset && (
            <button
              className="px-4 py-1.5 rounded-lg border border-slate-600 text-sm text-slate-100 hover:bg-slate-700/60 transition"
              onClick={onReset}
            >
              ← Nouveau calcul
            </button>
          )}
        </div>
        
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-lg font-bold text-emerald-300">
            Coût Minimal Z = <span className="text-2xl">{cost}</span>
          </p>
        </div>

        <TransportTable 
          table={solution} 
          rowLabels={rowLabels} 
          colLabels={colLabels} 
        />
      </div>
    </div>
  );
}
