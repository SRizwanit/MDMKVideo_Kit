import type {Scene, Word} from './types';
import type {SvgId} from './svgRegistry';
import {cleanWord} from './captionGroups';
import {toBengaliDigits} from './bnDigits';

// ধাপ ৬.২ — ডিরেক্টর (বিশুদ্ধ TypeScript, Remotion-মুক্ত → `npm run test:director`-এ আলাদা টেস্টযোগ্য)
//
// timestamp.json-এর শব্দ-সময় থেকে ঠিক করে: কোন সময়ে কোন ইনফোগ্রাফিক সিন, কোথায় নম্বর-ব্যাজ,
// প্রগ্রেস-ট্র্যাকার কখন কত, কোথায় পাঞ্চ-জুম, আর SFX-এর জন্য ইভেন্ট-তালিকা (ধাপ ৬.৩-এর SfxLayer এটাই নেবে)।
//
// দুই-স্তরের লজিক:
//  ১) কাস্টম-মোড — এই ভিডিও (ইস্তিঞ্জার সুন্নাত ৯–১২): সময়-সীমা → svg1…svg9 (প্ল্যানের টেবিল)।
//     শুধু তখনই চলে যখন শব্দ-সময় ঠিক এই ভিডিওর সাথে মেলে (`matchesCustom`) — নইলে ভুল সিন বসানো ঠেকাতে অটো।
//  ২) অটো-মোড — যেকোনো নতুন ভিডিও: শব্দ-প্যাটার্ন ধরে (সালাম, "এক/দুই… নাম্বার", সংখ্যা, MDMK, কীওয়ার্ড)।

// ───────────── টিউনিং ─────────────
/** সিন শুরু হয় প্রথম শব্দের এতগুলো ফ্রেম আগে (কার্ডের পপ-ইন কথার সাথে মেলাতে) */
export const LEAD_FRAMES = 3;
/** সিন শেষ হয় শেষ শব্দের এতগুলো ফ্রেম পরে (ক্যাপশনের HOLD_FRAMES-এর সমান) */
export const TAIL_FRAMES = 9;
/** কার্ডের এক্সিট (ফেড-আউট) দৈর্ঘ্য */
export const EXIT_FRAMES = 10;
/** সমাপনী সালাম (svg1 ending)-এর নিজস্ব ধীর ফেড */
export const ENDING_EXIT_FRAMES = 14;
/** সিনের সর্বনিম্ন দৈর্ঘ্য (ফ্রেম) */
export const SCENE_MIN_FRAMES = 36;
/** ট্র্যাকার svg2-র রিং ভরার (≈ ৪২ ফ্রেম) পর ঢোকে — "৮/১৬" আগেই দেখিয়ে রিং-এর সারপ্রাইজ নষ্ট না করতে */
export const TRACKER_ENTER_AFTER = 45;
/** svg3-র রিং ৮→১২ চলে সিনের স্থানীয় ফ্রেম ২২ থেকে ৪০ ফ্রেম ধরে (svg3.tsx-এর `countUpSmooth(frame, 8, 12, delay + 22, 40)`) */
export const PLUS_COUNT_AT = 22;
export const PLUS_COUNT_DURATION = 40;
/** ১ সেকেন্ডে সর্বোচ্চ ১টি SFX (ফ্রেমে, ৩০fps) */
export const SFX_MIN_GAP_FRAMES = 30;

/** কোন মোডে চলবে: 'detect' = কাস্টম মিললে কাস্টম, নইলে অটো (ডিফল্ট); 'custom' / 'auto' = জোর করে */
export type DirectorMode = 'detect' | 'custom' | 'auto';
export const DIRECTOR_MODE: DirectorMode = 'detect';

// ───────────── টাইপ ─────────────
export type SceneComponent = SvgId | 'autoPoint' | 'autoCount';
export type AutoIconKind = 'drop' | 'shield' | 'book' | 'check';

export type SceneMoment = {offset: number; label: string};

