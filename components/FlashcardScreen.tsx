import React, { useState, useEffect, useMemo } from "react";
import { GameConfig, VocabCard, KanaFont } from "../types";
import { getRandomVocabCards } from "../data/kanji";
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlashcardScreenProps {
  config: GameConfig;
  onExit: () => void;
}

const FlashcardScreen: React.FC<FlashcardScreenProps> = ({
  config,
  onExit,
}) => {
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const fontClass = useMemo(() => {
    switch (config.font) {
      case "serif":
        return "font-jp-serif";
      case "rounded":
        return "font-jp-rounded";
      case "hand":
        return "font-jp-hand";
      case "digital":
        return "font-jp-digital";
      case "future":
        return "font-jp-future";
      default:
        return "font-jp";
    }
  }, [config.font]);

  useEffect(() => {
    const count = config.questionCount === "all" ? 50 : config.questionCount;
    const selectedCards = getRandomVocabCards(count as number);
    setCards(selectedCards);
  }, [config.questionCount]);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection("right");
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection("left");
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      handleFlip();
    } else if (e.key === "Escape") {
      onExit();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [currentIndex, isFlipped]);

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full flex justify-between items-center mb-8 text-slate-500 dark:text-slate-400 font-medium transition-colors">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            title="Exit Flashcards"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <div className="text-sm text-slate-400 dark:text-slate-500">
          Press Space/Right to flip • Arrow keys to navigate
        </div>
      </div>

      <div className="w-full mb-8">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction === "right" ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === "right" ? -100 : 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full"
          >
            <div
              onClick={handleFlip}
              className="w-full min-h-[350px] bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 md:p-12 cursor-pointer transition-all duration-150 hover:shadow-3xl hover:border-indigo-200 dark:hover:border-indigo-700"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 dark:bg-slate-900/10 rounded-full opacity-30"></div>
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-50 dark:bg-slate-900/10 rounded-full opacity-30"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center min-h-[250px]">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="front"
                      initial={{ opacity: 0, rotateX: -90 }}
                      animate={{ opacity: 1, rotateX: 0 }}
                      exit={{ opacity: 0, rotateX: 90 }}
                      transition={{ duration: 0.15 }}
                      className="text-center"
                    >
                      <div
                        className={`text-7xl md:text-8xl font-bold text-slate-800 dark:text-slate-100 ${fontClass} mb-4`}
                      >
                        {currentCard.kanji}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                        <Eye className="w-4 h-4" />
                        <span>Click to reveal</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ opacity: 0, rotateX: 90 }}
                      animate={{ opacity: 1, rotateX: 0 }}
                      exit={{ opacity: 0, rotateX: -90 }}
                      transition={{ duration: 0.15 }}
                      className="text-center"
                    >
                      <div
                        className={`text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400 ${fontClass} mb-6`}
                      >
                        {currentCard.reading}
                      </div>
                      <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium max-w-md">
                        {currentCard.meaning}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-sm mt-6">
                        <EyeOff className="w-4 h-4" />
                        <span>Click to hide</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-4 rounded-2xl transition-all ${
            currentIndex === 0
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-lg"
          }`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={handleFlip}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{isFlipped ? "Hide" : "Reveal"}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className={`p-4 rounded-2xl transition-all ${
            currentIndex === cards.length - 1
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-lg"
          }`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-8 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </div>
  );
};

export default FlashcardScreen;
