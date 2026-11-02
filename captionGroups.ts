import type {Caption, Word} from './types';

// ধাপ ৩ — ক্যাপশন গ্রুপিং ও কিওয়ার্ড লজিক (বিশুদ্ধ TypeScript, Remotion-মুক্ত → আলাদাভাবে টেস্টযোগ্য)

// ───────────── টিউনিং ধ্রুবক ─────────────
export const MAX_WORDS_PER_GROUP = 3;
/** গ্রুপের মোট অক্ষর-সীমা (খুব লম্বা শব্দ জুড়ে ক্যাপশন উপচে পড়া ঠেকাতে) */
export const MAX_CHARS_PER_GROUP = 28;
/** এই বিরতির (সেকেন্ড) বেশি হলে নতুন গ্রুপ */
export const GAP_BREAK_SEC = 1.0;
/** গ্রুপের শেষ শব্দের পর ক্যাপশন যতক্ষণ ধরে রাখা হবে (ফ্রেমে, ৩০fps-এ ০.৩ সে) */
export const HOLD_FRAMES = 9;
/** দীর্ঘ বিরতিতে ফেড-আউটের দৈর্ঘ্য (ফ্রেম) */
export const FADE_OUT_FRAMES = 5;

// ───────────── শব্দ-শ্রেণি ─────────────
export type WordKind = 'normal' | 'number' | 'keyword' | 'brand';