/** `Scene` (types.ts) + কোন কম্পোনেন্ট/প্রপস/SFX-মুহূর্ত */
export type DirectedScene = Scene & {
  component: SceneComponent;
  /** সমাপনী সালাম (svg1-এর ending সংস্করণ) */
  ending?: boolean;
  /** অটো-কার্ডের প্রপস (autoPoint / autoCount) */
  props?: {
    n?: number;
    headline?: string;
    icon?: AutoIconKind;
    value?: number;
    total?: number;
    plus?: number;
  };
  /** সিনের ভিতরের বড় মুহূর্ত (সিনের স্থানীয় ফ্রেম) — SFX-এর জন্য */
  moments: SceneMoment[];
};

export type BadgePlan = {n: number; startFrame: number; endFrame: number; wordIndex: number};

export type TrackerPlan = {
  from: number;
  to: number;
  total: number;
  startFrame: number;
  endFrame: number;
  /** ট্র্যাকার-Sequence-এর স্থানীয় ফ্রেমে মান বাড়া শুরু */
  animateAt: number;
  animateDuration: number;
  label: string;
};

export type EventKind = 'intro' | 'outro' | 'badge' | 'progress' | 'scene' | 'moment';
export type DirectorEvent = {frame: number; kind: EventKind; sceneId?: string; label: string};

export type ZoomSegment = {startFrame: number; endFrame: number};

export type DirectorPlan = {
  mode: 'custom' | 'auto';
  scenes: DirectedScene[];
  badges: BadgePlan[];
  tracker: TrackerPlan | null;
  /** পাঞ্চ-জুম: প্রতিটি নম্বর-পয়েন্টে ধীরে ১.০৪ → ১.০৮ */
  zoom: ZoomSegment[];
  /** সিন-ট্রানজিশন ফ্ল্যাশ-এর শুরু ফ্রেম */
  flashes: number[];
  /** SFX-ইভেন্ট (ফ্রেম অনুযায়ী সাজানো; ১ সে-তে ১টি নিয়ম এখানে প্রয়োগ হয়নি — `thinEvents` দেখো) */
  events: DirectorEvent[];
  notes: string[];
};

// ───────────── কাস্টম-মোড টেবিল (প্ল্যানের "SVG তালিকা") ─────────────
type CustomRow = {
  component: SvgId;
  startSec: number;
  endSec: number;
  /** শুরুর শব্দ (মিলানোর জন্য) */
  anchor: string;
  ending?: boolean;
  /** SVG-র ভিতরের বড় মুহূর্ত (স্থানীয় ফ্রেম; svgN.tsx-এর টাইমিং থেকে) */
  moments: SceneMoment[];
};

export const CUSTOM_SCENES: CustomRow[] = [
  {component: 'svg1', startSec: 0.26, endSec: 4.3, anchor: 'আসসালামু', moments: []},
  {component: 'svg2', startSec: 4.54, endSec: 10.57, anchor: 'প্রিয়', moments: [{offset: 34, label: 'চিপ "৮ জানা"'}]},
  {component: 'svg3', startSec: 10.57, endSec: 13.05, anchor: 'আজকে', moments: [{offset: 4, label: '"+৪" ব্যাজ পপ'}]},
  {
    component: 'svg4',
    startSec: 15.1,
    endSec: 19.97,
    anchor: 'এক',
    moments: [
      {offset: 40, label: '"বাম" ব্যাজ পপ'},
      {offset: 74, label: 'চেক ✔'},
    ],
  },
  {component: 'svg5', startSec: 20.67, endSec: 28.6, anchor: 'দুই', moments: [{offset: 170, label: 'ফোঁটা বন্ধ ✔ পপ'}]},
  {
    component: 'svg6',
    startSec: 29.61,
    endSec: 41.68,
    anchor: 'তিন',
    moments: [
      {offset: 6, label: 'পর্দা নামা'},
      {offset: 40, label: 'শিল্ড পপ'},
    ],
  },
  {
    component: 'svg7',
    startSec: 42.35,
    endSec: 53.16,
    anchor: 'চার',
    moments: [
      {offset: 40, label: 'নরম ✔'},
      {offset: 48, label: 'শক্ত ✗'},
    ],
  },
  {component: 'svg8', startSec: 54.82, endSec: 59.72, anchor: 'আসুন', moments: [{offset: 52, label: 'চারা গজানো'}]},
  {
    component: 'svg9',
    startSec: 60.34,
    endSec: 66.91,
    anchor: 'দৈনন্দিন',
    moments: [
      {offset: 22, label: 'বেল পপ'},
      {offset: 100, label: 'বেল ঝাঁকুনি'},
    ],
  },
  {component: 'svg1', startSec: 68.05, endSec: 72.04, anchor: 'আসসালামু', ending: true, moments: []},
];

