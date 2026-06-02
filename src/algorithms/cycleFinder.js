import isBasic from "./isBasic.js";

export function findCycle(start, alloc) {
  const m = alloc.length;
  const n = alloc[0].length;

  const startKey = `${start.row}-${start.col}`;

  function dfs(path, visited, row, col, dir) {
    // On autorise le retour au départ même si alloc[start]==0
    if (path.length > 3 && row === start.row && col === start.col) return path;

    if (dir === "row") {
      for (let j = 0; j < n; j++) {
        if (j === col) continue;

        const isStart = row === start.row && j === start.col;
  // consider EPS as usable (basic) cells
  const canUse = isStart || isBasic(alloc[row][j]);
        if (!canUse) continue;

        const key = `${row}-${j}`;
        if (!isStart && visited.has(key)) continue;

        const nextVisited = new Set(visited);
        if (!isStart) nextVisited.add(key);

        const res = dfs([...path, { row, col: j }], nextVisited, row, j, "col");
        if (res) return res;
      }
    } else {
      for (let i = 0; i < m; i++) {
        if (i === row) continue;

        const isStart = i === start.row && col === start.col;
  // consider EPS as usable (basic) cells
  const canUse = isStart || isBasic(alloc[i][col]);
        if (!canUse) continue;

        const key = `${i}-${col}`;
        if (!isStart && visited.has(key)) continue;

        const nextVisited = new Set(visited);
        if (!isStart) nextVisited.add(key);

        const res = dfs([...path, { row: i, col }], nextVisited, i, col, "row");
        if (res) return res;
      }
    }

    return null;
  }

  return dfs([start], new Set([startKey]), start.row, start.col, "row");
}
