import { minitab } from "./minitab.js";
import { steppingStone } from "./steppingStone.js";
import countAllocations from "./compteallocation.js";
import { addEpsilon } from "./utils.js";

export function solveTransport(data) {
  let steps = [];

  let allocation = minitab(
    data.costs,
    [...data.supply],
    [...data.demand],
    steps,
  );

  const EPS = "EPS";

  const m = data.costs.length;
  const n = data.costs[0].length;

  let nb = countAllocations(allocation);

  if (nb < m + n - 1) {
    // dégénérescence
    nb = addEpsilon(allocation, steps, EPS, nb, m, n);
  }

  // Save the basic solution (after MINITAB + epsilon, before Stepping-Stone)
  const basicSolution = JSON.parse(JSON.stringify(allocation));

  // Add Z calculation step after MINITAB completes
  let baseCost = 0;
  let formulaParts = [];

  for (let i = 0; i < data.costs.length; i++) {
    for (let j = 0; j < data.costs[0].length; j++) {
      if (allocation[i][j] === "EPS" || allocation[i][j] > 0) {
        const quantity = allocation[i][j] === "EPS" ? 0 : allocation[i][j];
        const product = data.costs[i][j] * quantity;
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
      const val = allocation[i][j] === "EPS" ? 0 : (allocation[i][j] || 0);
      cost += data.costs[i][j] * val;
    }
  }

  return {
    allocation,
    basicSolution,
    cost,
    steps,
  };
}
