export function findCycle(start, allocation) {
  const m = allocation.length;
  const n = allocation[0].length;

  function dfs(path, visited, row, col, dir) {
    if (path.length > 3 && row === start.row && col === start.col) return path;

    if (dir === "row") {
      for (let j = 0; j < n; j++) {
        if (j !== col && allocation[row][j] > 0) {
          const key = row + "-" + j;
          if (!visited.has(key)) {
            visited.add(key);

            const res = dfs([...path, { row, col: j }], visited, row, j, "col");

            if (res) return res;
          }
        }
      }
    } else {
      for (let i = 0; i < m; i++) {
        if (i !== row && allocation[i][col] > 0) {
          const key = i + "-" + col;
          if (!visited.has(key)) {
            visited.add(key);

            const res = dfs([...path, { row: i, col }], visited, i, col, "row");

            if (res) return res;
          }
        }
      }
    }

    return null;
  }

  return dfs([start], new Set(), start.row, start.col, "row");
}
