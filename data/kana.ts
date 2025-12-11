import { KanaChar } from '../types';

const basicHiragana: KanaChar[] = [
  { char: 'あ', romaji: ['a'], type: 'hiragana' },
  { char: 'い', romaji: ['i'], type: 'hiragana' },
  { char: 'う', romaji: ['u'], type: 'hiragana' },
  { char: 'え', romaji: ['e'], type: 'hiragana' },
  { char: 'お', romaji: ['o'], type: 'hiragana' },
  { char: 'か', romaji: ['ka'], type: 'hiragana' },
  { char: 'き', romaji: ['ki'], type: 'hiragana' },
  { char: 'く', romaji: ['ku'], type: 'hiragana' },
  { char: 'け', romaji: ['ke'], type: 'hiragana' },
  { char: 'こ', romaji: ['ko'], type: 'hiragana' },
  { char: 'さ', romaji: ['sa'], type: 'hiragana' },
  { char: 'し', romaji: ['shi'], type: 'hiragana' },
  { char: 'す', romaji: ['su'], type: 'hiragana' },
  { char: 'せ', romaji: ['se'], type: 'hiragana' },
  { char: 'そ', romaji: ['so'], type: 'hiragana' },
  { char: 'た', romaji: ['ta'], type: 'hiragana' },
  { char: 'ち', romaji: ['chi'], type: 'hiragana' },
  { char: 'つ', romaji: ['tsu'], type: 'hiragana' },
  { char: 'て', romaji: ['te'], type: 'hiragana' },
  { char: 'と', romaji: ['to'], type: 'hiragana' },
  { char: 'な', romaji: ['na'], type: 'hiragana' },
  { char: 'に', romaji: ['ni'], type: 'hiragana' },
  { char: 'ぬ', romaji: ['nu'], type: 'hiragana' },
  { char: 'ね', romaji: ['ne'], type: 'hiragana' },
  { char: 'の', romaji: ['no'], type: 'hiragana' },
  { char: 'は', romaji: ['ha'], type: 'hiragana' },
  { char: 'ひ', romaji: ['hi'], type: 'hiragana' },
  { char: 'ふ', romaji: ['fu'], type: 'hiragana' },
  { char: 'へ', romaji: ['he'], type: 'hiragana' },
  { char: 'ほ', romaji: ['ho'], type: 'hiragana' },
  { char: 'ま', romaji: ['ma'], type: 'hiragana' },
  { char: 'み', romaji: ['mi'], type: 'hiragana' },
  { char: 'む', romaji: ['mu'], type: 'hiragana' },
  { char: 'め', romaji: ['me'], type: 'hiragana' },
  { char: 'も', romaji: ['mo'], type: 'hiragana' },
  { char: 'や', romaji: ['ya'], type: 'hiragana' },
  { char: 'ゆ', romaji: ['yu'], type: 'hiragana' },
  { char: 'よ', romaji: ['yo'], type: 'hiragana' },
  { char: 'ら', romaji: ['ra'], type: 'hiragana' },
  { char: 'り', romaji: ['ri'], type: 'hiragana' },
  { char: 'る', romaji: ['ru'], type: 'hiragana' },
  { char: 'れ', romaji: ['re'], type: 'hiragana' },
  { char: 'ろ', romaji: ['ro'], type: 'hiragana' },
  { char: 'わ', romaji: ['wa'], type: 'hiragana' },
  { char: 'を', romaji: ['o'], type: 'hiragana' },
  { char: 'ん', romaji: ['n'], type: 'hiragana' },
];

const dakutenHiragana: KanaChar[] = [
  { char: 'が', romaji: ['ga'], type: 'hiragana' },
  { char: 'ぎ', romaji: ['gi'], type: 'hiragana' },
  { char: 'ぐ', romaji: ['gu'], type: 'hiragana' },
  { char: 'げ', romaji: ['ge'], type: 'hiragana' },
  { char: 'ご', romaji: ['go'], type: 'hiragana' },
  { char: 'ざ', romaji: ['za'], type: 'hiragana' },
  { char: 'じ', romaji: ['ji'], type: 'hiragana' },
  { char: 'ず', romaji: ['zu'], type: 'hiragana' },
  { char: 'ぜ', romaji: ['ze'], type: 'hiragana' },
  { char: 'ぞ', romaji: ['zo'], type: 'hiragana' },
  { char: 'だ', romaji: ['da'], type: 'hiragana' },
  { char: 'ぢ', romaji: ['ji'], type: 'hiragana' },
  { char: 'づ', romaji: ['zu'], type: 'hiragana' },
  { char: 'で', romaji: ['de'], type: 'hiragana' },
  { char: 'ど', romaji: ['do'], type: 'hiragana' },
  { char: 'ば', romaji: ['ba'], type: 'hiragana' },
  { char: 'び', romaji: ['bi'], type: 'hiragana' },
  { char: 'ぶ', romaji: ['bu'], type: 'hiragana' },
  { char: 'べ', romaji: ['be'], type: 'hiragana' },
  { char: 'ぼ', romaji: ['bo'], type: 'hiragana' },
  { char: 'ぱ', romaji: ['pa'], type: 'hiragana' },
  { char: 'ぴ', romaji: ['pi'], type: 'hiragana' },
  { char: 'ぷ', romaji: ['pu'], type: 'hiragana' },
  { char: 'ぺ', romaji: ['pe'], type: 'hiragana' },
  { char: 'ぽ', romaji: ['po'], type: 'hiragana' },
];

