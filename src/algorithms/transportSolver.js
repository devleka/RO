import { minitab } from "./minitab.js";
import { steppingStone } from "./steppingStone.js";
import countAllocations from "./compteallocation.js";

export function solveTransport(data) {
  let steps = [];

  let allocation = minitab(
    data.costs,
    [...data.supply],
    [...data.demand],
    steps,
  );
  
const EPS = 0.1;

  const m = data.costs.length;
  const n = data.costs[0].length;

  let nb = countAllocations(allocation);

  if (nb < m + n - 1) {
    // dégénérescence
    console.log("cas de genrer",nb," ",m," ",n)
    nb = addEpsilon(allocation, steps, EPS, nb, m, n);
  }


  // Add Z calculation step after MINITAB completes
  let baseCost = 0;
  let formulaParts = [];

  for (let i = 0; i < data.costs.length; i++) {
    for (let j = 0; j < data.costs[0].length; j++) {
      if (allocation[i][j] > 0) {
        const product = data.costs[i][j] * allocation[i][j];
        baseCost += product;
        formulaParts.push(`${allocation[i][j]}×${data.costs[i][j]}`);
      }
    }
  }

  steps.push({
    message: "Solution de base complète - Calcul du coût total Z",
    table: JSON.parse(JSON.stringify(allocation)),
    zCalculation: {
      formula: formulaParts.join(" + "),
      result: baseCost
    }
  });

  allocation = steppingStone(data.costs, allocation, steps);

  let cost = 0;

  for (let i = 0; i < data.costs.length; i++) {
    for (let j = 0; j < data.costs[0].length; j++) {
      cost += data.costs[i][j] * allocation[i][j];
    }
  }

  function computeDegrees(allocation) {
  const m = allocation.length;
  const n = allocation[0].length;

  const rowCount = Array(m).fill(0);
  const colCount = Array(n).fill(0);

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (allocation[i][j] > 0) {
        rowCount[i]++;
        colCount[j]++;
      }
    }
  }

  return { rowCount, colCount };
}

function findMinIndices(arr) {
  const min = Math.min(...arr);
  return arr
    .map((v, i) => (v === min ? i : -1))
    .filter(i => i !== -1);
}

function addEpsilon(allocation, steps, EPS, nb, m, n) {
  const { rowCount, colCount } = computeDegrees(allocation);

  const minRows = findMinIndices(rowCount);
  const minCols = findMinIndices(colCount);

  for (let i of minRows) {
    for (let j of minCols) {
      if (allocation[i][j] === 0) {
        allocation[i][j] = EPS;

        steps.push({
          message: `Ajout ε en (${i},${j}) basé sur degré minimal`,
          table: JSON.parse(JSON.stringify(allocation)),
        });

        nb++;
        return nb; // on ajoute un seul epsilon
      }
    }
  }

  return nb;
}

  return {
    allocation,
    cost,
    steps,
  };
}