/** কাস্টম-মোড মিলানোর সহনশীলতা (সেকেন্ড) */
const ANCHOR_TOLERANCE_SEC = 0.12;

/** শব্দ-সময় এই ভিডিওর সাথে মেলে কিনা: প্রতিটি সারির শুরুর শব্দ (টেক্সট + সময় ±০.১২ সে) খুঁজে পাওয়া যায় */
export const matchesCustom = (words: Word[]): boolean =>
  CUSTOM_SCENES.every((row) =>
    words.some(
      (w) =>
        cleanWord(w.text) === row.anchor && Math.abs(w.startSec - row.startSec) <= ANCHOR_TOLERANCE_SEC,
    ),
  );

// ───────────── সংখ্যা-শব্দ ─────────────
const NUM_STEM: Record<string, number> = {
  এক: 1, দু: 2, দুই: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9, দশ: 10,
  এগারো: 11, বারো: 12, তেরো: 13, চৌদ্দ: 14, পনেরো: 15, ষোল: 16, সতেরো: 17, আঠারো: 18, উনিশ: 19, বিশ: 20,
};
const COUNT_SUFFIX = /(টির|টার|টা|টি|টে)$/;
const BN_TO_EN: Record<string, string> = {'০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'};
const toEnDigits = (s: string): string => s.replace(/[০-৯]/g, (d) => BN_TO_EN[d]);

/** "আটটি" / "ষোলটির" / "৮" → সংখ্যা; সাধারণ "এক"/"নয়" (এক জন, কাজ নয়) এখানে ধরা হয় না — null */
export const countValue = (text: string): number | null => {
  const w = cleanWord(text);
  if (/^[০-৯0-9]+$/.test(w)) return parseInt(toEnDigits(w), 10);
  if (!COUNT_SUFFIX.test(w)) return null;
  const stem = w.replace(COUNT_SUFFIX, '');
  return NUM_STEM[stem] ?? null;
};

/** "এক নাম্বার"-এর প্রথম শব্দ → সংখ্যা (শুধু পরের শব্দ "নাম্বার/নম্বর" হলে ডাকা হবে) */
const pointValue = (text: string): number | null => {
  const w = cleanWord(text);
  if (/^[০-৯0-9]+$/.test(w)) return parseInt(toEnDigits(w), 10);
  return NUM_STEM[w] ?? null;
};

const isNumberWord = (text: string): boolean => {
  const w = cleanWord(text);
  return w === 'নাম্বার' || w === 'নম্বর' || w === 'নাম্বারে';
};

/** "এক নাম্বার" / "দুই নাম্বার"… জোড়া খোঁজা (দুই ভিডিও-মোডেই ব্যাজের উৎস) */
export const findPointWords = (words: Word[]): {n: number; wordIndex: number; startFrame: number}[] => {
  const out: {n: number; wordIndex: number; startFrame: number}[] = [];
  for (let i = 0; i + 1 < words.length; i++) {
    if (!isNumberWord(words[i + 1].text)) continue;
    const n = pointValue(words[i].text);
    if (n !== null && n >= 1 && n <= 99) out.push({n, wordIndex: i, startFrame: words[i].startFrame});
  }
  return out;
};

// ───────────── বাক্য ভাগ ─────────────
type Sentence = {words: Word[]; first: number; last: number}; // first/last = words[]-এর ইনডেক্স
const SENTENCE_END = /[।॥?!]$/;

const splitSentences = (words: Word[]): Sentence[] => {
  const out: Sentence[] = [];
  let start = 0;
  for (let i = 0; i < words.length; i++) {
    const endsHere = SENTENCE_END.test(words[i].text.trim()) || i === words.length - 1;
    if (endsHere) {
      out.push({words: words.slice(start, i + 1), first: start, last: i});
      start = i + 1;
    }
  }
  return out;
};

// ───────────── সাধারণ সহায়ক ─────────────
const hasOverlapFree = (scenes: DirectedScene[]): boolean =>
  scenes.every((s, i) => i === 0 || s.startFrame >= scenes[i - 1].endFrame);

