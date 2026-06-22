import { findCycle } from "./cycleFinder.js";
import isBasic from "./isBasic.js";
import countAllocations from "./compteallocation.js";

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
        if (!isBasic(alloc[i][j])) {
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

  function computeCurrentCost(currentAlloc) {
    let z = 0;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const qty = currentAlloc[i][j] === "EPS" ? 0 : currentAlloc[i][j];
        z += costs[i][j] * qty;
      }
    }
    return z;
  }

  function hasEpsilon(currentAlloc) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (currentAlloc[i][j] === "EPS") return true;
      }
    }
    return false;
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

    // Déterminer theta : si une des cases '-' est "EPS", on considère theta = 'EPS' (symbolique, plus petit que tout entier).
    let thetaVal;
    if (minus.some((c) => alloc[c.row][c.col] === "EPS")) {
      thetaVal = "EPS";
    } else {
      thetaVal = Math.min(...minus.map((c) => alloc[c.row][c.col]));
    }

    // Préparer et pousser une étape détaillée si EPS est présent dans l'allocation (afficher Z, gain, θ et cycle)
    const containsEPS = hasEpsilon(alloc);
    if (containsEPS) {
      const currentZ = Number(computeCurrentCost(alloc).toFixed(2));
      const estimatedGain = thetaVal === "EPS" ? 0 : Number((-bestDelta * thetaVal).toFixed(2));
      const estimatedNewZ = thetaVal === "EPS" ? currentZ : Number((currentZ + bestDelta * thetaVal).toFixed(2));

      const cycleRepresentation = bestCycle.map((c, idx) => {
        const label = `${String.fromCharCode(65 + c.row)}${c.col + 1}`;
        const sign = idx % 2 === 0 ? "+θ" : "-θ";
        return { label, sign };
      });

      steps.push({
        message: `Détail substitution → Z = ${currentZ.toFixed(2)} (gain: ${estimatedGain.toFixed(2)})`,
        table: JSON.parse(JSON.stringify(alloc)),
        theta: thetaVal === "EPS" ? "ε" : Number(thetaVal.toFixed(2)),
        cycle: cycleRepresentation,
        note: "Cases vertes (+θ): augmentation • Cases rouges (-θ): diminution",
        currentZ,
        estimatedGain,
        estimatedNewZ,
      });
    }
for (let k = 0; k < bestCycle.length; k++) {
  let c = bestCycle[k];
  const isPlus = k % 2 === 0;
  const cell = alloc[c.row][c.col];

  if (thetaVal === "EPS") {
    // 🔥 CAS SPECIAL EPS
    if (isPlus) {
      if (cell === 0) {
        alloc[c.row][c.col] = "EPS"; // entrée dans la base
      }
    } else {
      if (cell === "EPS") {
        alloc[c.row][c.col] = 0; // sortie de la base
      }
    }
  } else {
    // 🔵 CAS NORMAL (numérique)
    if (isPlus) {
      alloc[c.row][c.col] =
        cell === "EPS" ? thetaVal : cell + thetaVal;
    } else {
      if (cell === "EPS") {
        alloc[c.row][c.col] = 0;
      } else {
        alloc[c.row][c.col] -= thetaVal;
      }
    }
  }
}

    steps.push({
        message: "Substitution / amélioration θ=" + (thetaVal === "EPS" ? "ε" : thetaVal),
      highlight: bestPos ? [bestPos] : undefined,
      cycle: bestCycle,
      table: JSON.parse(JSON.stringify(alloc)),
      u,
      v,
    });
    // Après chaque substitution, vérifier si on est en situation dégénérée
    // i.e. nombre de basiques < m + n - 1 ; si oui, tenter d'ajouter un EPS
    function addEpsilonIfNeeded() {
      const EPS = "EPS";
      const needed = m + n - 1;
      const nb = countAllocations(alloc);
      if (nb >= needed) return false;

      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (alloc[i][j] !== 0) continue;

          // tester si l'ajout crée un cycle (on peut utiliser findCycle qui accepte EPS en base)
          const testAlloc = alloc.map(row => [...row]);
          testAlloc[i][j] = EPS;

          const cycle = findCycle({ row: i, col: j }, testAlloc);
          if (!cycle) {
            alloc[i][j] = EPS;
            steps.push({
              message: `Ajout ε en (${String.fromCharCode(65 + i)},${j + 1}) après substitution (pour éviter dégénérescence)`,
              table: JSON.parse(JSON.stringify(alloc)),
            });
            return true;
          }
        }
      }

      // aucun emplacement valide trouvé
      steps.push({
        message: "Aucun emplacement valide pour ε trouvé après substitution (dégénérescence non résolue)",
        table: JSON.parse(JSON.stringify(alloc)),
      });
      return false;
    }

    addEpsilonIfNeeded();
  }

  return alloc;
}
