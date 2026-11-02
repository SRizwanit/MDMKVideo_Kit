// ধাপ ৫ — SFX নির্বাচক (বিশুদ্ধ TypeScript, Remotion-মুক্ত → আলাদা টেস্টযোগ্য)
//
// নিয়ম (ব্যবহারকারীর চাহিদা):
//  • ফাইলের নাম রুটে `sfx1.wav, sfx2.wav, …` (ফ্ল্যাট, সাব-ফোল্ডার নেই)।
//  • "একেক সময়ে একেকটা": পরপর দুটি ইভেন্টে একই SFX নয়; পুলের সবগুলো না ফুরানো পর্যন্ত কোনোটাই রিপিট হয় না।
//  • "প্রতিটা ভিডিও অনুযায়ী ভিন্ন": ক্রম নির্ভর করে ভিডিওর `seed`-এর উপর (timestamp.json-এর টেক্সট থেকে হ্যাশ) →
//    ভিন্ন ভিডিওতে ভিন্ন ক্রম; একই ভিডিও আবার রেন্ডার করলে একই ক্রম (ফল অনিশ্চিত/র‍্যান্ডম নয়)।
//  • সাউন্ড বদলাতে চাইলে শুধু একই নামে `sfxN.wav` রিপ্লেস করো; সংখ্যা বাড়াতে চাইলে `SFX_COUNT` বদলাও।

/** পুলে মোট কতটি sfx ফাইল আছে (sfx1 … sfxN) */
export const SFX_COUNT = 12;
export const SFX_EXT = 'wav';

export const sfxFile = (n: number): string => `sfx${n}.${SFX_EXT}`;

/** FNV-1a ৩২-বিট হ্যাশ → seed */
export const seedFromText = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

/** ছোট ডিটারমিনিস্টিক PRNG (mulberry32) — ০ ≤ মান < ১ */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = (n: number, rand: () => number): number[] => {
  const a = Array.from({length: n}, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * `eventCount`টি ইভেন্টের জন্য sfx-নম্বরের তালিকা (১-ভিত্তিক)।
 * পুলের সবগুলো একবার ব্যবহার না হওয়া পর্যন্ত রিপিট নেই; নতুন রাউন্ডের প্রথমটি আগের শেষটির সমান হয় না।
 */
export const pickSfxSequence = (
  eventCount: number,
  seed: number,
  poolSize: number = SFX_COUNT,
): number[] => {
  if (eventCount <= 0 || poolSize <= 0) return [];
  const rand = mulberry32(seed);
  const out: number[] = [];
  while (out.length < eventCount) {
    const deck = shuffled(poolSize, rand);
    if (poolSize > 1 && out.length > 0 && deck[0] === out[out.length - 1]) {
      // পরপর একই নয়: প্রথমটি সরিয়ে শেষে পাঠানো
      deck.push(deck.shift() as number);
    }
    for (const n of deck) {
      if (out.length < eventCount) out.push(n);
    }
  }
  return out;
};