const basicKatakana: KanaChar[] = [
  { char: 'ア', romaji: ['a'], type: 'katakana' },
  { char: 'イ', romaji: ['i'], type: 'katakana' },
  { char: 'ウ', romaji: ['u'], type: 'katakana' },
  { char: 'エ', romaji: ['e'], type: 'katakana' },
  { char: 'オ', romaji: ['o'], type: 'katakana' },
  { char: 'カ', romaji: ['ka'], type: 'katakana' },
  { char: 'キ', romaji: ['ki'], type: 'katakana' },
  { char: 'ク', romaji: ['ku'], type: 'katakana' },
  { char: 'ケ', romaji: ['ke'], type: 'katakana' },
  { char: 'コ', romaji: ['ko'], type: 'katakana' },
  { char: 'サ', romaji: ['sa'], type: 'katakana' },
  { char: 'シ', romaji: ['shi'], type: 'katakana' },
  { char: 'ス', romaji: ['su'], type: 'katakana' },
  { char: 'セ', romaji: ['se'], type: 'katakana' },
  { char: 'ソ', romaji: ['so'], type: 'katakana' },
  { char: 'タ', romaji: ['ta'], type: 'katakana' },
  { char: 'チ', romaji: ['chi'], type: 'katakana' },
  { char: 'ツ', romaji: ['tsu'], type: 'katakana' },
  { char: 'テ', romaji: ['te'], type: 'katakana' },
  { char: 'ト', romaji: ['to'], type: 'katakana' },
  { char: 'ナ', romaji: ['na'], type: 'katakana' },
  { char: 'ニ', romaji: ['ni'], type: 'katakana' },
  { char: 'ヌ', romaji: ['nu'], type: 'katakana' },
  { char: 'ネ', romaji: ['ne'], type: 'katakana' },
  { char: 'ノ', romaji: ['no'], type: 'katakana' },
  { char: 'ハ', romaji: ['ha'], type: 'katakana' },
  { char: 'ヒ', romaji: ['hi'], type: 'katakana' },
  { char: 'フ', romaji: ['fu'], type: 'katakana' },
  { char: 'ヘ', romaji: ['he'], type: 'katakana' },
  { char: 'ホ', romaji: ['ho'], type: 'katakana' },
  { char: 'マ', romaji: ['ma'], type: 'katakana' },
  { char: 'ミ', romaji: ['mi'], type: 'katakana' },
  { char: 'ム', romaji: ['mu'], type: 'katakana' },
  { char: 'メ', romaji: ['me'], type: 'katakana' },
  { char: 'モ', romaji: ['mo'], type: 'katakana' },
  { char: 'ヤ', romaji: ['ya'], type: 'katakana' },
  { char: 'ユ', romaji: ['yu'], type: 'katakana' },
  { char: 'ヨ', romaji: ['yo'], type: 'katakana' },
  { char: 'ラ', romaji: ['ra'], type: 'katakana' },
  { char: 'リ', romaji: ['ri'], type: 'katakana' },
  { char: 'ル', romaji: ['ru'], type: 'katakana' },
  { char: 'レ', romaji: ['re'], type: 'katakana' },
  { char: 'ロ', romaji: ['ro'], type: 'katakana' },
  { char: 'ワ', romaji: ['wa'], type: 'katakana' },
  { char: 'ヲ', romaji: ['o'], type: 'katakana' },
  { char: 'ン', romaji: ['n'], type: 'katakana' },
];

