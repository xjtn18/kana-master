import React, { useState, useEffect } from "react";
import ConfigScreen from "./components/ConfigScreen";
import QuizScreen from "./components/QuizScreen";
import FlashcardScreen from "./components/FlashcardScreen";
import StatsScreen from "./components/StatsScreen";
import { GameConfig, QuestionResult } from "./types";
import { Moon, Sun } from "lucide-react";

type AppState = "config" | "quiz" | "stats";

function App() {
  const [gameState, setGameState] = useState<AppState>("config");
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [completionStats, setCompletionStats] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });

  // Theme Management
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("kana-master-theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kana-master-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kana-master-theme", "light");
    }
  }, [isDark]);

  const handleStart = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameState("quiz");
  };

  const handleComplete = (
    gameResults: QuestionResult[],
    total: number,
    completed: number,
  ) => {
    setResults(gameResults);
    setCompletionStats({ completed, total });
    setGameState("stats");
  };

  const handleRestart = () => {
    setGameState("config");
    setResults([]);
    setConfig(null);
  };

  const handleRetry = () => {
    setResults([]);
    setGameState("quiz");
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-neutral-900 transition-colors duration-300 overflow-hidden">
      {/* App Header */}
      <header className="p-4 flex items-center justify-between shrink-0 z-50 relative">
        <div className="w-10"></div> {/* Spacer for symmetry */}
        {gameState !== "config" ? (
          <div className="text-xl font-black text-slate-300 dark:text-slate-700 font-jp tracking-tight cursor-default select-none transition-colors">
            かなマスター
          </div>
        ) : (
          <div className="w-10"></div>
        )}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-sm transition-all"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative px-4 overflow-hidden">
        {gameState === "config" && <ConfigScreen onStart={handleStart} />}

        {gameState === "quiz" && config && config.mode === "flashcard" ? (
          <FlashcardScreen config={config} onExit={handleRestart} />
        ) : (
          gameState === "quiz" &&
          config && (
            <QuizScreen
              config={config}
              onComplete={handleComplete}
              onExit={handleRestart}
            />
          )
        )}

        {gameState === "stats" && config && (
          <StatsScreen
            results={results}
            config={config}
            onRestart={handleRestart}
            onRetry={handleRetry}
            totalQuestions={completionStats.total}
            completedQuestions={completionStats.completed}
          />
        )}
      </main>

      <footer className="p-4 pb-6 text-center text-slate-300 dark:text-slate-700 text-sm font-medium shrink-0 z-10 select-none transition-colors">
        &copy; {new Date().getFullYear()} Kana Master • Strict Mode Training
      </footer>
    </div>
  );
}

export default App;