/** সিনগুলোকে সময়ক্রমে সাজিয়ে ওভারলাপ ছাঁটা + ন্যূনতম দৈর্ঘ্য + মোট দৈর্ঘ্যের ভিতরে রাখা; খুব ছোট হলে বাদ */
const finalizeScenes = (raw: DirectedScene[], totalFrames: number): DirectedScene[] => {
  const sorted = [...raw].sort((a, b) => a.startFrame - b.startFrame);
  const out: DirectedScene[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = {...sorted[i]};
    const nextStart = i + 1 < sorted.length ? sorted[i + 1].startFrame : totalFrames;
    s.startFrame = Math.max(0, s.startFrame);
    s.endFrame = Math.min(s.endFrame, nextStart, totalFrames);
    if (s.endFrame - s.startFrame >= SCENE_MIN_FRAMES) out.push(s);
  }
  return out;
};

const sceneFrames = (startSec: number, endSec: number, fps: number) => ({
  startFrame: Math.max(0, Math.round(startSec * fps) - LEAD_FRAMES),
  endFrame: Math.round(endSec * fps) + TAIL_FRAMES,
});

// ───────────── কাস্টম-মোড ─────────────
const customScenes = (fps: number, totalFrames: number): DirectedScene[] =>
  finalizeScenes(
    CUSTOM_SCENES.map((row) => ({
      // আইডি ইউনিক: component + ending (svg1 দুইবার আসে)
      id: `${row.component}${row.ending ? '-ending' : ''}`,
      component: row.component,
      ending: row.ending,
      ...sceneFrames(row.startSec, row.endSec, fps),
      moments: row.moments,
    })),
    totalFrames,
  );

// ───────────── অটো-মোড ─────────────
const ICON_RULES: [RegExp, AutoIconKind][] = [
  [/পানি|ফোঁটা|ছিটা|ঢিলা|ধোয়া|ওযু|অজু/, 'drop'],
  [/সতর|আড়াল|পর্দা|ঢাকা|লুকা/, 'shield'],
  // ⚠️ "পড়" বাদ: "কাপড়ে"-র ভিতরেও মেলে (ভুল আইকন) — বাংলায় \b কাজ করে না, তাই খণ্ড-শব্দ এড়াতে সাবধান
  [/শিখি|শেখা|শিক্ষা|ইলম|জ্ঞান/, 'book'],
];

/** বাক্যের কীওয়ার্ড থেকে আইকন (না মিললে ✔) */
export const iconFor = (text: string): AutoIconKind => {
  for (const [re, kind] of ICON_RULES) if (re.test(text)) return kind;
  return 'check';
};

const MAX_HEADLINE_CHARS = 70;
const SKIP_AFTER_MARKER = new Set(['হচ্ছে', 'হলো', 'হল', 'হয়']);

const trimPunct = (s: string): string => s.replace(/[\s।॥,;:?!]+$/g, '').replace(/^[\s,;:]+/g, '');

/** "দুই নাম্বার, [শিরোনাম…] করব।" → শিরোনাম অংশ। লম্বা হলে শেষ কমা-খণ্ড, তবু লম্বা হলে শেষের শব্দগুলো */
export const pointHeadline = (sentenceWords: Word[], markerIdx: number): string => {
  let rest = sentenceWords.slice(markerIdx + 1);
  while (rest.length > 0 && SKIP_AFTER_MARKER.has(cleanWord(rest[0].text))) rest = rest.slice(1);
  if (rest.length === 0) return '';
  const join = (ws: Word[]) => trimPunct(ws.map((w) => w.text).join(' '));
  let text = join(rest);
  if (text.length > MAX_HEADLINE_CHARS) {
    // শেষ কমা-খণ্ড
    let lastBreak = -1;
    for (let i = 0; i < rest.length - 1; i++) if (/[,;:]$/.test(rest[i].text.trim())) lastBreak = i;
    if (lastBreak >= 0) text = join(rest.slice(lastBreak + 1));
  }
  if (text.length > MAX_HEADLINE_CHARS) {
    const tail: Word[] = [];
    let len = 0;
    for (let i = rest.length - 1; i >= 0 && len + rest[i].text.length + 1 <= MAX_HEADLINE_CHARS; i--) {
      tail.unshift(rest[i]);
      len += rest[i].text.length + 1;
    }
    text = join(tail);
  }
  return text;
};

