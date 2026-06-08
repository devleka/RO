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
    const { allocation, basicSolution, cost, steps } = solveTransport(data);

    if (mode === "pedagogique") {
      setSteps(steps);
      setResult({ allocation, basicSolution, cost });
      setShowFinalResult(false);
    } else {
      setSteps([]);
      setResult({ allocation, basicSolution, cost });
      setShowFinalResult(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500" />

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
                Transport Solver
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                MINITAB → Solution initiale · Stepping-Stone → Optimisation
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-xl bg-slate-800/80 border border-slate-700/60 p-1 text-xs shadow-lg shadow-black/20">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    mode === "direct"
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                  onClick={() => {
                    setMode("direct");
                    handleNewCalculation();
                  }}
                >
                  Direct
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    mode === "pedagogique"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                  onClick={() => {
                    setMode("pedagogique");
                    handleNewCalculation();
                  }}
                >
                  Pédagogique
                </button>
              </div>

              {isSolved && (
                <button
                  className="px-3 py-2 rounded-lg border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200"
                  onClick={handleNewCalculation}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Nouveau
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {!isSolved && (
            <DataForm value={dataUi} onChange={setDataUi} onSolve={solve} />
          )}

          {isSolved && mode === "pedagogique" && steps.length > 0 && !showFinalResult && (
            <StepPlayer
              steps={steps}
              costs={dataUi.costs.map((r) => r.map((x) => Number(x)))}
              onComplete={() => setShowFinalResult(true)}
              calculateCurrentZ={calculateCurrentZ}
              isSteppingStoneStep={isSteppingStoneStep}
            />
          )}

          {result && ((mode === "direct") || (mode === "pedagogique" && showFinalResult)) && (
            <ResultPanel
              basicSolution={result.basicSolution}
              optimalSolution={result.allocation}
              cost={result.cost}
              onReset={handleNewCalculation}
            />
          )}
        </main>
      </div>
    </div>
  );
}
