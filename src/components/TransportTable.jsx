export default function TransportTable({
  table,
  highlight,
  cycle,
  rowLabels,
  colLabels,
  rowTotals,
  colTotals,
  cornerLabel,
}) {
  const hasRowLabels = Array.isArray(rowLabels) && rowLabels.length > 0;
  const hasColLabels = Array.isArray(colLabels) && colLabels.length > 0;

  return (
    <table className="border border-slate-600 text-sm text-slate-100 bg-slate-900/60 rounded-lg overflow-hidden">
      <tbody>
        {hasColLabels && (
          <tr>
            {hasRowLabels && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-slate-200">
                {cornerLabel ?? ""}
              </td>
            )}
            {colLabels.map((lab, j) => (
              <td
                key={j}
                className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-slate-200"
              >
                {lab}
              </td>
            ))}
            {rowTotals && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-rose-200"></td>
            )}
          </tr>
        )}

        {table.map((r, i) => (
          <tr key={i}>
            {hasRowLabels && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-slate-200">
                {rowLabels[i] ?? ""}
              </td>
            )}
            {r.map((c, j) => {
              let style =
                "w-16 h-16 border border-slate-700 text-center align-middle transition-all duration-500";

              if (highlight?.some((x) => x.row === i && x.col === j))
                style += " bg-amber-400 text-slate-900";

              if (cycle?.some((x) => x.row === i && x.col === j))
                style += " bg-emerald-500 text-white";

              return (
                <td key={j} className={style}>
                  {c === "EPS" ? "ε" : c}
                </td>
              );
            })}

            {rowTotals && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-rose-200">
                {rowTotals[i] ?? ""}
              </td>
            )}
          </tr>
        ))}

        {colTotals && (
          <tr>
            {hasRowLabels && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-rose-200"></td>
            )}
            {colTotals.map((v, j) => (
              <td
                key={j}
                className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 font-semibold text-rose-200"
              >
                {v ?? ""}
              </td>
            ))}
            {rowTotals && (
              <td className="w-16 h-16 border border-slate-700 text-center align-middle bg-slate-950/40 text-slate-400 text-xs">
                {cornerLabel ?? ""}
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
}
