import { minitab } from "./minitab.js";
import { steppingStone } from "./steppingStone.js";

export function solveTransport(data) {
  let steps = [];

  let allocation = minitab(
    data.costs,
    [...data.supply],
    [...data.demand],
    steps,
  );

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

  return {
    allocation,
    cost,
    steps,
  };
}
