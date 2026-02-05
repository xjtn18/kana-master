import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameConfig, KanaChar, QuestionResult, DistributionMode } from '../types';
import { getKanaPool, getWeightedRandomItem, getWeightedSubset, getUniformSubset } from '../data/kana';
import { Timer, X, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GREEN        = "3FB061";
const ORANGE_GREEN = "ADD164";
const ORANGE       = "FFC64F";

interface QuizScreenProps {
  onComplete: (results: QuestionResult[], totalQuestions: number, completedCount: number) => void;
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
        [''] 
    );
};

const QuizScreen: React.FC<QuizScreenProps> = ({ config, onComplete, onExit }) => {
  // Game State
  const [questions, setQuestions] = useState<KanaChar[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Input State (Refactored for per-kana validation)
  const [currentInput, setCurrentInput] = useState('');
  const [completedIndex, setCompletedIndex] = useState(0);
  const [committedSegments, setCommittedSegments] = useState<string[]>([]);

  const [results, setResults] = useState<QuestionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(config.timeLimitSeconds);
  const [isError, setIsError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Track mistakes per part index for the current question
  const [partMistakes, setPartMistakes] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine Font Class
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

  const isYoon = (c: KanaChar) => c.char.length > 1;

  /**
   * Helper to pick a character based on balanced script logic (Option B)
   */
  const pickCharacter = (hPool: KanaChar[], kPool: KanaChar[], distribution: DistributionMode): KanaChar | null => {
    let poolToUse: KanaChar[];
    
    // Balanced "Coin Flip" - if both pools are available, pick one 50/50
    if (hPool.length > 0 && kPool.length > 0) {
        poolToUse = Math.random() < 0.5 ? hPool : kPool;
    } else {
        poolToUse = hPool.length > 0 ? hPool : kPool;
    }

    if (poolToUse.length === 0) return null;

    if (distribution === 'frequency') {
        return getWeightedRandomItem(poolToUse);
    } else {
        return poolToUse[Math.floor(Math.random() * poolToUse.length)];
    }
  };

  /**
   * Biased sampler for single mode to respect the ~25% yoon frequency request
   */
  const getBiasedSample = (hPool: KanaChar[], kPool: KanaChar[], count: number, distribution: DistributionMode): KanaChar[] => {
      const results: KanaChar[] = [];
      const hYoon = hPool.filter(isYoon);
      const hBasic = hPool.filter(c => !isYoon(c));
      const kYoon = kPool.filter(isYoon);
      const kBasic = kPool.filter(c => !isYoon(c));

      for (let i = 0; i < count; i++) {
          // Determine script pool first
          let currentHPool: KanaChar[] = [];
          let currentKPool: KanaChar[] = [];

          const hasY = hYoon.length > 0 || kYoon.length > 0;
          const hasB = hBasic.length > 0 || kBasic.length > 0;

          // Only apply 25% bias if both yoon and basic options are actually available
          const allowYoon = hasY && (!hasB || Math.random() < 0.25);

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
              // Remove selected from source pools (sampling without replacement)
              [hYoon, hBasic, kYoon, kBasic].forEach(p => {
                  const idx = p.indexOf(selected);
                  if (idx > -1) p.splice(idx, 1);
              });
          } else {
              // If we couldn't pick the preferred type (maybe preferred pool ran out), try picking anything left
              const fallback = pickCharacter([...hYoon, ...hBasic], [...kYoon, ...kBasic], distribution);
              if (fallback) {
                  results.push(fallback);
                  [hYoon, hBasic, kYoon, kBasic].forEach(p => {
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
    const hPool = getKanaPool(['hiragana'], config.selectedGroups);
    const kPool = getKanaPool(['katakana'], config.selectedGroups);

    if (hPool.length === 0 && kPool.length === 0) {
        onExit(); 
        return;
    }

    if (config.mode === 'single') {
        const sliceCount = config.questionCount === 'all' ? (hPool.length + kPool.length) : config.questionCount;
        let selectedQuestions: KanaChar[] = [];

        if (config.questionCount === 'all') {
            selectedQuestions = [...hPool, ...kPool].sort(() => Math.random() - 0.5);
        } else {
            selectedQuestions = getBiasedSample(hPool, kPool, sliceCount, config.distribution);
        }
        
        const finalQuestions = selectedQuestions.map(q => ({
            ...q,
            parts: [q]
        }));
        
        setQuestions(finalQuestions);
    } else {
        // Multi mode
        const count = config.questionCount === 'all' ? 50 : config.questionCount; 
        const generatedQuestions: KanaChar[] = [];

        // Determine word lengths
        let lengths: number[] = [];
        if (config.timeLimitSeconds !== null) {
            const groups = Math.floor(count / 3);
            const remainder = count % 3;
            for (let i = 0; i < groups; i++) lengths.push(2, 3, 4);
            for (let i = 0; i < remainder; i++) lengths.push(3);
            lengths.sort(() => Math.random() - 0.5);
        } else {
            for (let i = 0; i < count; i++) {
                lengths.push(Math.floor(Math.random() * 3) + 2);
            }
        }

        for (let i = 0; i < count; i++) {
            const length = lengths[i];
            const selectedChars: KanaChar[] = [];
            
            // Script constraint for "Consistent" words
            let wordSpecificHPool = hPool;
            let wordSpecificKPool = kPool;
            
            if (!config.allowMultiScriptWords) {
                // For consistent words, flip the script coin once per word
                const useHiragana = (hPool.length > 0 && kPool.length > 0) 
                    ? Math.random() < 0.5 
                    : hPool.length > 0;
                
                if (useHiragana) wordSpecificKPool = [];
                else wordSpecificHPool = [];
            }

            let hasYoonInWord = false;
            for (let j = 0; j < length; j++) {
                let currentHPool = wordSpecificHPool;
                let currentKPool = wordSpecificKPool;

                // Constraint 1: Max 1 yoon per word in multi-mode
                if (hasYoonInWord) {
                    currentHPool = currentHPool.filter(c => !isYoon(c));
                    currentKPool = currentKPool.filter(c => !isYoon(c));
                } else {
                    // Constraint 2: 25% frequency bias for yoon if non-yoon are available
                    const allAvailable = [...currentHPool, ...currentKPool];
                    const hasBasic = allAvailable.some(c => !isYoon(c));
                    const hasYoon = allAvailable.some(isYoon);

                    if (hasBasic && hasYoon && Math.random() > 0.25) {
                        currentHPool = currentHPool.filter(c => !isYoon(c));
                        currentKPool = currentKPool.filter(c => !isYoon(c));
                    }
                }

                const char = pickCharacter(currentHPool, currentKPool, config.distribution);
                if (char) {
                    selectedChars.push(char);
                    if (isYoon(char)) hasYoonInWord = true;
                }
            }

            if (selectedChars.length > 0) {
                generatedQuestions.push({
                    char: selectedChars.map(c => c.char).join(''),
                    romaji: cartesian(selectedChars.map(c => c.romaji)),
                    type: selectedChars[0].type,
                    parts: selectedChars
                });
            }
        }
        setQuestions(generatedQuestions);
    }

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

  /**
   * Font size should be calculated based on semantic parts rather than string length.
   * Yōon (2 chars) shouldn't make the font as small as 2 separate syllables.
   */
  const getFontSize = (partsCount: number) => {
    const base = 5;        
    const drop = 0.45;      
    const size = Math.max(2.8, base - (partsCount - 1) * drop);
    return `text-[${size}rem]`;
  };

  const handleFinish = () => {
    // If timer runs out, currentIndex represents the number of fully completed questions
    onComplete(results, questions.length, currentIndex);
  };

  const nextQuestion = () => {
    const now = Date.now();
    const totalTimeTaken = (now - startTime); 
    const newResultsForThisQuestion: QuestionResult[] = [];
    
    if (currentQuestion.parts) {
        const timePerChar = totalTimeTaken / currentQuestion.parts.length;
        currentQuestion.parts.forEach((part, idx) => {
            newResultsForThisQuestion.push({
                char: part,
                mistakes: partMistakes[idx] || 0,
                timeTaken: timePerChar
            });
        });
    }

    const updatedResults = [...results, ...newResultsForThisQuestion];
    setResults(updatedResults);

    if (currentIndex + 1 >= questions.length) {
      // Quiz finished naturally
      onComplete(updatedResults, questions.length, questions.length);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStartTime(Date.now());
      setIsError(false);
      setIsCorrect(false);
      
      // Reset input state
      setCompletedIndex(0);
      setCurrentInput('');
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
    const errorIndex = overrideActiveIndex !== undefined ? overrideActiveIndex : completedIndex;

    setPartMistakes(prev => {
        const next = [...prev];
        if (errorIndex < next.length) {
            next[errorIndex] = (next[errorIndex] || 0) + 1;
        }
        return next;
    });

    setIsError(false);
    
    // Logic for redoOnError: reset progress for the current question
    if (config.redoOnError) {
        setCompletedIndex(0);
        setCurrentInput('');
        setCommittedSegments([]);
    }

    // Tiny delay to restart animation
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
    setTimeout(() => {
        nextQuestion();
    }, NEXT_QUESTION_DELAY_MS);
  };

  const handlePartCompletion = (segment: string) => {
      const nextIndex = completedIndex + 1;
      setCommittedSegments(prev => [...prev, segment]);
      setCompletedIndex(nextIndex);
      setCurrentInput('');
      
      // Check if all parts completed
      if (nextIndex >= (questions[currentIndex].parts?.length || 0)) {
          handleSuccess();
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCorrect) return;
    
    // 1. Only allow alpha characters
    if (!/^[a-zA-Z]*$/.test(e.target.value)) return;
    
    // 2. Strict length limit (only allow deletion if over limit)
    const val = e.target.value;
    if (val.length > 3) return;

    const lowerVal = val.toLowerCase();

    // Manual Mode: Just update state, validate on Enter
    if (!config.autoCheck) {
        setCurrentInput(lowerVal);
        return;
    }

    // Auto Mode: Validate immediately
    const currentPart = questions[currentIndex].parts![completedIndex];
    const isValidPrefix = currentPart.romaji.some(r => r.startsWith(lowerVal));

    if (!isValidPrefix) {
        triggerError(completedIndex);
        return; 
    }

    setCurrentInput(lowerVal);

    // Check for Exact Match (Auto)
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

    if (e.key === 'Escape') {
        onExit();
        return;
    }

    // Manual Mode Enter Validation
    if (e.key === 'Enter' && !config.autoCheck) {
      e.preventDefault();
      const currentPart = questions[currentIndex].parts![completedIndex];
      
      if (currentPart.romaji.includes(currentInput)) {
        handlePartCompletion(currentInput);
      } else {
        triggerError(completedIndex);
        // We don't necessarily clear input here if redoOnError is off, but standard trainer behavior usually clears it
        setCurrentInput(''); 
      }
    }
  };

  if (!currentQuestion) return <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">Loading...</div>;

  const ANIMATION_CORRECT_DELAY_S = config.mode === "multi" ? 0.15 : 0;
  const NEXT_QUESTION_DELAY_MS = (config.timeLimitSeconds === null ? 500 : 300) + (ANIMATION_CORRECT_DELAY_S * 1000);
  const animation_correct_rotation_degree = config.mode === 'multi' ? -4 : 0;
  const animation_correct_transpose_y = (config.font === 'sans' ? 0 : 1) - (config.mode === 'multi' ? 20 : 0);
  const animation_correct_transpose_x = config.mode === 'multi' ? -8 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* Progress & Timer Bar */}
      <div className="w-full flex justify-between items-center mb-12 text-slate-500 dark:text-slate-400 font-medium transition-colors">
        <div className="flex items-center space-x-4">
            <button
                onClick={onExit}
                className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Exit Quiz"
            >
                <X className="w-5 h-5" />
            </button>
            <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-sm transition-colors">
                {currentIndex + 1} / {questions.length}
            </span>
        </div>
        
        {config.timeLimitSeconds !== null && (
          <div className={`flex items-center space-x-2 transition-colors ${timeLeft && timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}>
            <Timer className="w-5 h-5" />
            <span className="tabular-nums text-lg font-bold">{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div 
        className="relative w-full max-w-md cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden Input for Focus */}
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
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
        />

        <AnimatePresence mode='popLayout'>
            <motion.div
                key={currentQuestion.char}
                initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl shadow-indigo-100 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-700 mb-10 min-h-[300px] relative transition-colors duration-300"
            >
                 {/* Redo Overlay Hint */}
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

                 {/* Decoration Container (Overflow Hidden) */}
                 <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
                     <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500 dark:bg-indigo-400"></div>
                     <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 dark:bg-slate-900/10 rounded-full opacity-50"></div>
                 </div>
                 
                 {/* Content Container (No Overflow Hidden to allow Tooltip) */}
                 <div className="relative z-10 p-16 flex items-center justify-center w-full h-full min-h-[300px]">
                    <motion.div 
                        animate={isCorrect 
                            ? { scale: 1.25, rotate: animation_correct_rotation_degree, y: animation_correct_transpose_y, x: animation_correct_transpose_x } 
                            : { scale: 1, rotate: 0, y: 0 }
                        }
                        transition={{ 
                            type: "tween",
                            ease: "circOut",
                            duration: 0.15,
                            delay: ANIMATION_CORRECT_DELAY_S,
                        }}
                        className={`${getFontSize(currentQuestion.parts?.length || 1)} ${fontClass} font-bold leading-none selection:bg-transparent flex flex-nowrap justify-center tracking-wider gap-1 transition-colors`}
                    >
                        {currentQuestion.parts ? (
                            currentQuestion.parts.map((part, index) => {
                                let colorClass = 'text-slate-800 dark:text-slate-100';
                                
                                if (index < completedIndex) {
                                    // Completed parts are always Green
                                    colorClass = `text-[#${GREEN}] dark:text-emerald-400`;
                                } else if (index === completedIndex && config.autoCheck) {
                                    // Active part color logic (only for Auto mode)
                                    const isValidStart = part.romaji.some(r => r.startsWith(currentInput));
                                    
                                    if (isValidStart && currentInput.length > 0) {
                                        if (currentInput.length >= 2) {
                                            colorClass = `text-[#${ORANGE_GREEN}] dark:text-lime-400`;
                                        } else {
                                            colorClass = `text-[#${ORANGE}] dark:text-amber-400`;
                                        }
                                    }
                                }
                                
                                const isActive = index === completedIndex && !isCorrect;
                                const isCompleted = index < completedIndex;

                                return (
                                    <span 
                                        key={index}
                                        className={`transition-colors duration-200 ${colorClass} relative flex flex-col items-center px-[0.05em] whitespace-nowrap`}
                                    >
                                        {part.char}
                                        
                                        {/* Planted Text for Completed Parts */}
                                        {isCompleted && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -20, scale: 0.5 }}
                                                animate={{ opacity: 1, y: 0, scale: 1.2 }}
                                                className="absolute top-full mt-4 text-emerald-500/80 dark:text-emerald-400/80 font-mono text-lg font-bold"
                                            >
                                                {committedSegments[index]}
                                            </motion.div>
                                        )}

                                        {/* Active State UI */}
                                        {isActive && (
                                            <>
                                                {/* Underscore Indicator */}
                                                <motion.div
                                                    layoutId="active-kana-indicator"
                                                    className="absolute left-0 right-0 mx-auto bg-indigo-300 dark:bg-indigo-500 rounded-full"
                                                    style={{ bottom: '-0.25em', height: '0.08em', width: '80%' }}
                                                />

                                                {/* Floating Input Tooltip */}
                                                <motion.div
                                                    layoutId="floating-input-tooltip"
                                                    className={`absolute top-full mt-5 min-w-[3rem] px-4 py-2 rounded-xl flex items-center justify-center text-xl font-mono shadow-xl border-2 z-50 whitespace-nowrap transition-colors duration-300
                                                        ${isError 
                                                            ? 'bg-rose-500 border-rose-400 text-white animate-shake' 
                                                            : 'bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600 text-white'
                                                        }
                                                    `}
                                                    initial={(completedIndex === 0 && currentInput.length === 0) ? { opacity: 0, y: 10 } : false}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                >
                                                    {/* Arrow */}
                                                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-l-2 border-t-2 transition-colors duration-300
                                                         ${isError 
                                                            ? 'bg-rose-500 border-rose-400' 
                                                            : 'bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600'
                                                        }
                                                    `}></div>
                                                    
                                                    <span className="leading-none relative z-10 font-mono tracking-wider">
                                                        {currentInput}
                                                    </span>
                                                    {/* Blinking Cursor */}
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
                            })
                        ) : (
                            <span className="text-slate-800 dark:text-slate-100 whitespace-nowrap">{currentQuestion.char}</span>
                        )}
                    </motion.div>
                 </div>
                 
                 {/* Correct Checkmark Overlay (Bottom Right) */}
                 <div className="absolute inset-0 pointer-events-none flex items-end justify-end z-20 overflow-hidden rounded-[3rem] p-6">
                    <AnimatePresence>
                        {isCorrect && (
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

        {/* Hint Text Area */}
        <div className="h-12 mt-4 text-center text-slate-400 dark:text-slate-600 text-sm font-medium transition-colors">
             {!config.autoCheck && !isCorrect && (
                <span className="animate-pulse">Type & Press Enter</span>
             )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;