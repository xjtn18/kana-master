import React, { useEffect, useMemo } from 'react';
import { QuestionResult, GameConfig } from '../types';
import { RefreshCw, Trophy, XCircle, Clock, CheckCircle, Home, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import canvasConfetti from 'canvas-confetti';

interface StatsScreenProps {
  results: QuestionResult[];
  config: GameConfig;
  onRestart: () => void;
  onRetry: () => void;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ results, config, onRestart, onRetry }) => {
  
  const totalQuestions = results.length;
  const perfectAnswers = results.filter(r => r.mistakes === 0).length;
  const totalMistakes = results.reduce((acc, curr) => acc + curr.mistakes, 0);
  const totalTimeMs = results.reduce((acc, curr) => acc + curr.timeTaken, 0);
  const averageTime = totalTimeMs / totalQuestions;
  
  // Calculate grade
  const accuracy = (perfectAnswers / totalQuestions) * 100;
  let grade = 'S';
  let gradeColor = 'text-indigo-500';
  if (accuracy < 100) { grade = 'A'; gradeColor = 'text-emerald-500'; }
  if (accuracy < 80) { grade = 'B'; gradeColor = 'text-blue-500'; }
  if (accuracy < 60) { grade = 'C'; gradeColor = 'text-yellow-500'; }
  if (accuracy < 40) { grade = 'F'; gradeColor = 'text-rose-500'; }

  // Aggregate errors for the report. 
  // We only count 1 mistake per question-kana instance to avoid skewing stats if user keysmashes.
  const errorResults = useMemo(() => {
    const map = new Map<string, QuestionResult>();
    
    results.forEach(r => {
        if (r.mistakes > 0) {
            const key = r.char.char;
            
            // For the error report, we consider "Did the user fail this char in this question?" 
            // rather than "How many times did they fail". 
            // So we add 1 to the mistake count if mistakes > 0.
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
                    mistakes: errorIncrement // Initialize with 1 error for this occurrence
                });
            }
        }
    });
    
    // Convert to array and sort by mistakes descending
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
    if (accuracy > 80) {
        const end = Date.now() + 1000;
        const colors = ['#6366f1', '#ec4899', '#10b981'];
    
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
  }, [accuracy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onRestart();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            onRetry();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onRetry]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h2>
        <p className="text-slate-500">Here is how you performed</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        
        {/* Grade Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center col-span-1 md:col-span-1">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Rank</span>
            <span className={`text-6xl font-black ${gradeColor}`}>{grade}</span>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
                <span className="text-2xl font-bold text-slate-800">{Math.round(accuracy)}%</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <XCircle className="w-8 h-8 text-rose-400 mb-3" />
                <span className="text-2xl font-bold text-slate-800">{totalMistakes}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mistakes</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-indigo-400 mb-3" />
                <span className="text-2xl font-bold text-slate-800">{(averageTime / 1000).toFixed(1)}s</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Pace</span>
            </div>
        </div>
      </div>

      {/* Error Report Breakdown */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-12">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" /> Error Report
            </h3>
            <span className="text-xs font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded-full">
                {errorResults.length} Items
            </span>
        </div>
        <div className="p-6 min-h-[100px] flex items-center justify-center">
            {errorResults.length === 0 ? (
                <div className="text-center text-slate-400">
                    <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
                    <p className="font-bold">Perfect Score!</p>
                    <p className="text-sm">No errors to report.</p>
                </div>
            ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {errorResults.map((res, idx) => (
                        <div key={idx} className="relative p-3 rounded-xl border-2 border-rose-100 bg-rose-50 flex flex-col items-center">
                            <span className={`text-3xl mb-1 text-slate-800 ${fontClass}`}>{res.char.char}</span>
                            <span className="text-xs font-bold uppercase text-slate-400">{res.char.romaji[0]}</span>
                            <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-bold py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
        >
            <Home className="w-5 h-5" />
            <span>Home (Esc)</span>
        </button>

        <button
            onClick={onRetry}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
        >
            <RotateCcw className="w-5 h-5" />
            <span>Redo (Tab)</span>
        </button>
      </div>
    </div>
  );
};

export default StatsScreen;