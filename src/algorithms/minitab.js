export function minitab(costs, supply, demand, steps) {
  const m = costs.length;
  const n = costs[0].length;

  const supply0 = [...supply];
  const demand0 = [...demand];

  // Étape 0 : tableau initial des allocations (tokony vide par defaut)
  let alloc = Array(m)
    .fill()
    .map(() => Array(n).fill(0));

  steps.push({
    message: "Tableau initial (aucune allocation)",
    table: JSON.parse(JSON.stringify(alloc)),
    supply0,
    demand0,
    supply: [...supply],
    demand: [...demand],
  });

  // Parcours du tableau de la solution de base pour trouver le minimum
  while (true) {
    let min = Infinity;
    let pos = null;

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (supply[i] > 0 && demand[j] > 0) {
          if (costs[i][j] < min) {
            min = costs[i][j];
            pos = { row: i, col: j };
          }
        }
      }
    }

    // Arrete le boucle quand il n'y a plus de ligne ou de colonne disponible (pos == null)
    if (!pos) break;

    steps.push({
      message: "Sélection du coût minimal",
      highlight: [pos],
      supply0,
      demand0,
      supply: [...supply],
      demand: [...demand],
    });

    // selection du cout minimal
    let q = Math.min(supply[pos.row], demand[pos.col]);

    // Remplacer la valeur du tableau d'allocation initial
    alloc[pos.row][pos.col] = q;

    steps.push({
      message: "Allocation " + q,
      table: JSON.parse(JSON.stringify(alloc)),
      highlight: [pos],
      supply0,
      demand0,
      supply: [...supply],
      demand: [...demand],
    });

    // Mise à jour de l'offre/demande
    supply[pos.row] -= q;
    demand[pos.col] -= q;

    steps.push({
      message: "Mise à jour offres/demandes (reste à affecter)",
      table: JSON.parse(JSON.stringify(alloc)),
      highlight: [pos],
      supply0,
      demand0,
      supply: [...supply],
      demand: [...demand],
    });
  }

  return alloc;
}
