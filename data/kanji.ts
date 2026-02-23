import { VocabCard } from '../types';

const KANJI_DATA = `ご飯 (ごはん) - Rice
朝 (あさ) - Morning
昼 (ひる) - Midday/Lunch
晩 (ばん) - Evening/Dinner
寿司 (すし) - Sushi
酒 (さけ) - Alcohol
魚 (さかな) - Fish
肉 (にく) - Meat
牛肉 (ぎゅうにく) - Beef
豚肉 (ぶたにく) - Pork
卵 (たまご) - Egg
海苔 (のり) - Seaweed
汁 (しる) - Soup
出し (だし) - Dashi
ラーメン - Ramen
駅 (えき) - Station
入り口 (いりぐち) - Entrance
出口 (でぐち) - Exit
北 (きた) - North
東 (ひがし) - East
南 (みなみ) - South
西 (にし) - West
電車 (でんしゃ) - Train
一 1 いち
二 2 に
三 3 さん
四 4 よん
五 5 ご
六 6 ろく
七 7 なな
八 8 はち
九 9 きゅう
十 10 じゅう
十一 11 じゅういち
二十 20 にじゅう
百 100 ひゃく
二百 200 にひゃく
千 1,000 せん
二千 2,000 にせん
万 10,000 まん`;

export const parseKanjiData = (): VocabCard[] => {
  const lines = KANJI_DATA.split('\n').filter(line => line.trim());
  const cards: VocabCard[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header/comment lines
    if (trimmed.startsWith('Kanji') || trimmed.startsWith('Vocab') || 
        trimmed.startsWith('Travel') || trimmed.startsWith('Numbers') ||
        trimmed.includes('especially') || trimmed.includes('gigachads') ||
        trimmed.includes('Real') || trimmed.includes(' Careful') ||
        trimmed.includes('Written')) {
      continue;
    }

    // Pattern 1: kanji (reading) - meaning
    const pattern1 = trimmed.match(/^(.+?)\s*\((\S+)\)\s*[-–—]\s*(.+)$/);
    if (pattern1) {
      cards.push({
        kanji: pattern1[1].trim(),
        reading: pattern1[2].trim(),
        meaning: pattern1[3].trim()
      });
      continue;
    }

    // Pattern 2: kanji number reading (for numbers)
    const pattern2 = trimmed.match(/^(\S+)\s+(\d+[\d,]*)\s+(\S+)$/);
    if (pattern2) {
      cards.push({
        kanji: pattern2[1].trim(),
        reading: pattern2[3].trim(),
        meaning: pattern2[2].trim()
      });
      continue;
    }

    // Pattern 3: katakana only words (like ラーメン)
    const pattern3 = trimmed.match(/^([ア-ン]+)\s*-\s*(.+)$/);
    if (pattern3) {
      cards.push({
        kanji: pattern3[1].trim(),
        reading: pattern3[1].trim(),
        meaning: pattern3[2].trim()
      });
      continue;
    }
  }

  return cards;
};

export const kanjiVocab: VocabCard[] = parseKanjiData();

export const getRandomVocabCards = (count: number): VocabCard[] => {
  const shuffled = [...kanjiVocab].sort(() => Math.random() - 0.5);
  if (count >= kanjiVocab.length) return shuffled;
  return shuffled.slice(0, count);
};
