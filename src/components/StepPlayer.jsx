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

  // On garde en mémoire la dernière table d'allocation connue
  const currentAlloc = useMemo(() => {
    let lastTable = null;
    for (let k = 0; k <= i; k++) {
      if (steps[k].table) lastTable = steps[k].table;
    }
    return lastTable;
  }, [steps, i]);

  // Verifie si le MINITAB est terminé (base solution)
  const isMinitabComplete = useMemo(() => {
    // Chercher la prochaine etape pour le calcule de Z ou début de steppingStone
    const firstSSIndex = steps.findIndex(s => s.u || s.v || s.deltaTable || s.zCalculation);
    if (firstSSIndex === -1) return false; // Pas encore de steppingStone
    return i >= firstSSIndex;
  }, [steps, i]);

  // Verifie si l'etape actuelle est le calcul de Z
  const isZCalculationStep = !!step.zCalculation;

  // Calculate current Z value only when in Stepping-Stone phase or at end
  const currentZ = useMemo(() => {
    if (!currentAlloc) return null;
    
    // Show Z when:
    // 1. We're at the Z calculation step
    // 2. We're in Stepping-Stone phase
    // 3. There's a cycle/substitution
    const shouldShowZ = isZCalculationStep || isSteppingStoneStep(i) || step.cycle;
    
    if (shouldShowZ && calculateCurrentZ) {
      return calculateCurrentZ(currentAlloc);
    }
    return null;
  }, [currentAlloc, i, steps, calculateCurrentZ, isSteppingStoneStep, step.cycle, isZCalculationStep]);

  // Calculate previous Z value to show gain/loss (only for Stepping-Stone)
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

  // Call onComplete when reaching the last step (both manual and autoplay)
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

  return (
    <div className="space-y-4 p-7 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Header with step number - Compact */}
      <motion.div 
        className="flex items-center justify-between gap-4 pb-3 border-b border-slate-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h2 
          className="text-xl font-semibold text-sky-300"
          key={`step-${i}`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          Étape {i + 1} / {steps.length}
        </motion.h2>
        <motion.p 
          className="text-sm text-slate-300 flex-1"
          key={`msg-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {step.message}
        </motion.p>
      </motion.div>

      {/* Allocation and Cost Tables - Animated */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        style={{ display: (step.deltaTable || step.deltaFormulas || step.negativeDeltas) ? 'none' : 'grid' }}
      >
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">
            Tableau des coûts
          </h3>
          <TransportTable
            table={costs}
            highlight={step.highlight}
            cycle={step.cycle}
            rowLabels={Array.from({ length: costs.length }, (_, k) =>
              String.fromCharCode(65 + k),
            )}
            colLabels={Array.from({ length: costs[0]?.length ?? 0 }, (_, k) =>
              String(k + 1),
            )}
            rowTotals={step.supply0}
            colTotals={step.demand0}
            cornerLabel=""
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">
            Tableau des allocations
          </h3>
          {currentAlloc ? (
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
            />
          ) : (
            <p className="text-xs text-slate-400">
              Aucune allocation encore effectuée.
            </p>
          )}
          
          {/* Simple Z formula display - only at Z calculation step */}
          {isZCalculationStep && step.zCalculation && (
            <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
              <p className="text-sm text-slate-200 font-mono">
                Z = {step.zCalculation.formula} = {step.zCalculation.result}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Graph visualization - Show after base solution is complete (including Z calc step) */}
      {(isMinitabComplete || isZCalculationStep) && currentAlloc && !step.deltaFormulas && !step.negativeDeltas && !step.deltaTable && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium text-slate-200 mb-2">
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

      {/* Display Z value during Stepping-Stone (simple) */}
      {!isZCalculationStep && currentZ !== null && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
          <p className="text-sm text-slate-200">
            Z = {currentZ.toFixed(2)}
            {zGain !== null && parseFloat(zGain) !== 0 && (
              <span className={`ml-2 ${parseFloat(zGain) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                (gain: {Math.abs(parseFloat(zGain)).toFixed(2)})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Display delta formulas and table - Stepping-Stone phase only */}
      {(step.deltaFormulas || step.negativeDeltas || step.deltaTable) && (
        <motion.div 
          className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-amber-300 mb-3">Coûts Marginaux Δ(x,y)</h3>
          
          {/* All delta formulas at once - Overview */}
          {step.deltaFormulas && !step.negativeDeltas && !step.deltaTable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Calcul des coûts marginaux (cases non-basiques) :</p>
                <div className="space-y-1">
                  {step.deltaFormulas.map((item, idx) => (
                    <motion.p 
                      key={idx} 
                      className={`text-sm font-mono ${
                        item.value < 0 ? 'text-green-400 font-semibold' : 'text-slate-200'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
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
              className="mb-3 p-3 rounded-lg bg-green-950/30 border border-green-600/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-green-300 mb-2 font-semibold">
                ✓ Deltas négatifs détectés (améliorations possibles) :
              </p>
              <div className="flex flex-wrap gap-2">
                {step.negativeDeltas.map((item, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-3 py-2 rounded-md bg-green-900/50 border border-green-500 text-xs text-green-200 font-mono"
                  >
                    Δ{String.fromCharCode(65 + item.row)}{item.col + 1} = {item.value}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Delta table on synthesis step */}
          {step.deltaTable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
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
              <p className="text-xs text-slate-400 mt-2">
                "-" = case basique. Δ négatif = amélioration possible. Case jaune = variable entrante.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Display theta calculation - Stepping-Stone substitution only */}
      {step.cycle && step.message.includes('θ') && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-semibold text-emerald-300 mb-2">Quantité θ (Theta)</h3>
          
          {/* Cycle breakdown - Show cells one by one */}
          {step.cycle && step.cycle.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">Cycle de substitution:</p>
              <div className="flex flex-wrap gap-2">
                {step.cycle.map((pos, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`px-3 py-2 rounded-md border text-xs font-mono ${
                      idx % 2 === 0
                        ? 'bg-green-900/50 border-green-600 text-green-300'
                        : 'bg-red-900/50 border-red-600 text-red-300'
                    }`}
                  >
                    <div className="font-bold">{String.fromCharCode(65 + pos.row)}{pos.col + 1}</div>
                    <div className="text-xs mt-1">{idx % 2 === 0 ? '+' : '-'}θ</div>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Cases vertes (+θ): augmentation • Cases rouges (-θ): diminution
              </p>
            </div>
          )}
          
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700">
            <p className="text-sm text-slate-200">
              <strong>θ = </strong>
              {(() => {
                const match = step.message.match(/θ=\s*([\d.]+)/);
                return match ? parseFloat(match[1]).toFixed(2) : '?';
              })()}
            </p>
            {currentZ !== null && (
              <p className="text-xs text-slate-400 mt-2">
                Nouveau Z = {currentZ.toFixed(2)}
                {zGain !== null && parseFloat(zGain) !== 0 && (
                  <span className={`ml-2 ${parseFloat(zGain) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    (gain: {Math.abs(parseFloat(zGain)).toFixed(2)})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Control - comme un lecteur de musique */}
      <motion.div 
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
      >
        <motion.div 
          className="bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-full shadow-2xl shadow-sky-500/20 px-6 py-3"
          animate={{ 
            scale: isHoveringControls ? 1.05 : 1,
            boxShadow: isHoveringControls ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 30px rgba(0,0,0,0.3)"
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-4">
            {/* Skip to Start */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setI(0)}
              disabled={i === 0}
              className="p-3 rounded-full bg-slate-800 hover:bg-sky-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
              title="Retour au début"
            >
              <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </motion.button>

            {/* Previous Step */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              className="p-3 rounded-full bg-slate-800 hover:bg-sky-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
              title="Étape précédente"
            >
              <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
              </svg>
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoPlay(!autoPlay)}
              className={`p-4 rounded-full transition-all ${
                autoPlay 
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/50' 
                  : 'bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/50'
              }`}
              title={autoPlay ? "Pause" : "Lecture automatique"}
            >
              {autoPlay ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </motion.button>

            {/* Next Step */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))}
              disabled={i === steps.length - 1}
              className="p-3 rounded-full bg-slate-800 hover:bg-sky-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
              title="Étape suivante"
            >
              <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
              </svg>
            </motion.button>

            {/* Skip to End */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setI(steps.length - 1)}
              disabled={i === steps.length - 1}
              className="p-3 rounded-full bg-slate-800 hover:bg-sky-600 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
              title="Aller à la dernière étape"
            >
              <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </motion.button>
          </div>

          {/* Interval Control - Shows on hover */}
          <AnimatePresence>
            {isHoveringControls && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 pt-3 border-t border-slate-700"
              >
                <label className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                  <span>Vitesse:</span>
                  <input
                    className="w-20 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        </motion.div>

        {/* Step Counter Badge */}
        <motion.div 
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          Étape {i + 1} / {steps.length}
        </motion.div>
      </motion.div>
    </div>
  );
}
