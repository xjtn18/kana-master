import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GameConfig,
  KanaChar,
  QuestionResult,
  DistributionMode,
} from "../types";
import {
  getKanaPool,
  getWeightedRandomItem,
  getWeightedSubset,
  getUniformSubset,
} from "../data/kana";
import {
  Timer,
  X,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GREEN = "3FB061";
const ORANGE_GREEN = "ADD164";
const ORANGE = "FFC64F";

interface QuizScreenProps {
  onComplete: (
    results: QuestionResult[],
    totalQuestions: number,
    completedCount: number,
  ) => void;
  onExit: () => void;
  config: GameConfig;
}

const cartesian = (arrays: string[][]): string[] => {
  return arrays.reduce<string[]>(
    (results, append) => {
      return results
        .map((result) => append.map((item) => result + item))
        .flat();
    },
    [""],
  );
};

const QuizScreen: React.FC<QuizScreenProps> = ({
  config,
  onComplete,
  onExit,
}) => {
  // Game State
  const [questions, setQuestions] = useState<KanaChar[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Input State
  const [currentInput, setCurrentInput] = useState("");
  const [completedIndex, setCompletedIndex] = useState(0);
  const [committedSegments, setCommittedSegments] = useState<string[]>([]);

  const [results, setResults] = useState<QuestionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    config.timeLimitSeconds,
  );
  const [isError, setIsError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Track mistakes per part index for the current question
  const [partMistakes, setPartMistakes] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine Font Class
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

  const isYoon = (c: KanaChar) => c.char.length > 1;

  /**
   * Helper to pick a character based on balanced script logic
   */
  const pickCharacter = (
    hPool: KanaChar[],
    kPool: KanaChar[],
    distribution: DistributionMode,
  ): KanaChar | null => {
    let poolToUse: KanaChar[];
    if (hPool.length > 0 && kPool.length > 0) {
      poolToUse = Math.random() < 0.5 ? hPool : kPool;
    } else {
      poolToUse = hPool.length > 0 ? hPool : kPool;
    }
    if (poolToUse.length === 0) return null;
    if (distribution === "frequency") {
      return getWeightedRandomItem(poolToUse);
    } else {
      return poolToUse[Math.floor(Math.random() * poolToUse.length)];
    }
  };

  /**
   * Biased sampler for single/feed mode
   * @param yoonChance Probability (0.0 - 1.0) of selecting a Yōon character when available.
   */
  const getBiasedSample = (
    hPool: KanaChar[],
    kPool: KanaChar[],
    count: number,
    distribution: DistributionMode,
    yoonChance: number = 0.2,
  ): KanaChar[] => {
    const results: KanaChar[] = [];
    const hYoon = hPool.filter(isYoon);
    const hBasic = hPool.filter((c) => !isYoon(c));
    const kYoon = kPool.filter(isYoon);
    const kBasic = kPool.filter((c) => !isYoon(c));

    for (let i = 0; i < count; i++) {
      let currentHPool: KanaChar[] = [];
      let currentKPool: KanaChar[] = [];
      const hasY = hYoon.length > 0 || kYoon.length > 0;
      const hasB = hBasic.length > 0 || kBasic.length > 0;

      // Use the provided yoonChance to bias towards complex characters or stay simple
      const allowYoon = hasY && (!hasB || Math.random() < yoonChance);

      if (allowYoon) {
        currentHPool = hYoon;
        currentKPool = kYoon;
      } else {
        currentHPool = hBasic;
        currentKPool = kBasic;
      }

      const selected = pickCharacter(currentHPool, currentKPool, distribution);
      if (selected) {
        results.push(selected);
        [hYoon, hBasic, kYoon, kBasic].forEach((p) => {
          const idx = p.indexOf(selected);
          if (idx > -1) p.splice(idx, 1);
        });
      } else {
        const fallback = pickCharacter(
          [...hYoon, ...hBasic],
          [...kYoon, ...kBasic],
          distribution,
        );
        if (fallback) {
          results.push(fallback);
          [hYoon, hBasic, kYoon, kBasic].forEach((p) => {
            const idx = p.indexOf(fallback);
            if (idx > -1) p.splice(idx, 1);
          });
        } else {
          break;
        }
      }
    }
    return results;
  };

  // Initialize Questions
  useEffect(() => {
    const hPool = getKanaPool(["hiragana"], config.selectedGroups);
    const kPool = getKanaPool(["katakana"], config.selectedGroups);

    if (hPool.length === 0 && kPool.length === 0) {
      onExit();
      return;
    }

    let finalQuestionsToSet: KanaChar[] = [];
    const targetCount =
      config.questionCount === "all"
        ? hPool.length + kPool.length
        : config.questionCount;

    // TYPEWRITER MODE: Force strictly character-by-character feed of the requested count
    if (config.layout === "feed") {
      let selectedQuestions: KanaChar[] = [];
      if (config.questionCount === "all") {
        selectedQuestions = [...hPool, ...kPool].sort(
          () => Math.random() - 0.5,
        );
      } else {
        // Lowered Yōon chance specifically for typewriter to 10% (1 in 10)
        selectedQuestions = getBiasedSample(
          hPool,
          kPool,
          targetCount,
          config.distribution,
          0.1,
        );
      }

      finalQuestionsToSet = [
        {
          char: selectedQuestions.map((q) => q.char).join(""),
          romaji: [],
          type: selectedQuestions[0]?.type || "hiragana",
          parts: selectedQuestions,
        },
      ];
    } else if (config.mode === "single") {
      let selectedQuestions: KanaChar[] = [];
      if (config.questionCount === "all") {
        selectedQuestions = [...hPool, ...kPool].sort(
          () => Math.random() - 0.5,
        );
      } else {
        // Lowered Yōon chance for single mode to 15%
        selectedQuestions = getBiasedSample(
          hPool,
          kPool,
          targetCount,
          config.distribution,
          0.15,
        );
      }
      finalQuestionsToSet = selectedQuestions.map((q) => ({
        ...q,
        parts: [q],
      }));
    } else {
      const count = config.questionCount === "all" ? 50 : config.questionCount;
      const generatedQuestions: KanaChar[] = [];
      let lengths: number[] = [];
      if (config.timeLimitSeconds !== null) {
        const groups = Math.floor(count / 3);
        const remainder = count % 3;
        for (let i = 0; i < groups; i++) lengths.push(2, 3, 4);
        for (let i = 0; i < remainder; i++) lengths.push(3);
        lengths.sort(() => Math.random() - 0.5);
      } else {
        for (let i = 0; i < count; i++)
          lengths.push(Math.floor(Math.random() * 3) + 2);
      }

      for (let i = 0; i < count; i++) {
        const length = lengths[i];
        const selectedChars: KanaChar[] = [];
        let wordSpecificHPool = hPool;
        let wordSpecificKPool = kPool;

        if (!config.allowMultiScriptWords) {
          const useHiragana =
            hPool.length > 0 && kPool.length > 0
              ? Math.random() < 0.5
              : hPool.length > 0;
          if (useHiragana) wordSpecificKPool = [];
          else wordSpecificHPool = [];
        }

        let hasYoonInWord = false;
        for (let j = 0; j < length; j++) {
          let currentHPool = wordSpecificHPool;
          let currentKPool = wordSpecificKPool;
          if (hasYoonInWord) {
            currentHPool = currentHPool.filter((c) => !isYoon(c));
            currentKPool = currentKPool.filter((c) => !isYoon(c));
          } else {
            const allAvailable = [...currentHPool, ...currentKPool];
            const hasBasic = allAvailable.some((c) => !isYoon(c));
            const hasYoon = allAvailable.some(isYoon);
            if (hasBasic && hasYoon && Math.random() > 0.25) {
              currentHPool = currentHPool.filter((c) => !isYoon(c));
              currentKPool = currentKPool.filter((c) => !isYoon(c));
            }
          }
          const char = pickCharacter(
            currentHPool,
            currentKPool,
            config.distribution,
          );
          if (char) {
            selectedChars.push(char);
            if (isYoon(char)) hasYoonInWord = true;
          }
        }
        if (selectedChars.length > 0) {
          generatedQuestions.push({
            char: selectedChars.map((c) => c.char).join(""),
            romaji: cartesian(selectedChars.map((c) => c.romaji)),
            type: selectedChars[0].type,
            parts: selectedChars,
          });
        }
      }
      finalQuestionsToSet = generatedQuestions;
    }

    setQuestions(finalQuestionsToSet);
    setStartTime(Date.now());
    setPartMistakes([]);
  }, [config]);

  // Initialize partMistakes
  useEffect(() => {
    if (questions[currentIndex]?.parts) {
      setPartMistakes(new Array(questions[currentIndex].parts!.length).fill(0));
    }
  }, [currentIndex, questions]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Focus input loop
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (!isCorrect) {
        inputRef.current?.focus();
      }
    }, 100);
    return () => clearInterval(focusInterval);
  }, [isCorrect]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  const getFontSize = (partsCount: number) => {
    if (config.layout === "feed") return "text-[5rem]";
    const base = 5;
    const drop = 0.45;
    const size = Math.max(2.8, base - (partsCount - 1) * drop);
    return `text-[${size}rem]`;
  };

  const handleFinish = () => {
    if (config.layout === "feed" && currentQuestion) {
      onComplete(results, currentQuestion.parts?.length || 0, completedIndex);
    } else {
      onComplete(results, questions.length, currentIndex + (isCorrect ? 1 : 0));
    }
  };

  const nextQuestion = () => {
    const now = Date.now();
    const totalTimeTaken = now - startTime;
    const newResultsForThisQuestion: QuestionResult[] = [];

    if (currentQuestion.parts) {
      const timePerChar = totalTimeTaken / currentQuestion.parts.length;
      currentQuestion.parts.forEach((part, idx) => {
        newResultsForThisQuestion.push({
          char: part,
          mistakes: partMistakes[idx] || 0,
          timeTaken: timePerChar,
        });
      });
    }

    const updatedResults = [...results, ...newResultsForThisQuestion];
    setResults(updatedResults);

    if (currentIndex + 1 >= questions.length) {
      if (config.layout === "feed" && currentQuestion) {
        onComplete(
          updatedResults,
          currentQuestion.parts?.length || 0,
          currentQuestion.parts?.length || 0,
        );
      } else {
        onComplete(updatedResults, questions.length, questions.length);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStartTime(Date.now());
      setIsError(false);
      setIsCorrect(false);
      setCompletedIndex(0);
      setCurrentInput("");
      setCommittedSegments([]);
    }
  };

  const clearError = () => {
    setIsError(false);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  };

  const triggerError = (overrideActiveIndex?: number) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    const errorIndex =
      overrideActiveIndex !== undefined ? overrideActiveIndex : completedIndex;
    setPartMistakes((prev) => {
      const next = [...prev];
      if (errorIndex < next.length) {
        next[errorIndex] = (next[errorIndex] || 0) + 1;
      }
      return next;
    });
    setIsError(false);
    if (config.redoOnError) {
      setCompletedIndex(0);
      setCurrentInput("");
      setCommittedSegments([]);
    }
    setTimeout(() => {
      setIsError(true);
      errorTimeoutRef.current = setTimeout(() => {
        setIsError(false);
        errorTimeoutRef.current = null;
      }, 500);
    }, 10);
  };

  const handleSuccess = () => {
    setIsCorrect(true);
    const delay = config.layout === "feed" ? 0 : NEXT_QUESTION_DELAY_MS;
    setTimeout(() => {
      nextQuestion();
    }, delay);
  };

  const handlePartCompletion = (segment: string) => {
    const nextIndex = completedIndex + 1;
    setCommittedSegments((prev) => [...prev, segment]);
    setCompletedIndex(nextIndex);
    setCurrentInput("");
    if (nextIndex >= (questions[currentIndex].parts?.length || 0)) {
      handleSuccess();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCorrect) return;
    if (!/^[a-zA-Z]*$/.test(e.target.value)) return;
    const val = e.target.value;
    if (val.length > 3) return;
    const lowerVal = val.toLowerCase();
    if (!config.autoCheck) {
      setCurrentInput(lowerVal);
      return;
    }
    const currentPart = questions[currentIndex].parts![completedIndex];
    const isValidPrefix = currentPart.romaji.some((r) =>
      r.startsWith(lowerVal),
    );
    if (!isValidPrefix) {
      triggerError(completedIndex);
      return;
    }
    setCurrentInput(lowerVal);
    if (currentPart.romaji.includes(lowerVal)) {
      handlePartCompletion(lowerVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCorrect) {
      e.preventDefault();
      return;
    }
    if (isError) clearError();
    if (e.key === "Escape") {
      onExit();
      return;
    }
    if (e.key === "Enter" && !config.autoCheck) {
      e.preventDefault();
      const currentPart = questions[currentIndex].parts![completedIndex];
      if (currentPart.romaji.includes(currentInput)) {
        handlePartCompletion(currentInput);
      } else {
        triggerError(completedIndex);
        setCurrentInput("");
      }
    }
  };

  if (!currentQuestion)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    );

  const ANIMATION_CORRECT_DELAY_S = config.mode === "multi" ? 0.15 : 0;
  const NEXT_QUESTION_DELAY_MS =
    (config.timeLimitSeconds === null ? 500 : 300) +
    ANIMATION_CORRECT_DELAY_S * 1000;
  const animation_correct_rotation_degree = config.mode === "multi" ? -4 : 0;
  const animation_correct_transpose_y =
    (config.font === "sans" ? 0 : 1) - (config.mode === "multi" ? 20 : 0);
  const animation_correct_transpose_x = config.mode === "multi" ? -8 : 0;

  // Typewriter (Feed) Layout Rendering
  const renderFeedLayout = () => {
    const parts = currentQuestion.parts || [];
    return (
      <div className="w-full flex flex-col items-center justify-center h-full relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-indigo-500/20 rounded-2xl pointer-events-none z-10" />

        <motion.div
          className={`flex items-center absolute left-1/2 ${fontClass} ${getFontSize(parts.length)} font-bold selection:bg-transparent`}
          animate={{ x: `calc(-${completedIndex * 1.4}em - 0.7em)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ transformOrigin: "center left" }}
        >
          {parts.map((part, idx) => {
            const isDone = idx < completedIndex;
            const isHot = idx === completedIndex;

            // Slightly more opaque and higher contrast for upcoming characters
            let colorClass = "text-slate-400 dark:text-slate-600 opacity-60";
            if (isDone) colorClass = "text-emerald-500 opacity-100";
            if (isHot) {
              colorClass = getKanaColorClass(part, idx);
              if (isError) colorClass = "text-rose-500";
            }

            return (
              <span
                key={idx}
                className={`w-[1.4em] text-center transition-all duration-300 ${colorClass} ${isHot ? "scale-125" : "scale-100"}`}
              >
                {part.char}

                {isHot && !isCorrect && (
                  <div className="absolute top-full -mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center pt-3">
                    <div className="text-xl font-mono text-indigo-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg shadow-lg border border-indigo-100 dark:border-indigo-900 flex items-center min-w-[2rem] justify-center">
                      {currentInput}
                      <span className="w-1 h-5 bg-indigo-500 ml-1 animate-cursor-blink" />
                    </div>
                    {committedSegments[idx] && (
                      <div className="mt-2 text-emerald-500 font-mono text-lg">
                        {committedSegments[idx]}
                      </div>
                    )}
                  </div>
                )}

                {isDone && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-emerald-500/50 font-mono text-sm uppercase tracking-tighter">
                    {committedSegments[idx]}
                  </div>
                )}
              </span>
            );
          })}
        </motion.div>
      </div>
    );
  };

  const getKanaColorClass = (part: any, current_index: number) => {
    if (current_index < completedIndex)
      return `text-[#${GREEN}] dark:text-emerald-400`;
    else if (current_index === completedIndex && config.autoCheck) {
      const isValidStart = part.romaji.some((r) => r.startsWith(currentInput));
      if (isValidStart && currentInput.length > 0) {
        return currentInput.length >= 2
          ? `text-[#${ORANGE_GREEN}] dark:text-lime-400`
          : `text-[#${ORANGE}] dark:text-amber-400`;
      }
    } else {
      return "text-slate-800 dark:text-slate-100";
    }
  };

  const renderCenteredLayout = () => {
    const parts = currentQuestion.parts || [];
    return (
      <div className="relative z-10 p-16 flex items-center justify-center w-full h-full min-h-[300px]">
        <motion.div
          animate={
            isCorrect
              ? {
                  scale: 1.25,
                  rotate: animation_correct_rotation_degree,
                  y: animation_correct_transpose_y,
                  x: animation_correct_transpose_x,
                }
              : { scale: 1, rotate: 0, y: 0 }
          }
          transition={{
            type: "tween",
            ease: "circOut",
            duration: 0.15,
            delay: ANIMATION_CORRECT_DELAY_S,
          }}
          className={`${getFontSize(parts.length)} ${fontClass} font-bold leading-none selection:bg-transparent flex flex-nowrap justify-center tracking-wider gap-1 transition-colors`}
        >
          {parts.map((part, index) => {
            const isActive = index === completedIndex && !isCorrect;
            const isCompleted = index < completedIndex;

            const colorClass = getKanaColorClass(part, index);

            return (
              <span
                key={index}
                className={`transition-colors duration-200 ${colorClass} relative flex flex-col items-center px-[0.05em] whitespace-nowrap`}
              >
                {part.char}
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1.2 }}
                    className="absolute top-full mt-4 text-emerald-500/80 dark:text-emerald-400/80 font-mono text-lg font-bold"
                  >
                    {committedSegments[index]}
                  </motion.div>
                )}
                {isActive && (
                  <>
                    <motion.div
                      layoutId="active-kana-indicator"
                      className="absolute left-0 right-0 mx-auto bg-indigo-300 dark:bg-indigo-500 rounded-full"
                      style={{
                        bottom: "-0.25em",
                        height: "0.08em",
                        width: "80%",
                      }}
                    />
                    <motion.div
                      layoutId="floating-input-tooltip"
                      className={`absolute top-full mt-5 min-w-[3rem] px-4 py-2 rounded-xl flex items-center justify-center text-xl font-mono shadow-xl border-2 z-50 whitespace-nowrap transition-colors duration-300 ${isError ? "bg-rose-500 border-rose-400 text-white animate-shake" : "bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600 text-white"}`}
                      initial={
                        completedIndex === 0 && currentInput.length === 0
                          ? { opacity: 0, y: 10 }
                          : false
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    >
                      <div
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-l-2 border-t-2 transition-colors duration-300 ${isError ? "bg-rose-500 border-rose-400" : "bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600"}`}
                      ></div>
                      <span className="leading-none relative z-10 font-mono tracking-wider">
                        {currentInput}
                      </span>
                      {!isCorrect && (
                        <span
                          key={currentInput}
                          className="w-[2px] h-[1.2em] bg-white ml-[1px] animate-cursor-blink inline-block align-middle shadow-[0_0_2px_rgba(255,255,255,0.5)] relative z-10"
                        />
                      )}
                    </motion.div>
                  </>
                )}
              </span>
            );
          })}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full flex justify-between items-center mb-12 text-slate-500 dark:text-slate-400 font-medium transition-colors">
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            title="Exit Quiz"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
            {config.layout === "feed"
              ? `${completedIndex + 1} / ${currentQuestion.parts?.length || 0}`
              : `${currentIndex + 1} / ${questions.length}`}
          </span>
        </div>
        {config.timeLimitSeconds !== null && (
          <div
            className={`flex items-center space-x-2 transition-colors ${timeLeft && timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-slate-500"}`}
          >
            <Timer className="w-5 h-5" />
            <span className="tabular-nums text-lg font-bold">{timeLeft}s</span>
          </div>
        )}
      </div>

      <div
        className="relative w-full max-w-2xl cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isCorrect}
          className="absolute opacity-0 w-1 h-1 -z-10"
          autoFocus
          autoComplete="off"
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={
              config.layout === "centered"
                ? { opacity: 0, scale: 0.9, rotateX: -15 }
                : { opacity: 0 }
            }
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={
              config.layout === "centered"
                ? {
                    opacity: 0,
                    scale: 1.1,
                    filter: "blur(10px)",
                    transition: { duration: 0.15 },
                  }
                : { opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`${config.layout === "centered" ? "bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 min-h-[300px]" : "h-[300px] w-full"} mb-10 relative transition-colors duration-300 flex items-center justify-center`}
          >
            {config.layout === "centered" && (
              <>
                <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500 dark:bg-indigo-400"></div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 dark:bg-slate-900/10 rounded-full opacity-50"></div>
                </div>
                {renderCenteredLayout()}
              </>
            )}

            {config.layout === "feed" && renderFeedLayout()}

            <AnimatePresence>
              {isError && config.redoOnError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-rose-500/10 rounded-[3rem] flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold uppercase tracking-widest text-sm"
                  >
                    <RotateCcw className="w-5 h-5 animate-spin-reverse" />
                    <span>Try Again</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none flex items-end justify-end z-20 overflow-hidden rounded-[3rem] p-6">
              <AnimatePresence>
                {isCorrect && config.layout !== "feed" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: 45, y: 10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="text-emerald-500 dark:text-emerald-400 drop-shadow-xl"
                  >
                    <Check className="w-24 h-24" strokeWidth={4} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="h-12 mt-4 text-center text-slate-400 text-sm font-medium">
          {!config.autoCheck && !isCorrect && (
            <span className="animate-pulse">Type & Press Enter</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;

