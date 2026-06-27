import react from "react";

/* Compte le nombre de variables de base (allocations, EPS inclut) */
export default function countAllocations(allocation) {
  if (!allocation || !Array.isArray(allocation)) return 0;

  let count = 0;

  for (let i = 0; i < allocation.length; i++) {
    const row = allocation[i];
    if (!Array.isArray(row)) continue;

    for (let j = 0; j < row.length; j++) {
      const val = row[j];
      // Compte les nombres positifs ET les "EPS"
      if (val === "EPS" || (typeof val === "number" && val > 0)) {
        count++;
      }
    }
  }

  return count;
}