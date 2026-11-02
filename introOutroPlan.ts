// ধাপ ৬.৩ — ইন্ট্রো/আউট্রোর সময়-পরিকল্পনা (বিশুদ্ধ TypeScript, Remotion-মুক্ত → `npm run test:layers`-এ টেস্টযোগ্য)
//
// • ইন্ট্রো টাইটেল: ভিডিওর শুরুতে উপরের ট্র্যাকার-জোনে (y ১৫০–২৩৪) ছোট পটি — সিন ১-এ ট্র্যাকার নেই, তাই জায়গা খালি।
//   ট্র্যাকার আগে ঢুকলে (অটো-মোড) ইন্ট্রো তার আগেই সরে যায়।
// • আউট্রো CTA: শেষ ইনফোগ্রাফিক-কার্ডের (সমাপনী সালাম) পর কার্ড-জোনে "MDMK এর সাথে থাকুন"।
//   কার্ডের সাথে সংঘর্ষ এড়াতে শেষ কার্ডের এক্সিটে সামান্য (OUTRO_OVERLAP) ঢুকে শুরু হয়; জায়গা কম হলে বাদ (ভুল ওভারলাপের চেয়ে বাদ ভালো)।

import type {DirectorPlan} from './director';

/** ইন্ট্রো টাইটেলের সর্বোচ্চ দৈর্ঘ্য (৩.৫ সে) */
export const INTRO_MAX_FRAMES = 105;
/** ইন্ট্রো কত ফ্রেমে শুরু (সালাম-কার্ড ৫-এ শুরু; পটি একটু আগে ঢোকে) */
export const INTRO_START_FRAME = 2;
/** ইন্ট্রোর ন্যূনতম দৈর্ঘ্য — এর কম হলে দেখানো হয় না */
export const INTRO_MIN_FRAMES = 30;
/** অটো-মোডে ট্র্যাকার ঢোকার কত ফ্রেম আগে ইন্ট্রো শেষ */
export const INTRO_TRACKER_GAP = 6;

/** আউট্রো CTA-র সর্বোচ্চ দৈর্ঘ্য (শেষ ৩ সে) */
export const OUTRO_FRAMES = 90;
/** আউট্রোর ন্যূনতম দৈর্ঘ্য (১.২ সে) — এর কম জায়গা থাকলে বাদ */
export const OUTRO_MIN_FRAMES = 36;
/** শেষ কার্ডের এক্সিট-ফেডের উপর যত ফ্রেম ঢুকে আউট্রো শুরু (ক্রসফেড) */
export const OUTRO_OVERLAP = 6;
/** আউট্রো CTA-র SFX আউট্রো শুরুর কত ফ্রেম পরে বাজে */
export const OUTRO_SFX_DELAY = 4;

export type FrameWindow = {startFrame: number; endFrame: number};

export type IntroOutroPlan = {
  intro: FrameWindow | null;
  outro: FrameWindow | null;
  /** যা বাদ পড়েছে/বদলেছে তার কারণ (বাংলায়) */
  notes: string[];
};

export const planIntroOutro = (plan: DirectorPlan, totalFrames: number): IntroOutroPlan => {
  const notes: string[] = [];
  if (totalFrames <= 0) return {intro: null, outro: null, notes: ['ভিডিওর দৈর্ঘ্য ০ — ইন্ট্রো/আউট্রো নেই']};

  // ── ইন্ট্রো ──
  let introEnd = Math.min(INTRO_MAX_FRAMES, totalFrames - 1);
  if (plan.tracker && plan.tracker.startFrame - INTRO_TRACKER_GAP < introEnd) {
    introEnd = plan.tracker.startFrame - INTRO_TRACKER_GAP;
    notes.push('ইন্ট্রো ট্র্যাকারের আগে শেষ করা হলো (একই জায়গা)');
  }
  const intro: FrameWindow | null =
    introEnd - INTRO_START_FRAME >= INTRO_MIN_FRAMES ? {startFrame: INTRO_START_FRAME, endFrame: introEnd} : null;
  if (!intro) notes.push('ইন্ট্রোর জায়গা/সময় কম — ইন্ট্রো টাইটেল বাদ');

  // ── আউট্রো ──
  const lastCardEnd = plan.scenes.reduce((m, s) => Math.max(m, s.endFrame), 0);
  const outroStart = Math.max(totalFrames - OUTRO_FRAMES, lastCardEnd - OUTRO_OVERLAP, 0);
  const outro: FrameWindow | null =
    totalFrames - outroStart >= OUTRO_MIN_FRAMES ? {startFrame: outroStart, endFrame: totalFrames} : null;
  if (!outro) notes.push('শেষ কার্ডের পর আউট্রোর জায়গা কম — CTA বাদ');

  return {intro, outro, notes};
};
