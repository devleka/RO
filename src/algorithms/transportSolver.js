import { minitab } from "./minitab.js";
import { steppingStone } from "./steppingStone.js";
import countAllocations from "./compteallocation.js";
import { findCycle } from "./cycleFinder.js";

export function solveTransport(data) {
  let steps = [];

  let allocation = minitab(
    data.costs,
    [...data.supply],
    [...data.demand],
    steps,
  );

  // Token utilisé pour représenter une allocation epsilon (dégénérescence).
  // Règles : EPS est considéré comme une valeur symbolique égale à 0 dans les calculs.
  // - EPS * a = 0
  // - EPS + a = a
  // - a - EPS = a
  const EPS = "EPS";

  const m = data.costs.length;
  const n = data.costs[0].length;

  let nb = countAllocations(allocation);

  if (nb < m + n - 1) {
    // dégénérescence
    console.log("cas de genrer", nb, " ", m, " ", n)
    nb = addEpsilon(allocation, steps, EPS, nb, m, n);
  }


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
      // Traiter EPS comme zéro lors du calcul final du coût total.
      const qty = allocation[i][j] === EPS ? 0 : allocation[i][j];
      cost += data.costs[i][j] * qty;
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
function addEpsilon(allocation, steps, EPS, m, n) {
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {

      if (allocation[i][j] !== 0) continue;

      // 🔍 TEST : est-ce que ça crée un cycle ?
      const testAlloc = allocation.map(row => [...row]);
      testAlloc[i][j] = EPS;

      const cycle = findCycle({ row: i, col: j }, testAlloc);

      if (!cycle) {
        // ✅ BON emplacement
        allocation[i][j] = EPS;

        steps.push({
          message: `Ajout ε en (${String.fromCharCode(65 + i)},${j + 1}) sans créer de cycle`,
          table: JSON.parse(JSON.stringify(allocation)),
        });

        return true;
      }
    }
  }

  console.warn("⚠️ Aucun emplacement valide pour ε trouvé !");
  return false;
}

  return {
    allocation,
    cost,
    steps,
  };
}
