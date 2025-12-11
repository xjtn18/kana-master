import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameConfig, KanaType, GameMode, KanaFont, DistributionMode } from '../types';
import { KANA_GROUPS } from '../data/kana';
import { Settings, Play, CheckCircle2, Clock, List, Zap, Filter, ChevronDown, ChevronUp, AlertCircle, Type, Sliders, Shuffle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigScreenProps {
  onStart: (config: GameConfig) => void;
}

const STORAGE_KEY = 'kana-master-config-v5'; 

const DEFAULT_CONFIG = {
  mode: 'multi' as GameMode,
  kanaType: 'hiragana' as KanaType,
  questionCount: 10 as number | 'all',
  timeLimit: null as number | null,
  autoCheck: true,
  selectedGroups: KANA_GROUPS.map(g => g.key), // Default all selected
  font: 'sans' as KanaFont,
  distribution: 'random' as DistributionMode,
};

const ConfigScreen: React.FC<ConfigScreenProps> = ({ onStart }) => {
  // Initialize state from localStorage or defaults
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new fields exist if migrating from old version
        const validGroupKeys = KANA_GROUPS.map(g => g.key);
        
        let mergedGroups = parsed.selectedGroups;
        if (mergedGroups) {
             // Filter out any keys that no longer exist
             mergedGroups = mergedGroups.filter((k: string) => (validGroupKeys as string[]).includes(k));
        } else {
             mergedGroups = validGroupKeys;
        }

        return { 
            ...DEFAULT_CONFIG, 
            ...parsed, 
            selectedGroups: mergedGroups,
            font: parsed.font || DEFAULT_CONFIG.font,
            distribution: parsed.distribution || DEFAULT_CONFIG.distribution
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved config:', e);
    }
    return DEFAULT_CONFIG;
  };

  const [initialConfig] = useState(getInitialState);

  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [mode, setMode] = useState<GameMode>(initialConfig.mode);
  const [kanaType, setKanaType] = useState<KanaType>(initialConfig.kanaType);
  const [questionCount, setQuestionCount] = useState<number | 'all'>(initialConfig.questionCount);
  const [timeLimit, setTimeLimit] = useState<number | null>(initialConfig.timeLimit);
  const [autoCheck, setAutoCheck] = useState<boolean>(initialConfig.autoCheck);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(initialConfig.selectedGroups || DEFAULT_CONFIG.selectedGroups);
  const [font, setFont] = useState<KanaFont>(initialConfig.font);
  const [distribution, setDistribution] = useState<DistributionMode>(initialConfig.distribution);

  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [isFontsExpanded, setIsFontsExpanded] = useState(false);

  // Scroll handling
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);
  
  // Custom Scrollbar State (Layout only)
  const [thumbHeight, setThumbHeight] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    const configToSave = {
      mode,
      kanaType,
      questionCount,
      timeLimit,
      autoCheck,
      selectedGroups,
      font,
      distribution
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
  }, [mode, kanaType, questionCount, timeLimit, autoCheck, selectedGroups, font, distribution]);

  const triggerStart = () => {
    if (selectedGroups.length === 0) return;
    onStart({
      mode,
      kanaType,
      questionCount,
      timeLimitSeconds: timeLimit,
      autoCheck,
      selectedGroups,
      font,
      distribution
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerStart();
  };

  // Listen for Enter key to start game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, kanaType, questionCount, timeLimit, autoCheck, selectedGroups, font, distribution]);


  // --- Scrollbar Logic ---

  // 1. Calculate Layout (Height, Visibility) - Triggered by ResizeObserver or Transitions
  const updateLayoutState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight } = scrollRef.current;
    
    // Increased buffer to 4px to avoid sub-pixel rendering errors or minor layout shifts
    // This ensures scrollbar only appears when there is SIGNIFICANT overflow
    const hasScroll = scrollHeight > clientHeight + 4;
    
    setIsScrollable(hasScroll);

    if (hasScroll) {
        const heightRatio = clientHeight / scrollHeight;
        const newThumbHeight = Math.max(heightRatio * clientHeight, 40); 
        setThumbHeight(newThumbHeight);
    } else {
        setShowGradient(false);
    }
  }, []);

  // 2. Update Position (Transform) & Gradient - Triggered by Scroll Event
  // Uses direct DOM manipulation for the thumb to ensure 0 lag (snappy feel)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Gradient logic
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    const hasScroll = scrollHeight > clientHeight + 4;
    const shouldShowGradient = hasScroll && !isAtBottom;
    
    // Only update state if changed to minimize re-renders during scroll
    if (showGradient !== shouldShowGradient) {
        setShowGradient(shouldShowGradient);
    }

    // Direct DOM update for thumb position
    if (hasScroll && thumbRef.current) {
        const heightRatio = clientHeight / scrollHeight;
        const currentThumbHeight = Math.max(heightRatio * clientHeight, 40); 
        
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - currentThumbHeight;
        
        let visualTop = 0;
        if (maxScrollTop > 0) {
            visualTop = (scrollTop / maxScrollTop) * maxThumbTop;
        }
        
        thumbRef.current.style.transform = `translateY(${visualTop}px)`;
    }
  }, [showGradient]);


  // Attach Listeners
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Using passive listener for better performance
    el.addEventListener('scroll', handleScroll, { passive: true });
    
    // Resize Observer handles content changes (accordion open, tab switch, etc)
    const observer = new ResizeObserver(() => {
        // Run immediately
        updateLayoutState();
        handleScroll();
        
        // And double check after a small tick in case of layout shifts
        requestAnimationFrame(() => {
             updateLayoutState();
             handleScroll();
        });
    });
    observer.observe(el);

    // Initial check
    updateLayoutState();
    handleScroll();

    return () => {
        el.removeEventListener('scroll', handleScroll);
        observer.disconnect();
    };
  }, [updateLayoutState, handleScroll]);

  // Recalculate when specific state changes that might affect layout
  useEffect(() => {
    updateLayoutState();
    // Use timeout to allow for rendering updates if needed
    const t = setTimeout(() => {
        updateLayoutState();
        handleScroll();
    }, 50);
    return () => clearTimeout(t);
  }, [activeTab, mode, kanaType, questionCount, timeLimit, autoCheck, selectedGroups, font, distribution, isGroupsExpanded, isFontsExpanded, updateLayoutState, handleScroll]);

  // Reset scroll when tab changes
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
      }
  }, [activeTab]);

  // --- End Scrollbar Logic ---

  const toggleGroup = (key: string) => {
    setSelectedGroups(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const selectAllGroups = () => setSelectedGroups(KANA_GROUPS.map(g => g.key));
  const deselectAllGroups = () => setSelectedGroups([]);

  const hasGroupError = selectedGroups.length === 0;

  const getGroupLabel = () => {
    if (selectedGroups.length === KANA_GROUPS.length) return 'All';
    if (selectedGroups.length === 0) return 'None';
    return 'Custom';
  };
  
  const fontOptions = [
      { id: 'sans', label: 'Standard', family: 'font-jp' },
      { id: 'serif', label: 'Classic', family: 'font-jp-serif' },
      { id: 'rounded', label: 'Cute', family: 'font-jp-rounded' },
      { id: 'hand', label: 'Brush', family: 'font-jp-hand' },
      { id: 'digital', label: 'Digital', family: 'font-jp-digital' },
      { id: 'future', label: 'Future', family: 'font-jp-future' }
  ];
  
  const getFontLabel = () => {
      return fontOptions.find(f => f.id === font)?.label || 'Standard';
  };

  // Shared spring configuration for tab content transitions
  const transitionConfig = { type: "spring" as const, stiffness: 500, damping: 40 };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col h-full max-h-[800px]"
      >
        {/* Header - Fixed */}
        <div className="bg-indigo-600 p-6 md:p-8 text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 font-jp-future">かなマスター</h1>
          <p className="text-indigo-100 font-medium">Kana Master</p>
        </div>

        {/* Tabs - Fixed */}
        <div className="flex border-b border-slate-100 relative z-10 bg-white flex-shrink-0">
            <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${
                    activeTab === 'general' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                <span className="flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" /> General
                </span>
                {activeTab === 'general' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" transition={{ease: "easeOut", duration: 0.15}} />
                )}
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${
                    activeTab === 'advanced' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                 <span className="flex items-center justify-center gap-2">
                    <Sliders className="w-4 h-4" /> Advanced
                </span>
                {activeTab === 'advanced' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" transition={{ease: "easeOut", duration: 0.15}} />
                )}
            </button>
        </div>
        
        {/* Form - Flex Column Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 relative">
            
            {/* Scrollable Content Wrapper */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden group">
                <div 
                    ref={scrollRef}
                    className={`flex-1 overflow-x-hidden p-6 md:p-8 relative no-scrollbar ${
                        /* Allow scrolling during transition ONLY if targeting General tab (Short -> Tall) to prevent snap */
                        (isTransitioning && activeTab !== 'general') ? 'overflow-hidden' : 'overflow-y-auto'
                    }`}
                    style={{ 
                        scrollbarWidth: 'none',  /* Firefox */
                        msOverflowStyle: 'none'  /* IE 10+ */
                    }}
                >
                    {/* Inject generic hide scrollbar style for Webkit */}
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>

                    <AnimatePresence mode="popLayout" initial={false} custom={activeTab}>
                        {activeTab === 'general' ? (
                            <motion.div 
                                key="general"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={transitionConfig}
                                onAnimationStart={() => setIsTransitioning(true)}
                                onAnimationComplete={() => {
                                    setIsTransitioning(false);
                                    setTimeout(updateLayoutState, 0); // Check layout immediately after update
                                }}
                                className="flex flex-col gap-8 pb-4"
                            >
                                {/* Game Mode Selection */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <Zap className="w-4 h-4 mr-2" /> Game Mode
                                    </label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setMode('single')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            mode === 'single' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Single Char
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('multi')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            mode === 'multi' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Multi (Words)
                                        </button>
                                    </div>
                                </div>

                                {/* Character Set Selection */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <Settings className="w-4 h-4 mr-2" /> Character Set
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['hiragana', 'katakana', 'mixed'] as const).map((type) => (
                                            <button
                                            key={type}
                                            type="button"
                                            onClick={() => setKanaType(type)}
                                            className={`py-3 px-4 rounded-xl text-sm font-bold capitalize transition-all duration-200 border-2 ${
                                                kanaType === type
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                            >
                                            {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Group Filter Selection (Accordion) */}
                                <div className={`border rounded-xl bg-slate-50 overflow-hidden transition-all ${
                                    hasGroupError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                                }`}>
                                    <button 
                                        type="button"
                                        onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
                                        className="flex items-center justify-between w-full p-4 text-left focus:outline-none hover:bg-slate-100/50 transition-colors group"
                                    >
                                        <div className="flex items-center">
                                            <Filter className={`w-4 h-4 mr-2 ${hasGroupError ? 'text-rose-500' : 'text-slate-500'}`} />
                                            <span className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                                                hasGroupError ? 'text-rose-600' : 'text-slate-500 group-hover:text-slate-700'
                                            }`}>
                                                Kana Groups
                                            </span>
                                            <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${
                                                hasGroupError 
                                                ? 'bg-rose-100 text-rose-600' 
                                                : 'bg-slate-200 text-slate-400'
                                            }`}>
                                                {getGroupLabel()}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {hasGroupError && (
                                                <AlertCircle className="w-4 h-4 text-rose-500 mr-2 animate-pulse" />
                                            )}
                                            {isGroupsExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isGroupsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                                onAnimationComplete={updateLayoutState}
                                            >
                                                <div className="p-4 pt-0 border-t border-slate-200/50 mt-2">
                                                    <div className="flex space-x-2 text-xs font-bold mb-3 mt-4">
                                                        <button type="button" onClick={selectAllGroups} className="text-indigo-600 hover:text-indigo-800">All</button>
                                                        <span className="text-slate-300">|</span>
                                                        <button type="button" onClick={deselectAllGroups} className="text-slate-400 hover:text-slate-600">None</button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {KANA_GROUPS.map((group) => (
                                                            <button
                                                                key={group.key}
                                                                type="button"
                                                                onClick={() => toggleGroup(group.key)}
                                                                className={`text-xs py-2 px-3 rounded-lg font-bold text-left transition-colors flex items-center ${
                                                                    selectedGroups.includes(group.key)
                                                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                                                                        : 'text-slate-400 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                <div className={`w-3 h-3 rounded-full mr-2 border flex-shrink-0 ${
                                                                    selectedGroups.includes(group.key) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                                                                }`}></div>
                                                                <span className="truncate">{group.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {hasGroupError && (
                                                        <p className="text-xs text-rose-500 font-bold mt-3">Please select at least one group.</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Number of Questions */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <List className="w-4 h-4 mr-2" /> Questions
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {([10, 25, 50, 'all'] as const).map((count) => (
                                            <button
                                            key={count}
                                            type="button"
                                            onClick={() => setQuestionCount(count)}
                                            className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border-2 ${
                                                questionCount === count
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                            >
                                            {count === 'all' ? 'All' : count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Limit */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <Clock className="w-4 h-4 mr-2" /> Time Limit
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {([null, 30, 60, 120] as const).map((time) => (
                                            <button
                                            key={time === null ? 'none' : time}
                                            type="button"
                                            onClick={() => setTimeLimit(time)}
                                            className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border-2 ${
                                                timeLimit === time
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                            >
                                            {time === null ? 'None' : `${time}s`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Kana Font (Accordion) */}
                                <div className={`border rounded-xl bg-slate-50 overflow-hidden transition-all ${
                                    isFontsExpanded ? 'border-slate-300 ring-2 ring-indigo-50' : 'border-slate-200'
                                }`}>
                                    <button 
                                        type="button"
                                        onClick={() => setIsFontsExpanded(!isFontsExpanded)}
                                        className="flex items-center justify-between w-full p-4 text-left focus:outline-none hover:bg-slate-100/50 transition-colors group"
                                    >
                                        <div className="flex items-center">
                                            <Type className="w-4 h-4 mr-2 text-slate-500" />
                                            <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors">
                                                Kana Font
                                            </span>
                                            <span className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-400">
                                                {getFontLabel()}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {isFontsExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isFontsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                                onAnimationComplete={updateLayoutState}
                                            >
                                                <div className="p-4 pt-0 border-t border-slate-200/50 mt-2">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {fontOptions.map((fontOption) => (
                                                            <button
                                                            key={fontOption.id}
                                                            type="button"
                                                            onClick={() => setFont(fontOption.id as KanaFont)}
                                                            className={`py-3 px-1 rounded-xl text-sm font-bold transition-all border-2 flex flex-col items-center justify-center space-y-1 ${
                                                                font === fontOption.id
                                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                                            }`}
                                                            >
                                                                <span className="text-xs">{fontOption.label}</span>
                                                                <span className={`text-xl ${fontOption.family}`}>あ</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="advanced"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={transitionConfig}
                                onAnimationStart={() => setIsTransitioning(true)}
                                onAnimationComplete={() => {
                                    setIsTransitioning(false);
                                    setTimeout(updateLayoutState, 0); // Check layout immediately after update
                                }}
                                className="flex flex-col gap-8 pb-4"
                            >
                                {/* Input Mode */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Validation Mode
                                    </label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setAutoCheck(true)}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            autoCheck ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Auto (Instant)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAutoCheck(false)}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            !autoCheck ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            Manual (Enter)
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 px-1">
                                        {autoCheck 
                                            ? "Checks your input immediately as you type." 
                                            : "Type your answer and press Enter to confirm."}
                                    </p>
                                </div>

                                {/* Distribution Mode */}
                                <div className="space-y-4">
                                    <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        <BarChart3 className="w-4 h-4 mr-2" /> Distribution
                                    </label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setDistribution('random')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            distribution === 'random' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Shuffle className="w-4 h-4" /> Random
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDistribution('frequency')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                                            distribution === 'frequency' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <BarChart3 className="w-4 h-4" /> Weighted
                                            </span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 px-1">
                                        {distribution === 'random' 
                                            ? "All characters have an equal chance of appearing." 
                                            : "Common characters appear more frequently (based on corpus data)."}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Custom Overlay Scrollbar */}
                {isScrollable && !isTransitioning && (
                    <div className="absolute right-1 top-1 bottom-1 w-1.5 z-50">
                        <div
                            ref={thumbRef}
                            className="w-full bg-slate-300 rounded-full cursor-pointer hover:bg-slate-400 transition-colors"
                            style={{ 
                                height: thumbHeight,
                                position: 'absolute',
                                top: 0,
                                // Transform is updated imperatively for performance
                            }}
                        />
                    </div>
                )}
                
                {/* Scroll Overflow Gradient */}
                <div className={`absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 z-10 ${showGradient && !isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Sticky Footer */}
            <div className="p-6 md:p-8 border-t border-slate-50 z-20 bg-white flex-shrink-0">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={hasGroupError}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all transform flex items-center justify-center space-x-2 ${
                        hasGroupError 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
                    }`}
                >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start</span>
                </motion.button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ConfigScreen;