import { findCycle } from "./cycleFinder.js";

export function steppingStone(costs, alloc, steps) {
  const m = costs.length;
  const n = costs[0].length;

  function computePotentials() {
    const u = Array(m).fill(null);
    const v = Array(n).fill(null);

    const basics = [];
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (alloc[i][j] > 0) basics.push({ i, j });
      }
    }

    // Track calculation steps for display
    let potentialFormulas = [];

    // On peut avoir plusieurs composantes (dégénérescence) : on relance avec une valeur arbitraire.
    while (true) {
      const startRow = u.findIndex((x) => x === null);
      const startCol = v.findIndex((x) => x === null);
      if (startRow === -1 && startCol === -1) break;

      if (startRow !== -1) {
        u[startRow] = 0;
        potentialFormulas.push(`u${String.fromCharCode(65 + startRow)} = 0 (arbitraire)`);
      }
      else {
        v[startCol] = 0;
        potentialFormulas.push(`v${startCol + 1} = 0 (arbitraire)`);
      }

      let progress = true;
      while (progress) {
        progress = false;
        for (const b of basics) {
          const i = b.i;
          const j = b.j;
          if (u[i] !== null && v[j] === null) {
            v[j] = costs[i][j] - u[i];
            potentialFormulas.push(`v${j + 1} = C${String.fromCharCode(65 + i)}${j + 1} - u${String.fromCharCode(65 + i)} = ${costs[i][j]} - ${u[i]} = ${v[j]}`);
            progress = true;
          } else if (v[j] !== null && u[i] === null) {
            u[i] = costs[i][j] - v[j];
            potentialFormulas.push(`u${String.fromCharCode(65 + i)} = C${String.fromCharCode(65 + i)}${j + 1} - v${j + 1} = ${costs[i][j]} - ${v[j]} = ${u[i]}`);
            progress = true;
          }
        }
      }

      // Si aucun potentiel n'a pu être propagé (cas pathologique), on stoppe.
      const stillUnknown = u.some((x) => x === null) || v.some((x) => x === null);
      if (!stillUnknown) break;

      // Sinon on boucle et on initialise une autre composante.
      const madeAny = u.some((x) => x !== null) || v.some((x) => x !== null);
      if (!madeAny) break;
    }

    // Remplissage "safe" si jamais il reste des null.
    for (let i = 0; i < m; i++) {
      if (u[i] === null) {
        u[i] = 0;
        potentialFormulas.push(`u${String.fromCharCode(65 + i)} = 0 (par défaut)`);
      }
    }
    for (let j = 0; j < n; j++) {
      if (v[j] === null) {
        v[j] = 0;
        potentialFormulas.push(`v${j + 1} = 0 (par défaut)`);
      }
    }

    return { u, v, formulas: potentialFormulas };
  }

  function computeDeltas(u, v) {
    const delta = Array.from({ length: m }, () => Array(n).fill(""));
    let bestDelta = 0;
    let bestPos = null;
    
    // Track delta calculations for display
    let deltaFormulas = [];

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (alloc[i][j] === 0) {
          const d = costs[i][j] - u[i] - v[j];
          const deltaStr = Number(d.toFixed(2));
          delta[i][j] = deltaStr;
          
          // Store formula for non-basic cells
          deltaFormulas.push({
            row: i,
            col: j,
            formula: `Δ${String.fromCharCode(65 + i)}${j + 1} = C${String.fromCharCode(65 + i)}${j + 1} - u${String.fromCharCode(65 + i)} - v${j + 1} = ${costs[i][j]} - ${u[i]} - ${v[j]} = ${deltaStr}`,
            value: deltaStr
          });
          
          if (d < bestDelta) {
            bestDelta = d;
            bestPos = { row: i, col: j };
          }
        } else {
          delta[i][j] = "-";
        }
      }
    }

    return { delta, bestDelta, bestPos, formulas: deltaFormulas };
  }

  let optimal = false;

  steps.push({
    message: "Début Stepping-Stone (potentiels, Δ, substitution)",
    table: JSON.parse(JSON.stringify(alloc)),
  });

  while (!optimal) {
    const { u, v, formulas: potentialFormulas } = computePotentials();
    steps.push({
      message: "Calcul des potentiels (Vx, Vy)",
      table: JSON.parse(JSON.stringify(alloc)),
      u,
      v,
      potentialFormulas: potentialFormulas
    });

    const { delta, bestDelta, bestPos, formulas: deltaFormulas } = computeDeltas(u, v);
    
    // Single step with all deltas for overview
    steps.push({
      message: "Calcul des coûts marginaux Δ(x,y)",
      table: JSON.parse(JSON.stringify(alloc)),
      u,
      v,
      deltaFormulas: deltaFormulas
    });
    
    // Step with negative deltas only
    const negativeDeltas = deltaFormulas.filter(f => f.value < 0);
    if (negativeDeltas.length > 0) {
      steps.push({
        message: "Deltas négatifs détectés - Améliorations possibles",
        table: JSON.parse(JSON.stringify(alloc)),
        u,
        v,
        negativeDeltas: negativeDeltas
      });
    }
    
    // Step with delta table
    steps.push({
      message: "Synthèse des coûts marginaux",
      table: JSON.parse(JSON.stringify(alloc)),
      deltaTable: delta,
      highlight: bestPos ? [bestPos] : undefined,
      u,
      v,
      deltaFormulas: deltaFormulas
    });

    if (bestDelta >= 0) {
      optimal = true;
      steps.push({
        message: "Optimal atteint (tous les Δ ≥ 0)",
        table: JSON.parse(JSON.stringify(alloc)),
        deltaTable: delta,
        u,
        v,
      });
      break;
    }

    let bestCycle = findCycle(bestPos, alloc);
    if (
      bestCycle &&
      bestCycle.length > 1 &&
      bestCycle[bestCycle.length - 1].row === bestPos.row &&
      bestCycle[bestCycle.length - 1].col === bestPos.col
    ) {
      // On enlève le dernier point si le cycle "ferme" en répétant le départ
      bestCycle = bestCycle.slice(0, -1);
    }
    steps.push({
      message:
        "Choix de la variable entrante (Δ min) = " +
        Number(bestDelta.toFixed(2)),
      highlight: bestPos ? [bestPos] : undefined,
      cycle: bestCycle ?? undefined,
      table: JSON.parse(JSON.stringify(alloc)),
      deltaTable: delta,
      u,
      v,
    });

    if (!bestCycle) {
      // Si on ne trouve pas de cycle, on ne peut pas substituer : on s'arrête.
      optimal = true;
      steps.push({
        message: "Cycle introuvable → arrêt (dégénérescence à gérer)",
        table: JSON.parse(JSON.stringify(alloc)),
        deltaTable: delta,
        u,
        v,
      });
      break;
    }

    let minus = [];

    for (let k = 1; k < bestCycle.length; k += 2) minus.push(bestCycle[k]);

    let theta = Math.min(...minus.map((c) => alloc[c.row][c.col]));

    for (let k = 0; k < bestCycle.length; k++) {
      let c = bestCycle[k];

      if (k % 2 === 0) alloc[c.row][c.col] += theta;
      else alloc[c.row][c.col] -= theta;
    }

    steps.push({
      message: "Substitution / amélioration θ=" + theta,
      highlight: bestPos ? [bestPos] : undefined,
      cycle: bestCycle,
      table: JSON.parse(JSON.stringify(alloc)),
      u,
      v,
    });
  }

  return alloc;
}