const PUNCT_TRIM = /[।॥,?!.;:…"'“”‘’()\-–—]/g;
/** শব্দের শেষে বিরামচিহ্ন থাকলে গ্রুপ সেখানেই শেষ */
const END_PUNCT = /[।॥,?!.;:…]$/;

export const cleanWord = (text: string): string =>
  text.replace(PUNCT_TRIM, '').trim();

const NUMBER_WORDS = new Set([
  'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
  'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
  // সংখ্যা + টি/টির/টা (যেমন "আটটি", "ষোলটি", "চারটির")
  'একটি', 'দুটি', 'দুইটি', 'তিনটি', 'চারটি', 'চারটির', 'পাঁচটি', 'ছয়টি',
  'সাতটি', 'আটটি', 'নয়টি', 'দশটি', 'বারোটি', 'ষোলটি', 'ষোলটির',
]);
const BENGALI_OR_ASCII_DIGITS = /^[০-৯0-9]+([/.:][০-৯0-9]+)?$/;

const KEYWORD_PREFIXES = ['সুন্নাত'];
const KEYWORD_EXACT = new Set(['বাম', 'হাত']);

/**
 * একটি শব্দের ধরন:
 *  - number  : এক/দুই/তিন/চার, ৮, ১৬, আটটি, ষোলটি …
 *  - keyword : "সুন্নাত…", "বাম হাত"
 *  - brand   : MDMK
 */
export const classifyWord = (text: string): WordKind => {
  const w = cleanWord(text);
  if (w === '') return 'normal';
  if (w.toUpperCase() === 'MDMK') return 'brand';
  if (NUMBER_WORDS.has(w) || BENGALI_OR_ASCII_DIGITS.test(w)) return 'number';
  if (KEYWORD_EXACT.has(w)) return 'keyword';
  if (KEYWORD_PREFIXES.some((p) => w.startsWith(p))) return 'keyword';
  return 'normal';
};

/**
 * "বাম" ও "হাত" আলাদাভাবে সাধারণ শব্দ হিসেবেও আসতে পারে (যেমন "হাত ধোয়া")।
 * তাই এদের কিওয়ার্ড ধরা হয় শুধু পরপর "বাম হাত" জোড়া হলে।
 */
export const classifyWords = (words: Word[]): WordKind[] => {
  const kinds: WordKind[] = words.map((w) => classifyWord(w.text));
  for (let i = 0; i < words.length; i++) {
    const w = cleanWord(words[i].text);
    if (w === 'বাম' || w === 'হাত') {
      const prev = i > 0 ? cleanWord(words[i - 1].text) : '';
      const next = i < words.length - 1 ? cleanWord(words[i + 1].text) : '';
      const isPair =
        (w === 'বাম' && next === 'হাত') || (w === 'হাত' && prev === 'বাম');
      kinds[i] = isPair ? 'keyword' : 'normal';
    }
  }
  return kinds;
};

// ───────────── গ্রুপ ─────────────
export type CaptionGroup = Caption & {
  /** গ্রুপের প্রতিটি শব্দের ধরন (words-এর সাথে একই ক্রম) */
  kinds: WordKind[];
  /** ক্যাপশন দেখানো শুরু (অন্তর্ভুক্ত) */
  showStart: number;
  /** ক্যাপশন দেখানো শেষ (বহির্ভূত) */
  showEnd: number;
  /** শেষে ফেড-আউট হবে কিনা (পরের গ্রুপ সাথে সাথে না এলে true) */
  fadeOut: boolean;
};

const endsWithPunct = (text: string): boolean => END_PUNCT.test(text.trim());

/**
 * শব্দ → ক্যাপশন-গ্রুপ। ব্রেকের নিয়ম:
 *  ১) সর্বোচ্চ ৩ শব্দ
 *  ২) শব্দের শেষে বিরামচিহ্ন (।  ,  ?  !) থাকলে ওই শব্দের পরই গ্রুপ শেষ
 *  ৩) আগের শব্দ থেকে ১ সেকেন্ডের বেশি বিরতি থাকলে নতুন গ্রুপ
 *  ৪) মোট অক্ষর ২৮-এর বেশি হয়ে গেলে নতুন গ্রুপ
 *  ৫) "বাম হাত" জোড়া কখনো দুই গ্রুপে ভাঙে না
 */
export const buildCaptionGroups = (words: Word[]): CaptionGroup[] => {
  const kinds = classifyWords(words);
  const buckets: number[][] = []; // শব্দের ইনডেক্স-তালিকা
  let current: number[] = [];
  let chars = 0;

  const flush = () => {
    if (current.length) buckets.push(current);
    current = [];
    chars = 0;
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = i > 0 ? words[i - 1] : null;
    const len = cleanWord(w.text).length;

    if (current.length > 0 && prev) {
      const gapSec = w.startSec - prev.endSec;
      const bigGap = gapSec > GAP_BREAK_SEC;
      const full = current.length >= MAX_WORDS_PER_GROUP;
      const tooLong = chars + len > MAX_CHARS_PER_GROUP;
      const prevPunct = endsWithPunct(prev.text);
      // "বাম" + "হাত" জোড়া ভাঙা যাবে না (শুধু বিরামচিহ্ন/বড় বিরতি ছাড়া)
      const keepPair =
        kinds[i - 1] === 'keyword' &&
        kinds[i] === 'keyword' &&
        cleanWord(prev.text) === 'বাম' &&
        cleanWord(w.text) === 'হাত';
      if (prevPunct || bigGap || (!keepPair && (full || tooLong))) {
        flush();
      }
    }
    current.push(i);
    chars += len;
  }
  flush();

  const groups: CaptionGroup[] = buckets.map((idxs) => {
    const gw = idxs.map((i) => words[i]);
    return {
      words: gw,
      kinds: idxs.map((i) => kinds[i]),
      startFrame: gw[0].startFrame,
      endFrame: gw[gw.length - 1].endFrame,
      showStart: gw[0].startFrame,
      showEnd: gw[gw.length - 1].endFrame,
      fadeOut: true,
    };
  });

  // দেখানোর সময় = শেষ শব্দ + HOLD, কিন্তু পরের গ্রুপের শুরুর আগেই থামবে।
  // পরের গ্রুপ সাথে সাথে এলে ফেড-আউট নয় (ফ্লিকার এড়াতে)।
  for (let g = 0; g < groups.length; g++) {
    const next = groups[g + 1];
    const wantedEnd = groups[g].endFrame + HOLD_FRAMES;
    if (next && wantedEnd >= next.showStart) {
      groups[g].showEnd = next.showStart;
      groups[g].fadeOut = false;
    } else {
      groups[g].showEnd = wantedEnd;
      groups[g].fadeOut = true;
    }
  }
  return groups;
};

/** নির্দিষ্ট ফ্রেমে যে গ্রুপ দেখাতে হবে (নেই হলে null) */
export const findGroupAt = (
  groups: CaptionGroup[],
  frame: number,
): CaptionGroup | null => {
  for (const g of groups) {
    if (frame >= g.showStart && frame < g.showEnd) return g;
  }
  return null;
};

/** গ্রুপ-ভিত্তিক ফন্ট-সাইজ: লম্বা গ্রুপে ছোট (উপচে পড়া এড়াতে) */
export const fontSizeForGroup = (group: CaptionGroup): number => {
  const chars = group.words.reduce((n, w) => n + cleanWord(w.text).length, 0);
  if (chars > 22) return 68;
  if (chars > 16) return 78;
  return 90;
};
