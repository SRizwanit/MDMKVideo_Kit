import {Easing, interpolate, spring} from 'remotion';

// ধাপ ৪ — অ্যানিমেশন ব্লক (popIn, slideIn, drawOn, countUp, shake, wipe + fadeOut)
// সব ফাংশন `frame` নেয় (কম্পোনেন্টের স্থানীয় useCurrentFrame) এবং `delay` ফ্রেম পর শুরু হয়।
// Sequence-এর ভিতরে ব্যবহার করলে frame স্বাভাবিকভাবেই সিনের শুরু থেকে গোনা হয়।

export type SpringCfg = {damping?: number; stiffness?: number; mass?: number};

const POP_CFG: SpringCfg = {damping: 10, stiffness: 180, mass: 0.6};
const SLIDE_CFG: SpringCfg = {damping: 16, stiffness: 120, mass: 0.8};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** পপ-ইন: ০ → ১ (সামান্য ওভারশুট ≈১.১)। স্কেল/অপাসিটিতে ব্যবহার। */
export const popIn = (
  frame: number,
  fps: number,
  delay = 0,
  config: SpringCfg = POP_CFG,
): number => spring({frame: Math.max(0, frame - delay), fps, config});

export type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * স্লাইড-ইন: `direction` = যেদিক থেকে ঢুকবে ('left' = বাঁ থেকে, 'up' = উপর থেকে, 'down' = নিচ থেকে)।
 * ফেরত: {x, y, opacity} (px ও ০–১)
 */
export const slideIn = (
  frame: number,
  fps: number,
  delay = 0,
  direction: Direction = 'left',
  distance = 300,
): {x: number; y: number; opacity: number} => {
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SLIDE_CFG,
  });
  const remain = 1 - p;
  const x =
    direction === 'left' ? -distance * remain : direction === 'right' ? distance * remain : 0;
  const y =
    direction === 'up' ? -distance * remain : direction === 'down' ? distance * remain : 0;
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], clamp);
  return {x, y, opacity};
};

/**
 * ড্র-অন (stroke-dashoffset): রেখা ধীরে ধীরে আঁকা হয়।
 * `length` = পাথের মোট দৈর্ঘ্য (SVG-তে `getTotalLength()` বা হিসাব করা মান)।
 * ব্যবহার: <path strokeDasharray={d.strokeDasharray} strokeDashoffset={d.strokeDashoffset} />
 */
export const drawOn = (
  frame: number,
  delay: number,
  length: number,
  durationInFrames = 30,
): {strokeDasharray: number; strokeDashoffset: number; progress: number} => {
  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - progress),
    progress,
  };
};

/** কাউন্ট-আপ: from → to (পূর্ণসংখ্যায় রাউন্ড)। যেমন ৮ → ১২। */
export const countUp = (
  frame: number,
  from: number,
  to: number,
  delay = 0,
  durationInFrames = 30,
): number =>
  Math.round(
    interpolate(frame - delay, [0, durationInFrames], [from, to], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    }),
  );

/** কাউন্ট-আপের মসৃণ (ভগ্নাংশসহ) মান — বার/রিং ভরাটে ব্যবহার */
export const countUpSmooth = (
  frame: number,
  from: number,
  to: number,
  delay = 0,
  durationInFrames = 30,
): number =>
  interpolate(frame - delay, [0, durationInFrames], [from, to], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

/**
 * শেক: ক্ষয়িষ্ণু দোলন (ঘণ্টা/বেল ঝাঁকুনি)। ফেরত: ঘূর্ণন (ডিগ্রি)।
 * delay আগে ও শেষের পরে ০।
 */
export const shake = (
  frame: number,
  delay = 0,
  durationInFrames = 24,
  amplitudeDeg = 12,
  cycles = 3,
): number => {
  const t = (frame - delay) / durationInFrames;
  if (t < 0 || t > 1) return 0;
  return amplitudeDeg * Math.sin(t * cycles * 2 * Math.PI) * (1 - t);
};

export type WipeDirection = 'down' | 'up' | 'left' | 'right';

/**
 * ওয়াইপ: `clip-path: inset(...)` স্ট্রিং ফেরত দেয়।
 * 'down' = উপর থেকে নিচে প্রকাশ (পর্দা নামা), 'up' = নিচ থেকে উপরে,
 * 'left' = বাঁ থেকে ডানে প্রকাশ, 'right' = ডান থেকে বাঁয়ে।
 */
export const wipe = (
  frame: number,
  delay = 0,
  durationInFrames = 20,
  direction: WipeDirection = 'down',
): string => {
  const p = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const rest = (1 - p) * 100;
  switch (direction) {
    case 'down':
      return `inset(0 0 ${rest}% 0)`;
    case 'up':
      return `inset(${rest}% 0 0 0)`;
    case 'left':
      return `inset(0 ${rest}% 0 0)`;
    case 'right':
      return `inset(0 0 0 ${rest}%)`;
  }
};

/** এক্সিট: `startFrame` থেকে `durationInFrames`-এ ১ → ০ */
export const fadeOut = (
  frame: number,
  startFrame: number,
  durationInFrames = 8,
): number =>
  interpolate(frame, [startFrame, startFrame + durationInFrames], [1, 0], clamp);
