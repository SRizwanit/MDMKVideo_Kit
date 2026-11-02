import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, stageColors, stageFrame, zones} from './theme';
import type {ZoomSegment} from './director';

// ধাপ ৬.২ — ইফেক্টস
//  • zoomAt/StageVideo : ভিডিও-লেয়ারে ধীর পাঞ্চ-জুম (বেসলাইন ১.০৪ → পয়েন্টে ১.০৮)
//  • StageVideo / StageBackground / StageProgressBar : স্টেজ-লেআউট (ধাপ ৬.৪) — ইনফোগ্রাফিক চলাকালীন ভিডিও নিচে গোল-কোণা ফ্রেমে ছোট হয়,
//    পেছনে গাঢ় নীল-টিল ব্যাকগ্রাউন্ড; সময়-পরিকল্পনা `stagePlan.ts`-এ। (আগের BackgroundGlow বাদ — স্টেজ-ব্যাকগ্রাউন্ডই কার্ড পড়ার সুবিধা দেয়)
//  • SceneFlash     : সিনের শুরুতে সোনালি ফ্ল্যাশ + আলোর স্লাইড-সোয়াইপ (শুধু কার্ড-জোনে; বক্তার মুখে নয়)

// ───────────── টিউনিং ─────────────
/** বেসলাইন জুম: সোর্স ভিডিওর উপরের (≈২০px) ও বাঁয়ের পাতলা কালো ধার ঢাকে (ধাপ ৫-এ ফ্রেমে দেখা) */
export const BASE_ZOOM = 1.04;
/** পাঞ্চ-জুমের চূড়া */
export const PEAK_ZOOM = 1.08;
/** জুমের কেন্দ্র — মাথার উপরের দিকে (y ≈ ৬০০), নইলে জুমে চুল ওপরে উঠে কার্ডের নিচে ঢুকে যায় */
export const ZOOM_ORIGIN_X = 540;
export const ZOOM_ORIGIN_Y = 600;
/** পয়েন্ট শেষে জুম নামার ফ্রেম */
export const ZOOM_RELEASE_FRAMES = 14;
/** সিন-ফ্ল্যাশের দৈর্ঘ্য */
export const FLASH_FRAMES = 16;

/**
 * নির্দিষ্ট ফ্রেমে জুম-মান (বিশুদ্ধ ফাংশন — টেস্টযোগ্য)।
 * সেগমেন্টের ভিতরে ধীরে (ease-out) BASE → PEAK; শেষে RELEASE ফ্রেমে নামে। একাধিক সেগমেন্ট হলে সর্বোচ্চটা।
 */
