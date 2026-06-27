/**
 * Utilitaires pour le problème de transport
 * Version corrigée et robuste de addEpsilon
 */

export function isBasic(val) {
  return val === "EPS" || (typeof val === "number" && val > 0);
}

export function computeDegrees(allocation) {
  const m = allocation.length;
  const n = allocation[0].length;
  const rowCount = Array(m).fill(0);
  const colCount = Array(n).fill(0);

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (isBasic(allocation[i][j])) {
        rowCount[i]++;
        colCount[j]++;
      }
    }
  }
  return { rowCount, colCount };
}

/* ====================== Union-Find ====================== */
function makeFind(parent) {
  return function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
}

function union(parent, x, y) {
  const px = makeFind(parent)(x);
  const py = makeFind(parent)(y);
  if (px !== py) {
    parent[px] = py;
  }
}

/**
 * Version robuste et correcte de addEpsilon
 * Utilise Union-Find pour détecter précisément les composantes
 */
export function addEpsilon(allocation, steps, EPS, currentNb, m, n) {
  let nb = currentNb;

  // Tant qu'on n'a pas assez de bases
  while (nb < m + n - 1) {
    // === 1. Construire l'Union-Find ===
    const parent = {};
    // Lignes : 0..m-1
    // Colonnes : m..m+n-1
    for (let i = 0; i < m; i++) parent[i] = i;
    for (let j = 0; j < n; j++) parent[m + j] = m + j;

    const find = makeFind(parent);

    // Union des cellules de base
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (isBasic(allocation[i][j])) {
          union(parent, i, m + j);
        }
      }
    }

    // === 2. Trouver deux nœuds de composantes différentes ===
    let added = false;

    // Chercher une cellule vide qui relie deux composantes différentes
    outer: for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (!isBasic(allocation[i][j])) {
          const rootRow = find(i);
          const rootCol = find(m + j);

          if (rootRow !== rootCol) {
            // Cette cellule connecte deux composantes différentes !
            allocation[i][j] = EPS;
            steps.push({
              message: `Ajout ε en (${i},${j}) → connexion de composantes`,
              table: JSON.parse(JSON.stringify(allocation)),
            });
            nb++;
            added = true;
            break outer;
          }
        }
      }
    }

    // === 3. Fallback si aucune connexion possible (très rare) ===
    if (!added) {
      for (let i = 0; i < m && !added; i++) {
        for (let j = 0; j < n && !added; j++) {
          if (!isBasic(allocation[i][j])) {
            allocation[i][j] = EPS;
            steps.push({
              message: `Ajout ε en (${i},${j}) → fallback (connexion forcée)`,
              table: JSON.parse(JSON.stringify(allocation)),
            });
            nb++;
            added = true;
          }
        }
      }
    }

    if (!added) {
      // Impossible d'ajouter plus → on sort
      break;
    }
  }

  return nb;
}