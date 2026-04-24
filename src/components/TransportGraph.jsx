import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

export default function TransportGraph({ allocation, costs, u, v }) {
  const ref = useRef();

  const dims = useMemo(() => {
    const sources = allocation?.length ?? 0;
    const dest = allocation?.[0]?.length ?? 0;
    const maxNodes = Math.max(sources, dest, 1);

    const w = 520;
    const topY = 50;
    const stepY = 80;
    const bottomPadding = 50;
    const h = topY + (maxNodes - 1) * stepY + bottomPadding;

    return { w, h };
  }, [allocation]);

  useEffect(() => {
    if (!allocation?.length || !allocation?.[0]?.length) return;

    const svg = d3.select(ref.current);

    svg.selectAll("*").remove();

    const w = dims.w;
    const h = dims.h;

    const sources = allocation.length;
    const dest = allocation[0].length;

    // Check if costs matrix is provided, otherwise use allocation for display but warn
    const displayValues = costs || allocation;

    // Marges augmentées pour inclure les labels (A,B,C...) et (1,2,3...)
    const leftX = 90;
    const rightX = w - 90;
    const topY = 50;
    const stepY = 80;

    svg.attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`);

    const labelStyle = {
      fill: "#e2e8f0",
      "font-size": 12,
      "font-family":
        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    };

    for (let i = 0; i < sources; i++) {
      svg
        .append("circle")
        .attr("cx", leftX)
        .attr("cy", topY + i * stepY)
        .attr("r", 10);

      // Label de la source (A, B, C...)
      svg
        .append("text")
        .attr("x", leftX - 22)
        .attr("y", topY + i * stepY + 4)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", labelStyle.fill)
        .attr("font-size", labelStyle["font-size"])
        .attr("font-family", labelStyle["font-family"])
        .text(String.fromCharCode(65 + i));

      // Afficher le potentiel u si disponible
      if (u && u[i] !== undefined) {
        svg
          .append("text")
          .attr("x", leftX - 22)
          .attr("y", topY + i * stepY - 12)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#38bdf8")
          .attr("font-size", 10)
          .attr("font-family", labelStyle["font-family"])
          .attr("font-style", "italic")
          .text(`u=${Number(u[i]).toFixed(0)}`);
      }
    }

    for (let j = 0; j < dest; j++) {
      svg
        .append("circle")
        .attr("cx", rightX)
        .attr("cy", topY + j * stepY)
        .attr("r", 10);

      // Label de la destination (1, 2, 3...)
      svg
        .append("text")
        .attr("x", rightX + 22)
        .attr("y", topY + j * stepY + 4)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", labelStyle.fill)
        .attr("font-size", labelStyle["font-size"])
        .attr("font-family", labelStyle["font-family"])
        .text(String(j + 1));

      // Afficher le potentiel v si disponible
      if (v && v[j] !== undefined) {
        svg
          .append("text")
          .attr("x", rightX + 22)
          .attr("y", topY + j * stepY - 12)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#38bdf8")
          .attr("font-size", 10)
          .attr("font-family", labelStyle["font-family"])
          .attr("font-style", "italic")
          .text(`v=${Number(v[j]).toFixed(0)}`);
      }
    }

    for (let i = 0; i < sources; i++) {
      for (let j = 0; j < dest; j++) {
        let allocValue = allocation[i][j];

        if (allocValue === "EPS" || allocValue > 0) {
          const x1 = leftX + 10;
          const y1 = topY + i * stepY;
          const x2 = rightX - 10;
          const y2 = topY + j * stepY;

          // Calculate midpoint for label positioning
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          // Calculate angle for perpendicular offset
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const offset = 8; // Perpendicular offset in pixels

          // Offset label position perpendicular to line to avoid overlap
          const labelX = midX - offset * Math.sin(angle);
          const labelY = midY + offset * Math.cos(angle);

          svg
            .append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke-width", allocValue === "EPS" ? 2 : Math.min(allocValue / 5, 8))
            .attr("stroke-dasharray", allocValue === "EPS" ? "4,4" : "0") // Line width based on allocation
            .attr("stroke", "#38bdf8")
            .attr("stroke-linecap", "round")
            .attr("opacity", 0.9);

          svg
            .append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#93c5fd")
            .attr("font-size", 11)
            .attr("font-family", labelStyle["font-family"])
            .attr("font-weight", "bold")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 0.5)
            .attr("paint-order", "stroke")
            .text(allocValue === "EPS" ? "ε" : displayValues[i][j]);
        }
      }
    }
  }, [allocation, dims.w, dims.h]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={ref} width={dims.w} height={dims.h} />
    </div>
  );
}
