import React, { useState } from 'react';
import ConfigScreen from './components/ConfigScreen';
import QuizScreen from './components/QuizScreen';
import StatsScreen from './components/StatsScreen';
import { GameConfig, QuestionResult } from './types';

type AppState = 'config' | 'quiz' | 'stats';

function App() {
  const [gameState, setGameState] = useState<AppState>('config');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const handleStart = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameState('quiz');
  };

  const handleComplete = (gameResults: QuestionResult[]) => {
    setResults(gameResults);
    setGameState('stats');
  };

  const handleRestart = () => {
    setGameState('config');
    setResults([]);
    setConfig(null);
  };

  const handleRetry = () => {
    setResults([]);
    setGameState('quiz');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Optional Header */}
      <header className="p-4 flex justify-center shrink-0 z-10">
         {gameState !== 'config' && (
            <div className="text-xl font-black text-slate-300 font-jp tracking-tight cursor-default select-none">
                かなマスター
            </div>
         )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative">
        {gameState === 'config' && <ConfigScreen onStart={handleStart} />}
        
        {gameState === 'quiz' && config && (
          <QuizScreen config={config} onComplete={handleComplete} onExit={handleRestart} />
        )}

        {gameState === 'stats' && config && (
          <StatsScreen results={results} config={config} onRestart={handleRestart} onRetry={handleRetry} />
        )}
      </main>

      <footer className="p-4 pb-6 text-center text-slate-300 text-sm font-medium shrink-0 z-10">
        &copy; {new Date().getFullYear()} Kana Master • Strict Mode Training
      </footer>
    </div>
  );
}

export default App;