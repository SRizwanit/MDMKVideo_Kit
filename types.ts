// ধাপ ২ — টাইপ ডেফিনিশন

/** timestamp.json-এর কাঁচা ফরম্যাট (মোবাইলে/টুল থেকে আসা ফাইল) */
export type RawWord = {
  word: string;
  start: string | number; // "MM:SS.mmm" (বা "HH:MM:SS.mmm" বা সেকেন্ড-সংখ্যা)
  end: string | number;
};

export type RawTimestamp = {
  metadata?: {
    duration?: string;
    language?: string;
    topic?: string;
    [key: string]: unknown;
  };
  transcript?: string;
  words: RawWord[];
};

/** পরিষ্কার করা শব্দ — সেকেন্ড ও ফ্রেম দুটোই থাকে */
export type Word = {
  index: number;
  text: string;
  startSec: number;
  endSec: number;
  startFrame: number; // অন্তর্ভুক্ত
  endFrame: number; // বহির্ভূত (endFrame > startFrame নিশ্চিত)
};

/** ক্যাপশন-গ্রুপ (২–৩ শব্দ) — ধাপ ৩-এ Captions.tsx এটা বানাবে */
export type Caption = {
  words: Word[];
  startFrame: number;
  endFrame: number;
};

/** ইনফোগ্রাফিক সিন — ধাপ ৬-এ director.ts এটা বানাবে */
export type Scene = {
  id: string; // যেমন "svg4"
  startFrame: number;
  endFrame: number;
};

export type TimestampMeta = {
  duration?: string;
  language?: string;
  topic?: string;
  transcript?: string;
};

/** parseTimestamp-এর ফলাফল */
export type ParsedTimestamp = {
  meta: TimestampMeta;
  words: Word[];
  /** ডেটা-ঘাটতি/ওভারলাপ ঠিক করার সতর্কবার্তা (বাংলায়) */
  warnings: string[];
  /** শেষ শব্দের শেষ ফ্রেম */
  lastWordFrame: number;
};

/** Video কম্পোজিশনের props (Root.tsx-এর calculateMetadata এগুলো ভরে) */
export type VideoProps = {
  words: Word[];
  meta: TimestampMeta;
  warnings: string[];
  videoSrc: string;
  fps: number;
  /** ধাপ ৬.৩: SFX-ক্রমের সিড = timestamp.json-এর কাঁচা টেক্সটের হ্যাশ (Root-এর calculateMetadata ভরে; না থাকলে শব্দ থেকে হ্যাশ) */
  seed?: number;
};
