import { useState } from "react";

import { solveTransport } from "./algorithms/transportSolver";

import DataForm from "./components/DataForm";
import StepPlayer from "./components/StepPlayer";
import ResultPanel from "./components/ResultPanel";

export default function App() {
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("direct"); // "direct" | "pedagogique"
  const [isSolved, setIsSolved] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);

  const [dataUi, setDataUi] = useState({
    costs: [
      [24, 22, 61, 49, 83, 35],
      [23, 39, 78, 28, 65, 42],
      [67, 56, 92, 24, 53, 54],
      [71, 43, 91, 67, 40, 49],
    ].map((r) => r.map(String)),
    supply: [18, 32, 14, 9].map(String),
    demand: [9, 11, 28, 6, 14, 5].map(String),
  });

  function solve(data) {
    const { allocation, cost, steps } = solveTransport(data);

    if (mode === "pedagogique") {
      setSteps(steps);
      setResult({ allocation, cost });
      setShowFinalResult(false); // Don't show result yet in pedagogical mode
    } else {
      setSteps([]);
      setResult({ allocation, cost });
      setShowFinalResult(true); // Show immediately in direct mode
    }

    setIsSolved(true);
  }

  function handleNewCalculation() {
    setIsSolved(false);
    setSteps([]);
    setResult(null);
    setShowFinalResult(false);
  }

  // Calculate current Z value for a given step
  function calculateCurrentZ(allocationTable) {
    const costs = dataUi.costs.map((r) => r.map((x) => Number(x)));
    let z = 0;
    for (let i = 0; i < costs.length; i++) {
      for (let j = 0; j < costs[0].length; j++) {
        const val = allocationTable?.[i]?.[j];

        if (val === "EPS") {
          z += 0;
        } else {
          z += costs[i][j] * (val || 0);
        }
      }
    }
    return z;
  }

  // Check if we're in Stepping-Stone phase (has potentials/deltas)
  function isSteppingStoneStep(stepIndex) {
    return steps.some((step, idx) => idx <= stepIndex && (step.u || step.v || step.deltaTable));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transport Solver</h1>
          <p className="text-sm text-slate-300">
            Méthode MINITAB pour la solution initiale, puis Stepping-Stone pour
            l&apos;amélioration.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 p-1 text-xs">
            <button
              className={`px-3 py-1 rounded-full transition-colors ${mode === "direct"
                  ? "bg-sky-500 text-white"
                  : "text-slate-300 hover:bg-slate-700/70"
                }`}
              onClick={() => {
                setMode("direct");
                handleNewCalculation();
              }}
            >
              Résultat direct
            </button>
            <button
              className={`px-3 py-1 rounded-full transition-colors ${mode === "pedagogique"
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:bg-slate-700/70"
                }`}
              onClick={() => {
                setMode("pedagogique");
                handleNewCalculation();
              }}
            >
              Mode pédagogique
            </button>
          </div>

          {isSolved && (
            <button
              className="px-4 py-1.5 rounded-lg border border-slate-600 text-sm text-slate-100 hover:bg-slate-700/60 transition"
              onClick={handleNewCalculation}
            >
              ← Nouveau calcul
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-1 items-start">
        {!isSolved && (
          <div className="space-y-6">
            <DataForm value={dataUi} onChange={setDataUi} onSolve={solve} />
          </div>
        )}

        {isSolved && mode === "pedagogique" && steps.length > 0 && !showFinalResult && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-950/50">
            <StepPlayer
              steps={steps}
              costs={dataUi.costs.map((r) => r.map((x) => Number(x)))}
              onComplete={() => setShowFinalResult(true)}
              calculateCurrentZ={calculateCurrentZ}
              isSteppingStoneStep={isSteppingStoneStep}
            />
          </div>
        )}

        {result && ((mode === "direct") || (mode === "pedagogique" && showFinalResult)) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow-lg shadow-slate-950/50">
            <ResultPanel
              solution={result.allocation}
              cost={result.cost}
              onReset={handleNewCalculation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