const dakutenKatakana: KanaChar[] = [
  { char: 'ガ', romaji: ['ga'], type: 'katakana' },
  { char: 'ギ', romaji: ['gi'], type: 'katakana' },
  { char: 'グ', romaji: ['gu'], type: 'katakana' },
  { char: 'ゲ', romaji: ['ge'], type: 'katakana' },
  { char: 'ゴ', romaji: ['go'], type: 'katakana' },
  { char: 'ザ', romaji: ['za'], type: 'katakana' },
  { char: 'ジ', romaji: ['ji'], type: 'katakana' },
  { char: 'ズ', romaji: ['zu'], type: 'katakana' },
  { char: 'ゼ', romaji: ['ze'], type: 'katakana' },
  { char: 'ゾ', romaji: ['zo'], type: 'katakana' },
  { char: 'ダ', romaji: ['da'], type: 'katakana' },
  { char: 'ヂ', romaji: ['ji'], type: 'katakana' },
  { char: 'ヅ', romaji: ['zu'], type: 'katakana' },
  { char: 'デ', romaji: ['de'], type: 'katakana' },
  { char: 'ド', romaji: ['do'], type: 'katakana' },
  { char: 'バ', romaji: ['ba'], type: 'katakana' },
  { char: 'ビ', romaji: ['bi'], type: 'katakana' },
  { char: 'ブ', romaji: ['bu'], type: 'katakana' },
  { char: 'ベ', romaji: ['be'], type: 'katakana' },
  { char: 'ボ', romaji: ['bo'], type: 'katakana' },
  { char: 'パ', romaji: ['pa'], type: 'katakana' },
  { char: 'ピ', romaji: ['pi'], type: 'katakana' },
  { char: 'プ', romaji: ['pu'], type: 'katakana' },
  { char: 'ペ', romaji: ['pe'], type: 'katakana' },
  { char: 'ポ', romaji: ['po'], type: 'katakana' },
];

export const hiragana = [...basicHiragana, ...dakutenHiragana];
export const katakana = [...basicKatakana, ...dakutenKatakana];

// --- Frequency Data ---

// Mapping of Dakuten/Handakuten chars to their base char to share frequency weights
const DAKUTEN_MAP: Record<string, string> = {
  'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
  'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
  'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
  'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
  'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
  'ガ': 'カ', 'ギ': 'キ', 'グ': 'ク', 'ゲ': 'ケ', 'ゴ': 'コ',
  'ザ': 'サ', 'ジ': 'シ', 'ズ': 'ス', 'ゼ': 'セ', 'ゾ': 'ソ',
  'ダ': 'タ', 'ヂ': 'チ', 'ヅ': 'ツ', 'デ': 'テ', 'ド': 'ト',
  'バ': 'ハ', 'ビ': 'ヒ', 'ブ': 'フ', 'ベ': 'ヘ', 'ボ': 'ホ',
  'パ': 'ハ', 'ピ': 'ヒ', 'プ': 'フ', 'ペ': 'ヘ', 'ポ': 'ホ',
};

// Corpus counts from l2 frequency lists
const KANA_FREQUENCIES: Record<string, number> = {
  // Hiragana
  'の': 1918313, 'て': 1523150, 'か': 1398036, 'た': 1348477, 'と': 1124493,
  'に': 1108840, 'い': 1060305, 'は': 1014388, 'を': 936356,  'る': 916652,
  'し': 904989,  'な': 720156,  'つ': 634474,  'れ': 450805,  'ら': 423294,
  'も': 396142,  'す': 393310,  'う': 352966,  'こ': 339192,  'り': 333999,
  'ま': 278599,  'さ': 271068,  'き': 253370,  'け': 248488,  'く': 243509,
  'め': 223806,  'あ': 204381,  'ん': 190068,  'よ': 168631,  'え': 163770,
  'や': 157678,  'そ': 141658,  'わ': 123080,  'へ': 103495,  'ち': 99265,
  'せ': 90337,   'み': 89264,   'ろ': 73467,   'お': 65891,   'ほ': 62469,
  'ひ': 53068,   'ふ': 35872,   'む': 31212,   'ね': 23490,   'ゆ': 11241,
  'ぬ': 5124,

  // Katakana
  'ン': 290948, 'ト': 237059, 'ス': 197454, 'ル': 189442, 'イ': 154554,
  'フ': 151194, 'シ': 141787, 'ク': 138642, 'ア': 137966, 'ラ': 117203,
  'ツ': 111562, 'リ': 106744, 'カ': 105057, 'ハ': 102225, 'タ': 101715,
  'テ': 86069,  'ロ': 75301,  'コ': 72655,  'ヒ': 70443,  'ホ': 68597,
  'レ': 60608,  'メ': 60230,  'マ': 56123,  'エ': 54275,  'ム': 50758,
  'キ': 50340,  'サ': 49346,  'チ': 48586,  'ヘ': 44765,  'セ': 42572,
  'ウ': 41518,  'オ': 40963,  'ヤ': 40670,  'ユ': 39269,  'ニ': 38711,
  'ナ': 38047,  'ミ': 29262,  'ヨ': 28049,  'ケ': 27116,  'ソ': 23424,
  'ネ': 22462,  'ワ': 21793,  'モ': 20070,  'ノ': 19572,  'ヌ': 2897
};

