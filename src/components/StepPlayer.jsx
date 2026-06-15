import { useEffect, useMemo, useState } from "react";
import TransportTable from "./TransportTable";
import TransportGraph from "./TransportGraph";
import { motion, AnimatePresence } from "framer-motion";

export default function StepPlayer({ steps, costs, onComplete, calculateCurrentZ, isSteppingStoneStep }) {
  const [i, setI] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  const step = steps[i];

  const currentAlloc = useMemo(() => {
    let lastTable = null;
    for (let k = 0; k <= i; k++) {
      if (steps[k].table) lastTable = steps[k].table;
    }
    return lastTable;
  }, [steps, i]);

  const isMinitabComplete = useMemo(() => {
    const firstSSIndex = steps.findIndex(s => s.u || s.v || s.deltaTable || s.zCalculation);
    if (firstSSIndex === -1) return false;
    return i >= firstSSIndex;
  }, [steps, i]);

  const isZCalculationStep = !!step.zCalculation;

  const currentZ = useMemo(() => {
    if (!currentAlloc) return null;
    const shouldShowZ = isZCalculationStep || isSteppingStoneStep(i) || step.cycle;
    if (shouldShowZ && calculateCurrentZ) {
      return calculateCurrentZ(currentAlloc);
    }
    return null;
  }, [currentAlloc, i, steps, calculateCurrentZ, isSteppingStoneStep, step.cycle, isZCalculationStep]);

  const previousZ = useMemo(() => {
    if (!isMinitabComplete || i <= 0) return null;
    if (calculateCurrentZ) {
      let prevAlloc = null;
      for (let k = 0; k < i; k++) {
        if (steps[k].table) prevAlloc = steps[k].table;
      }
      if (prevAlloc) {
        return calculateCurrentZ(prevAlloc);
      }
    }
    return null;
  }, [i, steps, isMinitabComplete, calculateCurrentZ]);

  const zGain = useMemo(() => {
    if (currentZ !== null && previousZ !== null) {
      return (previousZ - currentZ).toFixed(2);
    }
    return null;
  }, [currentZ, previousZ]);

  const atStart = i === 0;
  const atEnd = i === steps.length - 1;
  const progress = steps.length > 1 ? (i / (steps.length - 1)) * 100 : 100;

  // Clamp step index when steps array changes (e.g. after re-solving from inline edit)
  useEffect(() => {
    if (i >= steps.length && steps.length > 0) {
      setI(steps.length - 1);
    }
  }, [steps.length, i]);

  useEffect(() => {
    if (atEnd && onComplete) {
      onComplete();
    }
  }, [atEnd, onComplete]);

  useEffect(() => {
    if (!autoPlay) return;
    if (atEnd) return;
    const ms = Math.max(20, Number(intervalMs) || 2000);
    const t = window.setInterval(() => {
      setI((v) => Math.min(steps.length - 1, v + 1));
    }, ms);
    return () => window.clearInterval(t);
  }, [autoPlay, intervalMs, steps.length, atEnd]);

  const rowLabels = Array.from({ length: costs.length }, (_, k) => String.fromCharCode(65 + k));
  const colLabels = Array.from({ length: costs[0]?.length ?? 0 }, (_, k) => String(k + 1));

  // Compute theta display value for table cell badges
  const thetaDisplay = useMemo(() => {
    if (!step.cycle || step.cycle.length === 0) return null;
    if (step.partialCycle) return 'θ'; // marking phase: show θ symbol
    if (step.theta !== undefined) return String(Number(step.theta).toFixed(0)); // substitution: show actual value
    const match = step.message.match(/θ=\s*([\d.]+)/);
    if (match) return String(parseFloat(match[1]).toFixed(0));
    return null;
  }, [step]);

  // Is this a cycle-related step (marking or substitution)?
  const isCycleStep = !!step.cycle && (step.partialCycle || step.message.includes('θ') || step.message.includes('Substitution'));

  // Compact theta info for cycle steps
  const thetaInfo = useMemo(() => {
    if (!isCycleStep) return null;
    const isMarking = !!step.partialCycle;
    const fullCycle = step.fullCycle || step.cycle;
    let thetaVal = '?';
    if (step.theta !== undefined) thetaVal = Number(step.theta).toFixed(2);
    else {
      const match = step.message.match(/θ=\s*([\d.]+)/);
      if (match) thetaVal = parseFloat(match[1]).toFixed(2);
    }
    const markedCount = isMarking ? step.partialCycle.length : fullCycle.length;
    return { isMarking, markedCount, totalCells: fullCycle.length, thetaVal, isSubstitution: !isMarking && step.message.includes('Substitution') };
  }, [step, isCycleStep]);

  return (
    <div className="space-y-6 pb-24">
      {/* Step Card */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {/* Card Header with progress */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/40">
          <div className="flex items-center justify-between gap-4 mb-3">
            <motion.h2
              className="text-lg font-semibold text-slate-100 flex items-center gap-2"
              key={`step-${i}`}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
            >
              <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Étape {i + 1} / {steps.length}
            </motion.h2>
            <motion.p
              className="text-sm text-slate-400 flex-1 text-right"
              key={`msg-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {step.message}
            </motion.p>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Allocation and Cost Tables */}
          <motion.div
            className="grid gap-5 md:grid-cols-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{ display: (step.deltaTable || step.deltaFormulas || step.negativeDeltas) ? 'none' : 'grid' }}
          >
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Coûts
              </h3>
              <div className="overflow-x-auto">
                <TransportTable
                  table={costs}
                  highlight={step.highlight}
                  cycle={step.cycle}
                  rowLabels={rowLabels}
                  colLabels={colLabels}
                  rowTotals={step.supply0}
                  colTotals={step.demand0}
                  cornerLabel=""
                  thetaDisplay={thetaDisplay}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Allocations
              </h3>
              {currentAlloc ? (
                <div className="overflow-x-auto">
                  <TransportTable
                    table={currentAlloc}
                    highlight={step.highlight}
                    cycle={step.cycle}
                    rowLabels={Array.from({ length: currentAlloc.length }, (_, k) =>
                      String.fromCharCode(65 + k),
                    )}
                    colLabels={Array.from(
                      { length: currentAlloc[0]?.length ?? 0 },
                      (_, k) => String(k + 1),
                    )}
                    rowTotals={step.supply ?? step.supply0}
                    colTotals={step.demand ?? step.demand0}
                    cornerLabel=""
                    thetaDisplay={thetaDisplay}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-xl border border-dashed border-slate-700/50 bg-slate-900/20">
                  <p className="text-xs text-slate-500">
                    Aucune allocation encore effectuée
                  </p>
                </div>
              )}

              {/* Z formula display */}
              {isZCalculationStep && step.zCalculation && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                  <p className="text-sm text-slate-200 font-mono">
                    Z = {step.zCalculation.formula} = <span className="text-emerald-300 font-bold">{step.zCalculation.result}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Graph visualization */}
          {(isMinitabComplete || isZCalculationStep) && currentAlloc && !step.deltaFormulas && !step.negativeDeltas && !step.deltaTable && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Visualisation des flux
              </h3>
              <TransportGraph
                allocation={currentAlloc}
                costs={costs}
                u={step.u}
                v={step.v}
              />
            </div>
          )}

          {/* Z value during Stepping-Stone */}
          {!isZCalculationStep && currentZ !== null && (
            <div className="rounded-xl bg-slate-900/40 border border-slate-700/50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sky-400">Z</span>
              </div>
              <p className="text-sm text-slate-200">
                Z = <span className="font-semibold">{currentZ.toFixed(2)}</span>
                {zGain !== null && parseFloat(zGain) !== 0 && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    parseFloat(zGain) > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {parseFloat(zGain) > 0 ? '↓' : '↑'} {Math.abs(parseFloat(zGain)).toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Delta formulas and table - Stepping-Stone phase */}
          {(step.deltaFormulas || step.negativeDeltas || step.deltaTable) && (
            <motion.div
              className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Coûts Marginaux Δ(x,y)
              </h3>

              {/* All delta formulas overview */}
              {step.deltaFormulas && !step.negativeDeltas && !step.deltaTable && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Calcul des coûts marginaux (cases non-basiques) :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-48 overflow-y-auto pr-1">
                      {step.deltaFormulas.map((item, idx) => (
                        <motion.p
                          key={idx}
                          className={`text-xs font-mono py-0.5 truncate ${
                            item.value < 0 ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                          }`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          title={item.formula}
                        >
                          {item.formula}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Negative deltas only */}
              {step.negativeDeltas && !step.deltaTable && (
                <motion.div
                  className="mt-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-600/30"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-emerald-300 mb-2 font-semibold flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Deltas négatifs détectés (améliorations possibles)
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {step.negativeDeltas.map((item, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-900/40 border border-emerald-500/40 text-xs text-emerald-200 font-mono"
                      >
                        Δ{String.fromCharCode(65 + item.row)}{item.col + 1} = {item.value}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Delta table */}
              {step.deltaTable && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="overflow-x-auto">
                    <TransportTable
                      table={step.deltaTable}
                      highlight={step.highlight}
                      rowLabels={Array.from({ length: step.deltaTable.length }, (_, k) =>
                        String.fromCharCode(65 + k),
                      )}
                      colLabels={Array.from(
                        { length: step.deltaTable[0]?.length ?? 0 },
                        (_, k) => String(k + 1),
                      )}
                      cornerLabel="Δ"
                    />
                  </div>
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40">
                    <svg className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-slate-400">
                      "-" = case basique · Δ négatif = amélioration possible · Case jaune = variable entrante
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Theta info bar for cycle steps */}
          {thetaInfo && (
            <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs ${
              thetaInfo.isSubstitution
                ? 'border-emerald-500/25 bg-emerald-950/15 text-emerald-300'
                : 'border-sky-500/25 bg-sky-950/10 text-sky-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${thetaInfo.isSubstitution ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                <span className="font-semibold">
                  {thetaInfo.isSubstitution ? 'Substitution appliquée' : `Marquage cycle : ${thetaInfo.markedCount}/${thetaInfo.totalCells}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">
                  θ = {thetaInfo.thetaVal}
                </span>
                {currentZ !== null && thetaInfo.isSubstitution && zGain !== null && parseFloat(zGain) !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    parseFloat(zGain) > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {parseFloat(zGain) > 0 ? '↓' : '↑'} {Math.abs(parseFloat(zGain)).toFixed(2)}
                  </span>
                )}
                <span className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/50" /> +θ
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-rose-500/50" /> -θ
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Controls - Fixed Bottom Bar */}
      <motion.div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 px-5 py-3">
          {/* Step counter */}
          <div className="text-center mb-2">
            <span className="text-xs font-medium text-slate-400">
              {i + 1} / {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Skip to Start */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setI(0)}
              disabled={i === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 disabled:opacity-25 disabled:hover:bg-slate-800 transition-colors"
              title="Retour au début"
            >
              <svg className="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </motion.button>

            {/* Previous Step */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 disabled:opacity-25 disabled:hover:bg-slate-800 transition-colors"
              title="Étape précédente"
            >
              <svg className="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
              </svg>
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoPlay(!autoPlay)}
              className={`p-3.5 rounded-xl transition-all ${
                autoPlay
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/30'
              }`}
              title={autoPlay ? "Pause" : "Lecture automatique"}
            >
              {autoPlay ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </motion.button>

            {/* Next Step */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))}
              disabled={i === steps.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 disabled:opacity-25 disabled:hover:bg-slate-800 transition-colors"
              title="Étape suivante"
            >
              <svg className="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
              </svg>
            </motion.button>

            {/* Skip to End */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setI(steps.length - 1)}
              disabled={i === steps.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 disabled:opacity-25 disabled:hover:bg-slate-800 transition-colors"
              title="Aller à la dernière étape"
            >
              <svg className="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </motion.button>
          </div>

          {/* Interval Control - shows on hover */}
          <AnimatePresence>
            {isHoveringControls && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 pt-2 border-t border-slate-700/50"
              >
                <label className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                  <span>Vitesse:</span>
                  <input
                    className="w-20 rounded-md bg-slate-800 border border-slate-600/50 px-2 py-1 text-slate-200 text-center focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    value={intervalMs}
                    onChange={(e) => setIntervalMs(Number(e.target.value))}
                    type="number"
                    step="100"
                    min="100"
                  />
                  <span>ms</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