const PLUS_CUES = /পরবর্তী|আরও|আরো|আজকে|আজ/;

const autoScenes = (words: Word[], totalFrames: number): DirectedScene[] => {
  const sentences = splitSentences(words);
  const raw: DirectedScene[] = [];
  const lastWordFrame = words.length ? words[words.length - 1].endFrame : 0;
  let k = 0;
  for (const s of sentences) {
    const first = s.words[0];
    const last = s.words[s.words.length - 1];
    const endFrame = last.endFrame + TAIL_FRAMES;
    const startFrame = first.startFrame - LEAD_FRAMES;
    const sentenceText = s.words.map((w) => w.text).join(' ');
    k++;

    // ১) সালাম (শুরুতে = ইন্ট্রো, শেষ ৪০%-এ = আউট্রো)
    if (cleanWord(first.text).startsWith('আসসালামু')) {
      const ending = first.startFrame > lastWordFrame * 0.6;
      raw.push({
        id: ending ? 'svg1-ending' : 'svg1',
        component: 'svg1',
        ending,
        startFrame,
        endFrame,
        moments: [],
      });
      continue;
    }

    // ২) "এক নাম্বার…" → নম্বর-কার্ড
    const pIdx = s.words.findIndex((w, i) => i + 1 < s.words.length && isNumberWord(s.words[i + 1].text) && pointValue(w.text) !== null);
    if (pIdx >= 0) {
      const n = pointValue(s.words[pIdx].text) as number;
      const headline = pointHeadline(s.words, pIdx + 1);
      raw.push({
        id: `point-${n}`,
        component: 'autoPoint',
        startFrame: s.words[pIdx].startFrame - LEAD_FRAMES,
        endFrame,
        props: {n, headline, icon: iconFor(headline || sentenceText)},
        moments: [{offset: 14, label: 'আইকন ড্র-অন'}],
      });
      continue;
    }

    // ৩) MDMK → ব্র্যান্ড ব্যাজ
    if (s.words.some((w) => cleanWord(w.text).toUpperCase() === 'MDMK')) {
      raw.push({
        id: 'svg9',
        component: 'svg9',
        startFrame,
        endFrame,
        moments: [
          {offset: 22, label: 'বেল পপ'},
          {offset: 100, label: 'বেল ঝাঁকুনি'},
        ],
      });
      continue;
    }

    // ৪) সুন্নাত + শেখা/গড়া → বই-সিন
    if (/সুন্নাত/.test(sentenceText) && /শিখি|শিখব|শিখবো|গড়ি|গড়ব|গড়বো/.test(sentenceText)) {
      raw.push({
        id: 'svg8',
        component: 'svg8',
        startFrame,
        endFrame,
        moments: [{offset: 52, label: 'চারা গজানো'}],
      });
      continue;
    }

    // ৫) সংখ্যা → কাউন্টার/রিং
    const nums = s.words
      .map((w, i) => ({v: countValue(w.text), i}))
      .filter((x): x is {v: number; i: number} => x.v !== null);
    if (nums.length >= 2) {
      const total = nums.reduce((a, b) => (b.v > a.v ? b : a));
      // মোটের পরের প্রথম ছোট সংখ্যা = জানা সংখ্যা ("ষোলটি … আটটি")
      const after = nums.find((x) => x.i > total.i && x.v < total.v);
      if (after) {
        raw.push({
          id: `count-${k}`,
          component: 'autoCount',
          startFrame,
          endFrame,
          props: {value: after.v, total: total.v},
          moments: [{offset: 34, label: 'চিপ'}],
        });
        continue;
      }
    } else if (nums.length === 1 && PLUS_CUES.test(sentenceText)) {
      raw.push({
        id: `count-${k}`,
        component: 'autoCount',
        startFrame,
        endFrame,
        props: {plus: nums[0].v},
        moments: [{offset: 4, label: '"+n" ব্যাজ পপ'}],
      });
      continue;
    }
    // বাকি বাক্য: কোনো কার্ড নেই (বক্তা + ক্যাপশন)
  }
  return finalizeScenes(raw, totalFrames);
};