const getCharWeight = (char: string): number => {
    // 1. Try direct match
    if (KANA_FREQUENCIES[char] !== undefined) return KANA_FREQUENCIES[char];
    
    // 2. Try mapped match (e.g. dakuten -> base)
    const baseChar = DAKUTEN_MAP[char];
    if (baseChar && KANA_FREQUENCIES[baseChar] !== undefined) {
        return KANA_FREQUENCIES[baseChar];
    }

    // 3. Fallback for extremely rare or unknown characters (approx median)
    return 10000;
};

// Select a single item from the pool based on weight (With Replacement)
export const getWeightedRandomItem = (pool: KanaChar[]): KanaChar => {
    if (pool.length === 0) throw new Error("Pool is empty");
    
    const weights = pool.map(k => getCharWeight(k.char));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let r = Math.random() * totalWeight;
    
    for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) return pool[i];
    }
    
    return pool[pool.length - 1];
};

// Select N unique items from the pool based on weight (Without Replacement)
export const getWeightedSubset = (pool: KanaChar[], count: number): KanaChar[] => {
    if (count >= pool.length) return [...pool]; // Not enough items, return all
    
    const result: KanaChar[] = [];
    const available = [...pool]; // Clone to modify
    
    for (let i = 0; i < count; i++) {
        const selected = getWeightedRandomItem(available);
        result.push(selected);
        // Remove selected from available to ensure uniqueness
        const idx = available.indexOf(selected);
        if (idx > -1) available.splice(idx, 1);
        if (available.length === 0) break;
    }
    
    return result;
};

// Select N unique items from the pool uniformly (Random Shuffle)
export const getUniformSubset = (pool: KanaChar[], count: number): KanaChar[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    if (count >= pool.length) return shuffled;
    return shuffled.slice(0, count);
};


// --- Grouping & Filtering ---

export type KanaGroupKey = 'vowel' | 'k' | 's' | 't' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'nn';

export interface KanaGroupDef {
    key: KanaGroupKey;
    label: string;
    predicate: (c: KanaChar) => boolean;
}

// NOTE: Predicates are updated to handle the new strict-pronunciation romaji mappings
// For example, 'S' group must exclude 'ぢ'/'ヂ' (which are now 'ji') and 'づ'/'ヅ' (which are now 'zu')
// and 'T' group must explicitly include 'ぢ'/'ヂ'/'づ'/'ヅ'
export const KANA_GROUPS: KanaGroupDef[] = [
    { key: 'vowel', label: 'Vowels (あ)', predicate: c => ['a','i','u','e','o'].includes(c.romaji[0]) && !['を', 'ヲ'].includes(c.char) },
    { key: 'k', label: 'K (ka/ga)', predicate: c => c.romaji.some(r => r.startsWith('k') || r.startsWith('g')) },
    { key: 's', label: 'S (sa/za)', predicate: c => c.romaji.some(r => (r.startsWith('s') || r.startsWith('z') || r.startsWith('j')) && !['ぢ', 'ヂ', 'づ', 'ヅ'].includes(c.char)) },
    { key: 't', label: 'T (ta/da)', predicate: c => c.romaji.some(r => r.startsWith('t') || r.startsWith('d') || r.startsWith('c')) || ['ぢ', 'ヂ', 'づ', 'ヅ'].includes(c.char) },
    { key: 'n', label: 'N (na)', predicate: c => c.romaji.some(r => r.startsWith('n')) && !['n', 'nn'].includes(c.romaji[0]) },
    { key: 'h', label: 'H (ha/ba/pa)', predicate: c => c.romaji.some(r => r.startsWith('h') || r.startsWith('f') || r.startsWith('b') || r.startsWith('p')) },
    { key: 'm', label: 'M (ma)', predicate: c => c.romaji.some(r => r.startsWith('m')) },
    { key: 'y', label: 'Y (ya)', predicate: c => c.romaji.some(r => r.startsWith('y')) },
    { key: 'r', label: 'R (ra)', predicate: c => c.romaji.some(r => r.startsWith('r')) },
    { key: 'w', label: 'W (wa)', predicate: c => c.romaji.some(r => r.startsWith('w')) || ['を', 'ヲ'].includes(c.char) },
    { key: 'nn', label: 'N (n)', predicate: c => ['n', 'nn'].includes(c.romaji[0]) },
];

export const getKanaPool = (types: ('hiragana'|'katakana')[], selectedGroupKeys: string[]): KanaChar[] => {
    let pool: KanaChar[] = [];
    if (types.includes('hiragana')) pool = pool.concat(hiragana);
    if (types.includes('katakana')) pool = pool.concat(katakana);

    if (!selectedGroupKeys || selectedGroupKeys.length === 0) return pool;

    // A char is included if it matches ANY of the selected groups
    return pool.filter(char => {
        return KANA_GROUPS.some(group => 
            selectedGroupKeys.includes(group.key) && group.predicate(char)
        );
    });
};