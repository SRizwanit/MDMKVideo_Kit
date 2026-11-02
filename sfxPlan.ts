// ধাপ ৬.৩ — SFX-পরিকল্পনা (বিশুদ্ধ TypeScript, Remotion-মুক্ত → `npm run test:layers`-এ টেস্টযোগ্য)
//
// ডিরেক্টরের ইভেন্ট-তালিকা (+ আউট্রো CTA-র একটি) → "১ সেকেন্ডে সর্বোচ্চ ১টি" ছাঁটাই (`thinEvents`)
// → `pickSfxSequence` দিয়ে sfxN বাছাই (পরপর একই নয়; ভিডিওভেদে ভিন্ন, একই ভিডিওতে স্থির) → `SfxCue[]`।

import {DirectorEvent, DirectorPlan, SFX_MIN_GAP_FRAMES, thinEvents} from './director';
import {OUTRO_SFX_DELAY} from './introOutroPlan';
import type {IntroOutroPlan} from './introOutroPlan';
import {pickSfxSequence, seedFromText, sfxFile} from './sfxPicker';
import type {Word} from './types';

/** কথা স্পষ্ট রাখতে নিচু ভলিউম (০–১) */
export const SFX_VOLUME = 0.35;
/** প্রতিটি SFX-এর `Sequence` কত ফ্রেম খোলা থাকে (২ সে; দেওয়া ফাইলগুলো ≤ ০.৭ সে; নিজের লম্বা সাউন্ড ২ সে পর্যন্ত চলবে) */
export const SFX_WINDOW_FRAMES = 60;

export type SfxCue = {
  frame: number;
  /** sfx-এর নম্বর (১-ভিত্তিক) */
  n: number;
  file: string;
  kind: DirectorEvent['kind'];
  label: string;
};

/**
 * সিড: Root-এর `calculateMetadata` কাঁচা timestamp.json-এর টেক্সট থেকে হ্যাশ দেয় (`props.seed`)।
 * স্টুডিওর ডিফল্ট props-এ (seed নেই) শব্দ + সময় থেকে হ্যাশ — তবু একই ভিডিওতে স্থির।
 */
export const seedForVideo = (seed: number | undefined, words: Word[]): number =>
  seed !== undefined ? seed >>> 0 : seedFromText(words.map((w) => `${w.text}@${w.startFrame}`).join('|'));

/** ডিরেক্টরের ইভেন্ট + আউট্রো CTA-র ইভেন্ট (ইন্ট্রো টাইটেলের আলাদা ইভেন্ট নেই — সালাম-সিনের ইভেন্ট একই মুহূর্তে) */
export const buildSfxEvents = (plan: DirectorPlan, io: IntroOutroPlan): DirectorEvent[] => {
  const ev = [...plan.events];
  if (io.outro) {
    ev.push({
      frame: io.outro.startFrame + OUTRO_SFX_DELAY,
      kind: 'outro',
      label: 'আউট্রো CTA: MDMK এর সাথে থাকুন',
    });
  }
  return ev;
};

export const planSfx = (
  plan: DirectorPlan,
  io: IntroOutroPlan,
  seed: number,
  totalFrames: number,
  minGap: number = SFX_MIN_GAP_FRAMES,
): SfxCue[] => {
  const events = thinEvents(
    buildSfxEvents(plan, io).filter((e) => e.frame >= 0 && e.frame < totalFrames),
    minGap,
  );
  const seq = pickSfxSequence(events.length, seed);
  return events.map((e, i) => ({
    frame: e.frame,
    n: seq[i],
    file: sfxFile(seq[i]),
    kind: e.kind,
    label: e.label,
  }));
};
