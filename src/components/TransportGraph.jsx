import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

export default function TransportGraph({ allocation, costs, u, v }) {
  const ref = useRef();

  const dims = useMemo(() => {
    const sources = allocation?.length ?? 0;
    const dest = allocation?.[0]?.length ?? 0;
    const maxNodes = Math.max(sources, dest, 1);

    const w = 680;
    const topY = 50;
    const stepY = Math.max(70, Math.min(90, 400 / maxNodes));
    const bottomPadding = 40;
    const h = topY + (maxNodes - 1) * stepY + bottomPadding;

    return { w, h, stepY };
  }, [allocation]);

  useEffect(() => {
    if (!allocation?.length || !allocation?.[0]?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const w = dims.w;
    const h = dims.h;

    const sources = allocation.length;
    const dest = allocation[0].length;
    const displayValues = costs || allocation;

    const leftX = 120;
    const rightX = w - 120;
    const topY = 50;
    const stepY = dims.stepY;

    svg.attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`);

    const fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // --- Sources (left side) ---
    for (let i = 0; i < sources; i++) {
      const cy = topY + i * stepY;

      svg
        .append("circle")
        .attr("cx", leftX)
        .attr("cy", cy)
        .attr("r", 9)
        .attr("fill", "#0f172a")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 2);

      // Node label (A, B, C...) — to the left
      svg
        .append("text")
        .attr("x", leftX - 18)
        .attr("y", cy)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "central")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 13)
        .attr("font-weight", "bold")
        .attr("font-family", fontFamily)
        .text(String.fromCharCode(65 + i));

      // Potential u — further left, below the node label
      if (u && u[i] !== undefined) {
        svg
          .append("text")
          .attr("x", leftX - 42)
          .attr("y", cy)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "central")
          .attr("fill", "#38bdf8")
          .attr("font-size", 10)
          .attr("font-family", fontFamily)
          .attr("font-style", "italic")
          .text(`u=${Number(u[i]).toFixed(0)}`);
      }
    }

    // --- Destinations (right side) ---
    for (let j = 0; j < dest; j++) {
      const cy = topY + j * stepY;

      svg
        .append("circle")
        .attr("cx", rightX)
        .attr("cy", cy)
        .attr("r", 9)
        .attr("fill", "#0f172a")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 2);

      // Node label (1, 2, 3...) — to the right
      svg
        .append("text")
        .attr("x", rightX + 18)
        .attr("y", cy)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "central")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 13)
        .attr("font-weight", "bold")
        .attr("font-family", fontFamily)
        .text(String(j + 1));

      // Potential v — further right, below the node label
      if (v && v[j] !== undefined) {
        svg
          .append("text")
          .attr("x", rightX + 42)
          .attr("y", cy)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "central")
          .attr("fill", "#38bdf8")
          .attr("font-size", 10)
          .attr("font-family", fontFamily)
          .attr("font-style", "italic")
          .text(`v=${Number(v[j]).toFixed(0)}`);
      }
    }

    // --- Edges and labels ---
    // Pre-compute all active edges to detect overlaps
    const edges = [];
    for (let i = 0; i < sources; i++) {
      for (let j = 0; j < dest; j++) {
        const allocValue = allocation[i][j];
        if (allocValue === "EPS" || allocValue > 0) {
          const x1 = leftX + 9;
          const y1 = topY + i * stepY;
          const x2 = rightX - 9;
          const y2 = topY + j * stepY;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          edges.push({ i, j, allocValue, x1, y1, x2, y2, midX, midY, angle });
        }
      }
    }

    // Group edges by approximate midpoint to spread labels
    const midGroups = new Map();
    edges.forEach((e) => {
      const key = `${Math.round(e.midX / 20)}-${Math.round(e.midY / 20)}`;
      if (!midGroups.has(key)) midGroups.set(key, []);
      midGroups.get(key).push(e);
    });

    edges.forEach((e) => {
      const key = `${Math.round(e.midX / 20)}-${Math.round(e.midY / 20)}`;
      const group = midGroups.get(key);
      const idx = group.indexOf(e);
      const count = group.length;

      // Spread labels vertically within a group to avoid overlap
      const spreadBase = 14;
      const spreadOffset = count > 1
        ? (idx - (count - 1) / 2) * spreadBase
        : 0;

      const perpX = -Math.sin(e.angle);
      const perpY = Math.cos(e.angle);
      const labelX = e.midX + perpX * spreadOffset;
      const labelY = e.midY + perpY * spreadOffset;

      // Draw line
      svg
        .append("line")
        .attr("x1", e.x1)
        .attr("y1", e.y1)
        .attr("x2", e.x2)
        .attr("y2", e.y2)
        .attr(
          "stroke-width",
          e.allocValue === "EPS" ? 1.5 : Math.min(e.allocValue / 5, 6),
        )
        .attr("stroke-dasharray", e.allocValue === "EPS" ? "4,4" : "0")
        .attr("stroke", "#38bdf8")
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.7);

      // Draw label with background pill for readability
      const displayText =
        e.allocValue === "EPS" ? "ε" : String(displayValues[e.i][e.j]);

      const g = svg.append("g");

      g.append("rect")
        .attr("x", labelX - 14)
        .attr("y", labelY - 8)
        .attr("width", 28)
        .attr("height", 16)
        .attr("rx", 4)
        .attr("fill", "#0f172a")
        .attr("fill-opacity", 0.85);

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "#93c5fd")
        .attr("font-size", 10)
        .attr("font-family", fontFamily)
        .attr("font-weight", "bold")
        .text(displayText);
    });
  }, [allocation, dims.w, dims.h, dims.stepY, costs, u, v]);

  return (
    <div className="w-full overflow-x-auto flex justify-center">
      <svg ref={ref} width={dims.w} height={dims.h} />
    </div>
  );
}
