// ধাপ ৬.৪ — স্টেজ-লেআউটের সময়-পরিকল্পনা (বিশুদ্ধ TypeScript, Remotion-মুক্ত)
//
// ইনফোগ্রাফিক সিন চলার সময় ভিডিও পুরো-স্ক্রিন থেকে নিচের গোল-কোণা ফ্রেমে ছোট হয় (রেফারেন্স-ছবির মতো),
// ফলে কার্ড বক্তার মাথার উপর পড়ে না। এই ফাইল ঠিক করে: কোন ফ্রেম-পরিসরে ফ্রেম-মোড, আর প্রতি ফ্রেমে ০..১ মান।
//   ০ = পুরো-স্ক্রিন ভিডিও · ১ = পুরো স্টেজ (ছোট ফ্রেম) · মাঝে = ট্রানজিশন

import type {DirectorPlan} from './director';
import type {IntroOutroPlan} from './introOutroPlan';

/** দুই সিনের মাঝের বিরতি এর চেয়ে ছোট হলে ভিডিও ছোট ফ্রেমেই থাকে (বারবার লাফানো ঠেকাতে) — ৪০ ফ্রেম ≈ ১.৩ সে */
export const STAGE_MERGE_GAP = 40;
/** সিন শুরুর কত ফ্রেম আগে ভিডিও ছোট হওয়া শুরু */
export const STAGE_LEAD = 2;
/** ছোট হওয়ার (ঢোকার) দৈর্ঘ্য */
export const STAGE_IN_FRAMES = 14;
/** বড় হওয়ার (বেরোনোর) দৈর্ঘ্য; সিন-শেষের এতগুলো ফ্রেম আগে শুরু হয়ে TAIL ফ্রেম পরে শেষ */
export const STAGE_OUT_FRAMES = 14;
export const STAGE_TAIL = 4;
/** ভিডিওর শুরুর এত ফ্রেমের ভিতরে প্রথম সিন শুরু হলে ভিডিও প্রথম ফ্রেম থেকেই ছোট ফ্রেমে (শুরুতে লাফ নেই) */
export const STAGE_INSTANT_START = 12;

export type StageSegment = {startFrame: number; endFrame: number};

export const planStage = (
  plan: DirectorPlan,
  io: IntroOutroPlan,
  totalFrames: number,
): StageSegment[] => {
  const raw: StageSegment[] = plan.scenes.map((s) => ({startFrame: s.startFrame, endFrame: s.endFrame}));
  // আউট্রো CTA-ও স্টেজেই (নইলে পুরো-স্ক্রিন ভিডিওর উপর কার্ড বসে মাথা ঢাকত)
  if (io.outro) raw.push({startFrame: io.outro.startFrame, endFrame: io.outro.endFrame});
  raw.sort((a, b) => a.startFrame - b.startFrame);

  const merged: StageSegment[] = [];
  for (const r of raw) {
    const last = merged[merged.length - 1];
    if (last && r.startFrame - last.endFrame <= STAGE_MERGE_GAP) {
      last.endFrame = Math.max(last.endFrame, r.endFrame);
    } else {
      merged.push({...r});
    }
  }
  if (merged.length > 0 && merged[0].startFrame <= STAGE_INSTANT_START) merged[0].startFrame = 0;
  // শেষ সেগমেন্ট ভিডিওর শেষ পর্যন্ত গেলে বেরোনোর ট্রানজিশন নেই
  const lastSeg = merged[merged.length - 1];
  if (lastSeg && lastSeg.endFrame >= totalFrames - 1) lastSeg.endFrame = totalFrames + STAGE_TAIL + STAGE_OUT_FRAMES;
  return merged;
};

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** নির্দিষ্ট ফ্রেমে স্টেজ-মান (০..১) */
export const stageAt = (frame: number, segs: StageSegment[]): number => {
  let best = 0;
  for (const s of segs) {
    const inP = s.startFrame <= 0 ? 1 : easeInOut(clamp01((frame - (s.startFrame - STAGE_LEAD)) / STAGE_IN_FRAMES));
    const outP = easeInOut(clamp01((s.endFrame + STAGE_TAIL - frame) / STAGE_OUT_FRAMES));
    best = Math.max(best, Math.min(inP, outP));
  }
  return best;
};