// ───────────── ট্র্যাকার ─────────────
const customTracker = (scenes: DirectedScene[]): TrackerPlan | null => {
  const s2 = scenes.find((s) => s.component === 'svg2');
  const s3 = scenes.find((s) => s.component === 'svg3');
  const s7 = scenes.find((s) => s.component === 'svg7');
  if (!s2 || !s3 || !s7) return null;
  const startFrame = s2.startFrame + TRACKER_ENTER_AFTER;
  const endFrame = s7.endFrame;
  if (startFrame >= endFrame) return null;
  return {
    from: 8,
    to: 12,
    total: 16,
    startFrame,
    endFrame,
    animateAt: Math.max(0, s3.startFrame + PLUS_COUNT_AT - startFrame),
    animateDuration: PLUS_COUNT_DURATION,
    label: 'সুন্নাত',
  };
};

const autoTracker = (scenes: DirectedScene[]): TrackerPlan | null => {
  const ringIdx = scenes.findIndex((s) => s.component === 'autoCount' && s.props?.total !== undefined);
  if (ringIdx < 0) return null;
  const ring = scenes[ringIdx];
  const plusScene = scenes.slice(ringIdx + 1, ringIdx + 3).find((s) => s.component === 'autoCount' && s.props?.plus !== undefined);
  const points = scenes.filter((s) => s.component === 'autoPoint' && s.startFrame > ring.startFrame);
  const lastScene = points.length ? points[points.length - 1] : plusScene ?? ring;
  const startFrame = ring.startFrame + TRACKER_ENTER_AFTER;
  const endFrame = lastScene.endFrame;
  if (startFrame >= endFrame) return null;
  const from = ring.props?.value ?? 0;
  const total = ring.props?.total ?? 16;
  const plus = plusScene?.props?.plus ?? 0;
  return {
    from,
    to: Math.min(total, from + plus),
    total,
    startFrame,
    endFrame,
    animateAt: plusScene ? Math.max(0, plusScene.startFrame + PLUS_COUNT_AT - startFrame) : 0,
    animateDuration: PLUS_COUNT_DURATION,
    label: 'সুন্নাত',
  };
};

// ───────────── ইভেন্ট ও SFX-ছাঁটাই ─────────────
const EVENT_PRIORITY: Record<EventKind, number> = {
  intro: 0,
  outro: 0,
  badge: 1,
  progress: 2,
  scene: 3,
  moment: 4,
};

const buildEvents = (
  scenes: DirectedScene[],
  badges: BadgePlan[],
  tracker: TrackerPlan | null,
): DirectorEvent[] => {
  const ev: DirectorEvent[] = [];
  for (const s of scenes) {
    const hasBadge = badges.some((b) => Math.abs(b.startFrame - s.startFrame) <= 8 + LEAD_FRAMES);
    if (s.component === 'svg1') {
      ev.push({frame: s.startFrame, kind: s.ending ? 'outro' : 'intro', sceneId: s.id, label: s.ending ? 'সমাপনী সালাম' : 'শুরুর সালাম'});
    } else if (!hasBadge) {
      ev.push({frame: s.startFrame, kind: 'scene', sceneId: s.id, label: `সিন শুরু: ${s.id}`});
    }
    for (const m of s.moments) {
      const frame = s.startFrame + m.offset;
      if (frame < s.endFrame) ev.push({frame, kind: 'moment', sceneId: s.id, label: m.label});
    }
  }
  for (const b of badges) ev.push({frame: b.startFrame, kind: 'badge', label: `নম্বর-ব্যাজ ${toBengaliDigits(b.n)}`});
  if (tracker && tracker.to !== tracker.from) {
    ev.push({frame: tracker.startFrame + tracker.animateAt, kind: 'progress', label: `প্রগ্রেস ${tracker.from}→${tracker.to}`});
  }
  return ev.sort((a, b) => a.frame - b.frame || EVENT_PRIORITY[a.kind] - EVENT_PRIORITY[b.kind]);
};

/**
 * "১ সেকেন্ডে সর্বোচ্চ ১টি" নিয়মে ইভেন্ট ছাঁটা: গুরুত্ব অনুযায়ী (ইন্ট্রো/আউট্রো > ব্যাজ > প্রগ্রেস > সিন > মুহূর্ত)
 * আগে নেওয়া হয়, আগে-নেওয়া কোনোটির `minGap` ফ্রেমের ভিতরে হলে বাদ। ফলাফল ফ্রেম-ক্রমে।
 * (ধাপ ৬.৩-এর SfxLayer: `pickSfxSequence(thinEvents(plan.events).length, seed)`)
 */
