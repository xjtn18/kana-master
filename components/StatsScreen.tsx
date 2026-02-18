import React, { useEffect, useMemo, useState } from 'react';
import { QuestionResult, GameConfig } from '../types';
import { Trophy, XCircle, Clock, CheckCircle, Home, RotateCcw, AlertTriangle, ListChecks, Timer, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import canvasConfetti from 'canvas-confetti';

interface StatsScreenProps {
  results: QuestionResult[];
  config: GameConfig;
  onRestart: () => void;
  onRetry: () => void;
  totalQuestions: number;
  completedQuestions: number;
}

const BEST_PACE_KEY = 'kana-master-best-pace-v1';

const StatsScreen: React.FC<StatsScreenProps> = ({ results, config, onRestart, onRetry, totalQuestions, completedQuestions }) => {
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  const totalAttemptedKana = results.length;
  const perfectAnswers = results.filter(r => r.mistakes === 0).length;
  const totalMistakes = results.reduce((acc, curr) => acc + curr.mistakes, 0);
  const totalTimeMs = results.reduce((acc, curr) => acc + curr.timeTaken, 0);
  const averageTime = totalAttemptedKana > 0 ? totalTimeMs / totalAttemptedKana : 0;
  const currentPaceSeconds = averageTime / 1000;
  
  // Rank and Completion Logic
  const isTimedSession = config.timeLimitSeconds !== null;
  const didFinish = completedQuestions === totalQuestions;
  const accuracy = totalAttemptedKana > 0 ? (perfectAnswers / totalAttemptedKana) * 100 : 0;
  
  let grade = 'S';
  let gradeColor = 'text-indigo-500 dark:text-indigo-400';

  if (isTimedSession && !didFinish) {
      grade = 'DNF';
      gradeColor = 'text-slate-400 dark:text-slate-500';
  } else {
      if (accuracy < 100) { grade = 'A'; gradeColor = 'text-emerald-500 dark:text-emerald-400'; }
      if (accuracy < 80) { grade = 'B'; gradeColor = 'text-blue-500 dark:text-blue-400'; }
      if (accuracy < 60) { grade = 'C'; gradeColor = 'text-yellow-500 dark:text-yellow-400'; }
      if (accuracy < 40) { grade = 'F'; gradeColor = 'text-rose-500 dark:text-rose-400'; }
  }

  // Record Tracking Logic
  useEffect(() => {
    // We only track records for successfully completed sessions
    if (!didFinish || totalAttemptedKana === 0) return;

    const savedBest = localStorage.getItem(BEST_PACE_KEY);
    const bestValue = savedBest ? parseFloat(savedBest) : Infinity;
    
    setPreviousBest(savedBest ? bestValue : null);

    // High precision comparison (ms level)
    if (currentPaceSeconds < bestValue) {
      localStorage.setItem(BEST_PACE_KEY, currentPaceSeconds.toString());
      setIsNewRecord(true);
    }
  }, [didFinish, currentPaceSeconds, totalAttemptedKana]);

  // Aggregate errors for the report. 
  const errorResults = useMemo(() => {
    const map = new Map<string, QuestionResult>();
    
    results.forEach(r => {
        if (r.mistakes > 0) {
            const key = r.char.char;
            const errorIncrement = 1;

            if (map.has(key)) {
                const existing = map.get(key)!;
                map.set(key, {
                    ...existing,
                    mistakes: existing.mistakes + errorIncrement,
                    timeTaken: existing.timeTaken + r.timeTaken
                });
            } else {
                map.set(key, {
                    ...r,
                    mistakes: errorIncrement
                });
            }
        }
    });
    
    return Array.from(map.values()).sort((a, b) => b.mistakes - a.mistakes);
  }, [results]);

  const fontClass = useMemo(() => {
    switch(config.font) {
        case 'serif': return 'font-jp-serif';
        case 'rounded': return 'font-jp-rounded';
        case 'hand': return 'font-jp-hand';
        case 'digital': return 'font-jp-digital';
        case 'future': return 'font-jp-future';
        default: return 'font-jp';
    }
  }, [config.font]);

  useEffect(() => {
    if (didFinish && (accuracy > 80 || isNewRecord)) {
        const end = Date.now() + 1000;
        const colors = isNewRecord ? ['#F59E0B', '#FCD34D', '#FFFBEB'] : ['#6366f1', '#ec4899', '#10b981'];
    
        (function frame() {
          canvasConfetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          canvasConfetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });
    
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
    }
  }, [accuracy, didFinish, isNewRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onRestart();
        if (e.key === 'Tab') {
            e.preventDefault();
            onRetry();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onRetry]);

  // Formatting Total Time
  const formatTotalTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-6 pb-12">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 transition-colors">Session Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400 transition-colors">
                    {isTimedSession && !didFinish 
                        ? "Time ran out before you could finish." 
                        : "Excellent work on completing the session."}
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                
                {/* Grade Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center col-span-1 md:col-span-1 transition-colors duration-300">
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Rank</span>
                    <span className={`font-black ${gradeColor} ${grade === 'DNF' ? 'text-4xl' : 'text-6xl'}`}>
                        {grade}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Accuracy / Completion */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center transition-colors duration-300">
                        {isTimedSession ? (
                            <>
                                <ListChecks className={`w-8 h-8 mb-3 ${didFinish ? 'text-indigo-400 dark:text-indigo-300' : 'text-slate-300 dark:text-slate-600'}`} />
                                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{completedQuestions} / {totalQuestions}</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-8 h-8 text-emerald-400 dark:text-emerald-500 mb-3" />
                                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{Math.round(accuracy)}%</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Accuracy</span>
                            </>
                        )}
                    </div>

                    {/* Total Time */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center transition-colors duration-300">
                        <Timer className="w-8 h-8 text-amber-500 dark:text-amber-400 mb-3" />
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatTotalTime(totalTimeMs)}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Total Time</span>
                    </div>

                    {/* Mistakes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center transition-colors duration-300">
                        <XCircle className="w-8 h-8 text-rose-400 dark:text-rose-500 mb-3" />
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalMistakes}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mistakes</span>
                    </div>

                    {/* Avg Pace */}
                    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center transition-all duration-300 relative ${isNewRecord ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-100 dark:ring-amber-900/20 shadow-amber-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-700'}`}>
                        <AnimatePresence>
                            {isNewRecord && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10"
                                >
                                    <Award className="w-3 h-3" /> Record
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <Clock className={`w-8 h-8 mb-3 transition-colors ${isNewRecord ? 'text-amber-500 animate-bounce' : 'text-indigo-400 dark:text-indigo-300'}`} />
                        <span className={`text-2xl font-bold tabular-nums ${isNewRecord ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {totalAttemptedKana > 0 ? (currentPaceSeconds).toFixed(2) : "0.00"}s
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Pace</span>
                    </div>
                </div>
            </div>

            {/* Error Report Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-12 transition-colors duration-300">
                <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" /> Error Report
                    </h3>
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full">
                        {errorResults.length} Items
                    </span>
                </div>
                <div className="p-6 min-h-[100px] flex items-center justify-center">
                    {errorResults.length === 0 ? (
                        <div className="text-center text-slate-400 dark:text-slate-500">
                            <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-400 dark:text-yellow-600" />
                            <p className="font-bold">Perfect Score!</p>
                            <p className="text-sm">No errors to report.</p>
                        </div>
                    ) : (
                        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {errorResults.map((res, idx) => (
                                <div key={idx} className="relative p-3 rounded-xl border-2 border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/20 flex flex-col items-center">
                                    <span className={`text-3xl mb-1 text-slate-800 dark:text-slate-100 ${fontClass}`}>{res.char.char}</span>
                                    <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">{res.char.romaji[0]}</span>
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 dark:bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {res.mistakes}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={onRestart}
                    className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 font-bold py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                    <Home className="w-5 h-5" />
                    <span>Home (Esc)</span>
                </button>

                <button
                    onClick={onRetry}
                    className="flex-1 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 dark:shadow-none transition-all flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Redo (Tab)</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default StatsScreen;