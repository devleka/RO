export default function TransportTable({
  table,
  highlight,
  cycle,
  rowLabels,
  colLabels,
  rowTotals,
  colTotals,
  cornerLabel,
  thetaDisplay,
}) {
  const hasRowLabels = Array.isArray(rowLabels) && rowLabels.length > 0;
  const hasColLabels = Array.isArray(colLabels) && colLabels.length > 0;

  // Build a map of cycle cell positions for quick lookup
  const cycleMap = new Map();
  if (cycle && cycle.length > 0) {
    cycle.forEach((pos, idx) => {
      const key = `${pos.row}-${pos.col}`;
      cycleMap.set(key, { sign: idx % 2 === 0 ? '+' : '-', index: idx });
    });
  }

  return (
    <table className="border-collapse rounded-xl overflow-hidden border border-slate-700/50 text-sm text-slate-100">
      <tbody>
        {hasColLabels && (
          <tr>
            {hasRowLabels && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 font-bold text-xs text-slate-400">
                {cornerLabel ?? ""}
              </td>
            )}
            {colLabels.map((lab, j) => (
              <td
                key={j}
                className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 font-bold text-xs text-slate-300"
              >
                {lab}
              </td>
            ))}
            {rowTotals && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 font-bold text-xs text-amber-400/70">
                Σ
              </td>
            )}
          </tr>
        )}

        {table.map((r, i) => (
          <tr key={i}>
            {hasRowLabels && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 font-bold text-xs text-slate-300">
                {rowLabels[i] ?? ""}
              </td>
            )}
            {r.map((c, j) => {
              const isHighlighted = highlight?.some((x) => x.row === i && x.col === j);
              const cycleInfo = cycleMap.get(`${i}-${j}`);
              const isCycle = !!cycleInfo;
              const isBasic = c !== 0 && c !== "" && c != null;

              let cellClass =
                "w-14 h-12 border border-slate-700/40 text-center align-middle transition-all duration-300 text-sm relative";

              if (isHighlighted && !isCycle) {
                cellClass += " bg-amber-500/20 text-amber-200 font-bold ring-1 ring-amber-500/40";
              } else if (isCycle) {
                const isPlus = cycleInfo.sign === '+';
                cellClass += isPlus
                  ? " bg-emerald-500/15 text-emerald-200 font-bold ring-1 ring-emerald-500/30"
                  : " bg-rose-500/15 text-rose-200 font-bold ring-1 ring-rose-500/30";
              } else if (isBasic) {
                cellClass += " bg-sky-500/5 text-sky-200 font-semibold";
              } else {
                cellClass += " bg-slate-800/30 text-slate-500";
              }

              return (
                <td key={j} className={cellClass}>
                  {c === "EPS" ? "ε" : c}
                  {isCycle && thetaDisplay && (
                    <span className={`absolute top-0.5 right-0.5 text-[9px] leading-none font-bold px-1 py-0.5 rounded ${
                      cycleInfo.sign === '+'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/30 text-rose-300'
                    }`}>
                      {cycleInfo.sign}{thetaDisplay}
                    </span>
                  )}
                </td>
              );
            })}

            {rowTotals && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/60 font-semibold text-xs text-amber-300/80">
                {rowTotals[i] ?? ""}
              </td>
            )}
          </tr>
        ))}

        {colTotals && (
          <tr>
            {hasRowLabels && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 font-bold text-xs text-emerald-400/70">
                Σ
              </td>
            )}
            {colTotals.map((v, j) => (
              <td
                key={j}
                className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/60 font-semibold text-xs text-emerald-300/80"
              >
                {v ?? ""}
              </td>
            ))}
            {rowTotals && (
              <td className="w-14 h-12 border border-slate-700/40 text-center align-middle bg-slate-900/80 text-slate-500 text-xs">
                {cornerLabel ?? ""}
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
}