export const thinEvents = (events: DirectorEvent[], minGap: number = SFX_MIN_GAP_FRAMES): DirectorEvent[] => {
  const order = [...events].sort(
    (a, b) => EVENT_PRIORITY[a.kind] - EVENT_PRIORITY[b.kind] || a.frame - b.frame,
  );
  const kept: DirectorEvent[] = [];
  for (const e of order) {
    if (kept.every((k) => Math.abs(k.frame - e.frame) >= minGap)) kept.push(e);
  }
  return kept.sort((a, b) => a.frame - b.frame);
};

// ───────────── মূল ফাংশন ─────────────
export const emptyPlan = (): DirectorPlan => ({
  mode: 'auto',
  scenes: [],
  badges: [],
  tracker: null,
  zoom: [],
  flashes: [],
  events: [],
  notes: ['শব্দ নেই — কোনো ইনফোগ্রাফিক বসানো হয়নি'],
});

/**
 * টাইমস্ট্যাম্প থেকে পুরো ভিডিওর পরিকল্পনা।
 * @param words        parseTimestamp-এর শব্দ (ফ্রেম-সহ)
 * @param fps          ভিডিওর fps (৩০)
 * @param totalFrames  ভিডিওর মোট ফ্রেম
 */
export const direct = (
  words: Word[],
  fps: number,
  totalFrames: number,
  mode: DirectorMode = DIRECTOR_MODE,
): DirectorPlan => {
  if (words.length === 0 || totalFrames <= 0) return emptyPlan();

  const notes: string[] = [];
  const customOk = matchesCustom(words);
  let used: 'custom' | 'auto';
  if (mode === 'custom') {
    used = 'custom';
    if (!customOk) notes.push('⚠️ কাস্টম-মোড জোর করা হয়েছে, কিন্তু শব্দ-সময় এই ভিডিওর সাথে পুরোপুরি মেলে না');
  } else if (mode === 'auto') {
    used = 'auto';
  } else {
    used = customOk ? 'custom' : 'auto';
    notes.push(customOk ? 'কাস্টম-মোড (শব্দ-সময় মিলেছে)' : 'অটো-মোড (কাস্টম টেবিলের সাথে মেলেনি)');
  }

  const scenes = used === 'custom' ? customScenes(fps, totalFrames) : autoScenes(words, totalFrames);

  // নম্বর-ব্যাজ: "এক নাম্বার" শব্দ ধরে; যে সিনের ভিতরে পড়ে তার শেষ পর্যন্ত থাকে
  const badges: BadgePlan[] = [];
  for (const p of findPointWords(words)) {
    const scene = scenes.find((s) => p.startFrame >= s.startFrame && p.startFrame < s.endFrame);
    if (!scene) {
      notes.push(`"${toBengaliDigits(p.n)} নাম্বার"-এর জন্য সিন নেই — ব্যাজ বাদ`);
      continue;
    }
    const startFrame = Math.max(scene.startFrame, p.startFrame);
    badges.push({n: p.n, startFrame, endFrame: scene.endFrame, wordIndex: p.wordIndex});
  }

  const tracker = used === 'custom' ? customTracker(scenes) : autoTracker(scenes);
  // পাঞ্চ-জুম: প্রতিটি নম্বর-পয়েন্টে (ব্যাজের শুরু → সিনের শেষ)
  const zoom: ZoomSegment[] = badges.map((b) => ({startFrame: b.startFrame, endFrame: b.endFrame}));
  const flashes = scenes.map((s) => s.startFrame);
  const events = buildEvents(scenes, badges, tracker);

  if (!hasOverlapFree(scenes)) notes.push('⚠️ সিন ওভারলাপ করছে');
  return {mode: used, scenes, badges, tracker, zoom, flashes, events, notes};
};

/** সিনের ভিতরের ঘড়ির জন্য: প্রদত্ত ফ্রেমে কোন সিন চলছে (না থাকলে null) */
export const sceneAt = (plan: DirectorPlan, frame: number): DirectedScene | null =>
  plan.scenes.find((s) => frame >= s.startFrame && frame < s.endFrame) ?? null;
