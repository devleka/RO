import { findCycle } from "./cycleFinder.js";
import { isBasic } from "./utils.js";
import countAllocations from "./compteallocation.js";
import { addEpsilon } from "./utils.js";

export function steppingStone(costs, alloc, steps) {
  const m = costs.length;
  const n = costs[0].length;

  function computePotentials() {
    const u = Array(m).fill(null);
    const v = Array(n).fill(null);

    const basics = [];
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (isBasic(alloc[i][j])) basics.push({ i, j });
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
        potentialFormulas.push(
          `u${String.fromCharCode(65 + startRow)} = 0 (arbitraire)`,
        );
      } else {
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
            potentialFormulas.push(
              `v${j + 1} = C${String.fromCharCode(65 + i)}${j + 1} - u${String.fromCharCode(65 + i)} = ${costs[i][j]} - ${u[i]} = ${v[j]}`,
            );
            progress = true;
          } else if (v[j] !== null && u[i] === null) {
            u[i] = costs[i][j] - v[j];
            potentialFormulas.push(
              `u${String.fromCharCode(65 + i)} = C${String.fromCharCode(65 + i)}${j + 1} - v${j + 1} = ${costs[i][j]} - ${v[j]} = ${u[i]}`,
            );
            progress = true;
          }
        }
      }

      // Si aucun potentiel n'a pu être propagé (cas pathologique), on stoppe.
      const stillUnknown =
        u.some((x) => x === null) || v.some((x) => x === null);
      if (!stillUnknown) break;

      // Sinon on boucle et on initialise une autre composante.
      const madeAny = u.some((x) => x !== null) || v.some((x) => x !== null);
      if (!madeAny) break;
    }

    // Remplissage "safe" si jamais il reste des null.
    for (let i = 0; i < m; i++) {
      if (u[i] === null) {
        u[i] = 0;
        potentialFormulas.push(
          `u${String.fromCharCode(65 + i)} = 0 (par défaut)`,
        );
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
        if (!isBasic(alloc[i][j])) {
          const d = costs[i][j] - u[i] - v[j];
          const deltaStr = Number(d.toFixed(2));
          delta[i][j] = deltaStr;

          // Store formula for non-basic cells
          deltaFormulas.push({
            row: i,
            col: j,
            formula: `Δ${String.fromCharCode(65 + i)}${j + 1} = C${String.fromCharCode(65 + i)}${j + 1} - u${String.fromCharCode(65 + i)} - v${j + 1} = ${costs[i][j]} - ${u[i]} - ${v[j]} = ${deltaStr}`,
            value: deltaStr,
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
      potentialFormulas: potentialFormulas,
    });

    const {
      delta,
      bestDelta,
      bestPos,
      formulas: deltaFormulas,
    } = computeDeltas(u, v);

    // Single step with all deltas for overview
    steps.push({
      message: "Calcul des coûts marginaux Δ(x,y)",
      table: JSON.parse(JSON.stringify(alloc)),
      u,
      v,
      deltaFormulas: deltaFormulas,
    });

    // Step with negative deltas only
    const negativeDeltas = deltaFormulas.filter((f) => f.value < 0);
    if (negativeDeltas.length > 0) {
      steps.push({
        message: "Deltas négatifs détectés - Améliorations possibles",
        table: JSON.parse(JSON.stringify(alloc)),
        u,
        v,
        negativeDeltas: negativeDeltas,
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
      deltaFormulas: deltaFormulas,
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

    // Compute theta before generating marking steps
    let minus = [];
    for (let k = 1; k < bestCycle.length; k += 2) minus.push(bestCycle[k]);
    // If any minus cell holds "EPS", θ=0 (degenerate pivot: ε≈0 leaves the basis)
    const hasEpsAtMinus = minus.some((c) => alloc[c.row][c.col] === "EPS");
    let theta = hasEpsAtMinus
      ? 0
      : Math.min(...minus.map((c) => alloc[c.row][c.col]));

    // Sequential marking steps: reveal one cycle cell at a time
    for (let k = 0; k < bestCycle.length; k++) {
      const partialCycle = bestCycle.slice(0, k + 1);
      const sign = k % 2 === 0 ? "+" : "-";
      const cellLabel =
        String.fromCharCode(65 + bestCycle[k].row) + (bestCycle[k].col + 1);

      steps.push({
        message: `Marquage cycle : ${cellLabel} → ${sign}θ`,
        table: JSON.parse(JSON.stringify(alloc)),
        partialCycle: partialCycle,
        fullCycle: bestCycle,
        theta: theta,
        highlight: bestPos ? [bestPos] : undefined,
        cycle: partialCycle,
        u,
        v,
      });
    }

    // Apply substitution
    if (theta === 0) {
      // Degenerate pivot: "EPS" at a minus position means θ=ε≈0.
      // Convert all "EPS" in the cycle to 0 (they leave the basis),
      // then set the entering cell (index 0) to "EPS" to maintain m+n-1 basic cells.
      for (let k = 0; k < bestCycle.length; k++) {
        const c = bestCycle[k];
        if (alloc[c.row][c.col] === "EPS") {
          alloc[c.row][c.col] = 0;
        }
      }
      alloc[bestCycle[0].row][bestCycle[0].col] = "EPS";
    } else {
      // Normal substitution: θ > 0
      for (let k = 0; k < bestCycle.length; k++) {
        const c = bestCycle[k];
        if (alloc[c.row][c.col] === "EPS") {
          alloc[c.row][c.col] = 0;
        }
        if (k % 2 === 0) {
          alloc[c.row][c.col] += theta;
        } else {
          alloc[c.row][c.col] -= theta;
        }
      }
    }

    // === NOUVEAU : Vérification du nombre de bases après chaque substitution ===
    const nbAfterSub = countAllocations(alloc);
    if (nbAfterSub < m + n - 1) {
      steps.push({
        message: `⚠️ Dégénérescence détectée après substitution (nb = ${nbAfterSub} / ${m + n - 1})`,
        table: JSON.parse(JSON.stringify(alloc)),
        u,
        v,
      });

      // Optionnel : on peut tenter d'ajouter un epsilon automatiquement
      const EPS = "EPS";
      const newNb = addEpsilon(alloc, steps, EPS, nbAfterSub, m, n);
      if (newNb > nbAfterSub) {
        steps.push({
          message: `Epsilon ajouté automatiquement pour restaurer la connectivité (nb = ${newNb})`,
          table: JSON.parse(JSON.stringify(alloc)),
        });
      }
    } else {
      steps.push({
        message: "Substitution appliquée θ=" + theta,
        highlight: bestPos ? [bestPos] : undefined,
        cycle: bestCycle,
        table: JSON.parse(JSON.stringify(alloc)),
        u,
        v,
      });
    }
  }

  return alloc;
}