export const zoomAt = (frame: number, segments: ZoomSegment[]): number => {
  let env = 0;
  for (const s of segments) {
    const len = Math.max(1, s.endFrame - s.startFrame);
    let e = 0;
    if (frame >= s.startFrame && frame < s.endFrame) {
      e = interpolate(frame, [s.startFrame, s.startFrame + len], [0, 1], {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    } else if (frame >= s.endFrame && frame < s.endFrame + ZOOM_RELEASE_FRAMES) {
      e = interpolate(frame, [s.endFrame, s.endFrame + ZOOM_RELEASE_FRAMES], [1, 0], {
        easing: Easing.inOut(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    if (e > env) env = e;
  }
  return BASE_ZOOM + (PEAK_ZOOM - BASE_ZOOM) * env;
};

/** স্টেজ-ফ্রেমে ভিডিওর ভিতরের জুম (সোর্সের পাতলা কালো ধার ঢাকে; মুখ ফ্রেমের মাঝামাঝি) */
export const FRAME_ZOOM = 1.06;
/** নিচের ভিডিও-অগ্রগতি বার দেখাবে কিনা (রেফারেন্স-ছবিতে আছে; বন্ধ করতে false) */
export const SHOW_STAGE_PROGRESS_BAR = true;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * ভিডিও-লেয়ার: p = ০ হলে পুরো-স্ক্রিন (আগের মতো পাঞ্চ-জুমসহ), p = ১ হলে `stageFrame`-এর গোল-কোণা ছোট ফ্রেম।
 * ৯:১৬ অনুপাত দুই অবস্থায় একই — ট্রানজিশনে ছবি বিকৃত হয় না। ইনফোগ্রাফিক/ক্যাপশন এর বাইরে — শুধু ফুটেজ নড়ে।
 */
export const StageVideo: React.FC<{
  segments: ZoomSegment[];
  stage: number;
  children: React.ReactNode;
}> = ({segments, stage: p, children}) => {
  const frame = useCurrentFrame();
  const punch = zoomAt(frame, segments);
  const z = lerp(punch, FRAME_ZOOM, p);
  const rect: React.CSSProperties = {
    position: 'absolute',
    left: lerp(0, stageFrame.left, p),
    top: lerp(0, stageFrame.top, p),
    width: lerp(1080, stageFrame.width, p),
    height: lerp(1920, stageFrame.height, p),
    borderRadius: lerp(0, stageFrame.radius, p),
  };
  return (
    <>
      <div style={{...rect, overflow: 'hidden', background: '#000'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${z})`,
            // পুরো-স্ক্রিনে কেন্দ্র y ≈ ৬০০ (৩১%), ফ্রেমে ≈ ৪০% — চুল উপরে কাটে না
            transformOrigin: `50% ${lerp((ZOOM_ORIGIN_Y / 1920) * 100, 40, p)}%`,
          }}
        >
          {children}
        </div>
      </div>
      {/* ফ্রেমের সাদা ধার + গ্লো/ছায়া (আলাদা লেয়ারে, যাতে পুরো-স্ক্রিনে ভিডিওর কিনারা না কাটে) */}
      <div
        style={{
          ...rect,
          boxSizing: 'border-box',
          border: `4px solid ${stageColors.frameBorder}`,
          boxShadow: `0 0 48px ${stageColors.glow}, 0 20px 44px rgba(0,0,0,0.5)`,
          opacity: p,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

// স্টেজের তারা (স্থির অবস্থান — রেন্ডার-নির্ভর নয়; ধীরে ঝিকমিক)
const STARS = Array.from({length: 26}, (_, i) => {
  const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  const r2 = Math.abs(Math.sin(i * 78.233 + 1.7) * 24634.6345) % 1;
  const r3 = Math.abs(Math.sin(i * 39.346 + 4.1) * 9371.1337) % 1;
  return {x: 30 + r1 * 1020, y: 130 + r2 * 1650, r: 2 + r3 * 3.2, phase: r3 * 6.28};
});

/** স্টেজ-ব্যাকগ্রাউন্ড: গাঢ় নীল-টিল গ্র্যাডিয়েন্ট + ফ্রেমের পেছনে নীলচে গ্লো + ঝিকমিক তারা (opacity = p) */
export const StageBackground: React.FC<{stage: number}> = ({stage: p}) => {
  const frame = useCurrentFrame();
  if (p <= 0.001) return null;
  return (
    <AbsoluteFill style={{opacity: p, pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${stageColors.top} 0%, ${stageColors.mid} 52%, ${stageColors.bottom} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(ellipse 560px 520px at 540px ${stageFrame.top + stageFrame.height / 2}px, ${stageColors.glow} 0%, rgba(77,227,255,0) 100%),` +
            `radial-gradient(ellipse 720px 300px at 500px 520px, rgba(245,197,66,0.08) 0%, rgba(245,197,66,0) 100%)`,
        }}
      />
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: '50%',
            background: i % 3 === 0 ? colors.goldSoft : '#ffffff',
            opacity: 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(frame * 0.05 + s.phase)),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** নিচের পাতলা রঙিন ভিডিও-অগ্রগতি বার (সোনালি → গোলাপি → নীল) + সাদা নব; স্টেজ-মোডে দেখা যায় */
export const StageProgressBar: React.FC<{stage: number}> = ({stage: p}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  if (!SHOW_STAGE_PROGRESS_BAR || p <= 0.001) return null;
  const W = 960;
  const pct = Math.max(0, Math.min(1, frame / Math.max(1, durationInFrames - 1)));
  return (
    <AbsoluteFill style={{opacity: p, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 60, top: 1596, width: W, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.16)'}}>
        <div
          style={{
            width: W * pct,
            height: 8,
            borderRadius: 4,
            backgroundImage: 'linear-gradient(90deg, #ffd54d, #ff6fb5, #4de3ff)',
            backgroundSize: `${W}px 100%`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: W * pct - 11,
            top: -7,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 10px rgba(255,255,255,0.7)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** সিনের শুরুতে: কার্ড-জোনে সোনালি ফ্ল্যাশ + তির্যক আলোর ব্যান্ড বাঁ থেকে ডানে সোয়াইপ */
export const SceneFlash: React.FC<{starts: number[]}> = ({starts}) => {
  const frame = useCurrentFrame();
  // চলমান ফ্ল্যাশ: সবচেয়ে সাম্প্রতিক শুরু যা এখনো FLASH_FRAMES-এর ভিতরে
  let start = -1;
  for (const s of starts) if (frame >= s && frame < s + FLASH_FRAMES && s > start) start = s;
  if (start < 0) return null;
  const p = (frame - start) / FLASH_FRAMES; // ০ → ১
  const flash = interpolate(p, [0, 0.25, 1], [0, 0.26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bandX = interpolate(p, [0, 1], [-420, 1180], {easing: Easing.out(Easing.cubic)});
  const top = zones.tracker.top; // ১৫০
  const height = zones.card.top + zones.card.height - top; // ≈ ৪৮৫ (ট্র্যাকার + কার্ড)
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top,
          height,
          background: `radial-gradient(ellipse at 50% 55%, ${colors.goldSoft} 0%, rgba(255,224,138,0) 70%)`,
          opacity: flash,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top, height, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            left: bandX,
            top: -40,
            width: 300,
            height: height + 80,
            transform: 'skewX(-18deg)',
            background: 'linear-gradient(90deg, rgba(255,224,138,0) 0%, rgba(255,240,190,0.42) 50%, rgba(255,224,138,0) 100%)',
            opacity: interpolate(p, [0, 0.15, 0.85, 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
