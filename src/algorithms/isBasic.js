import react from "react";
export function isBasic(val) {
  return val === "EPS" || (typeof val === "number" && val > 0);
}