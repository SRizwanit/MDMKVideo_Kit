import type {ParsedTimestamp, RawTimestamp, RawWord, Word} from './types';

/**
 * "MM:SS.mmm" → সেকেন্ড।
 * সাপোর্টেড: "01:06.110", "1:06.11", "00:01:06.110" (HH:MM:SS.mmm), "66.11", 66.11
 */
export const parseTimeToSeconds = (value: string | number): number => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`অবৈধ সময়: ${value}`);
    }
    return value;
  }
  const str = String(value).trim().replace(',', '.'); // "01:06,110" ও চলবে
  if (str === '') {
    throw new Error('সময় খালি');
  }
  const parts = str.split(':');
  if (parts.length > 3) {
    throw new Error(`অবৈধ সময়ের ফরম্যাট: "${value}"`);
  }
  let seconds = 0;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`অবৈধ সময়ের ফরম্যাট: "${value}"`);
    }
    seconds = seconds * 60 + n;
  }
  return seconds;
};

export const secondsToFrames = (sec: number, fps: number): number =>
  Math.round(sec * fps);

/**
 * কাঁচা JSON → পরিষ্কার, ফ্রেম-ভিত্তিক শব্দ-তালিকা।
 * ঠিক করা হয়:
 *  - start অনুযায়ী সাজানো
 *  - খালি শব্দ বাদ
 *  - end < start হলে end = start
 *  - পরের শব্দের সাথে ওভারলাপ হলে আগের শব্দের end ছেঁটে দেওয়া
 *  - প্রতিটি শব্দ কমপক্ষে ১ ফ্রেম লম্বা (endFrame > startFrame)
 * শব্দের মাঝের স্বাভাবিক বিরতি (gap) ইচ্ছাকৃতভাবে অক্ষত রাখা হয়,
 * যাতে ধাপ ৩-এর ক্যাপশন ইঞ্জিন বিরতিতে ক্যাপশন লুকাতে পারে।
 */
export const parseTimestamp = (
  raw: unknown,
  fps: number,
): ParsedTimestamp => {
  if (fps <= 0 || !Number.isFinite(fps)) {
    throw new Error('fps অবশ্যই ধনাত্মক সংখ্যা হতে হবে');
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error(
      'timestamp.json ঠিকমতো পড়া যায়নি: ফাইলটি একটি JSON অবজেক্ট হতে হবে',
    );
  }
  const data = raw as RawTimestamp;
  if (!Array.isArray(data.words) || data.words.length === 0) {
    throw new Error(
      'timestamp.json-এ "words" তালিকা নেই বা খালি। প্রতিটি আইটেমে word, start, end থাকতে হবে',
    );
  }

  const warnings: string[] = [];

  // ১) পার্স
  type Tmp = {text: string; startSec: number; endSec: number; src: number};
  const tmp: Tmp[] = [];
  data.words.forEach((w: RawWord, i: number) => {
    if (!w || typeof w.word !== 'string') {
      throw new Error(`words[${i}]: "word" ফিল্ড নেই`);
    }
    const text = w.word.trim();
    if (text === '') {
      warnings.push(`words[${i}]: খালি শব্দ বাদ দেওয়া হয়েছে`);
      return;
    }
    let startSec: number;
    let endSec: number;
    try {
      startSec = parseTimeToSeconds(w.start);
      endSec = parseTimeToSeconds(w.end);
    } catch (e) {
      throw new Error(
        `words[${i}] ("${text}"): ${(e as Error).message}`,
      );
    }
    if (endSec < startSec) {
      warnings.push(
        `words[${i}] ("${text}"): end < start ছিল, end = start করা হয়েছে`,
      );
      endSec = startSec;
    }
    tmp.push({text, startSec, endSec, src: i});
  });

  if (tmp.length === 0) {
    throw new Error('timestamp.json-এ কোনো বৈধ শব্দ পাওয়া যায়নি');
  }

  // ২) সাজানো (stable)
  let outOfOrder = false;
  for (let i = 1; i < tmp.length; i++) {
    if (tmp[i].startSec < tmp[i - 1].startSec) {
      outOfOrder = true;
      break;
    }
  }
  if (outOfOrder) {
    warnings.push('শব্দগুলো সময়ের ক্রমে ছিল না, সাজিয়ে নেওয়া হয়েছে');
    tmp.sort((a, b) => a.startSec - b.startSec || a.src - b.src);
  }

  // ৩) ফ্রেমে রূপান্তর + ওভারলাপ/ন্যূনতম-দৈর্ঘ্য ঠিক করা
  const words: Word[] = [];
  let prevStartFrame = -1;
  for (let i = 0; i < tmp.length; i++) {
    const t = tmp[i];
    // শুরু: আগের শব্দের শুরুর চেয়ে কমপক্ষে ১ ফ্রেম পরে
    let startFrame = secondsToFrames(t.startSec, fps);
    if (startFrame <= prevStartFrame) {
      startFrame = prevStartFrame + 1;
    }
    let endFrame = secondsToFrames(t.endSec, fps);
    if (endFrame <= startFrame) {
      endFrame = startFrame + 1;
    }
    words.push({
      index: words.length,
      text: t.text,
      startSec: t.startSec,
      endSec: t.endSec,
      startFrame,
      endFrame,
    });
    prevStartFrame = startFrame;
  }

  // ওভারলাপ ছাঁটা: শব্দের end পরের শব্দের start-এর বেশি হতে পারবে না
  let trimmed = 0;
  for (let i = 0; i < words.length - 1; i++) {
    const next = words[i + 1];
    if (words[i].endFrame > next.startFrame) {
      words[i].endFrame = next.startFrame; // কমপক্ষে ১ ফ্রেম নিশ্চিত (start strictly increasing)
      trimmed++;
    }
  }
  if (trimmed > 0) {
    warnings.push(`${trimmed}টি শব্দের ওভারলাপ ছেঁটে ঠিক করা হয়েছে`);
  }

  const meta = {
    duration: data.metadata?.duration,
    language: data.metadata?.language,
    topic: data.metadata?.topic,
    transcript: typeof data.transcript === 'string' ? data.transcript : undefined,
  };

  return {
    meta,
    words,
    warnings,
    lastWordFrame: words[words.length - 1].endFrame,
  };
};

/** দুই শব্দের মাঝের বিরতি (সেকেন্ডে) — ধাপ ৩-এর গ্যাপ-লজিকে কাজে লাগবে */
export const gapSecondsBetween = (a: Word, b: Word): number =>
  Math.max(0, b.startSec - a.endSec);
