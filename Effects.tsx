import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {colors, faceRef, zones} from './theme';
import type {ZoomSegment} from './director';

// ধাপ ৬.২ — ইফেক্টস
//  • PunchZoom      : ভিডিও-লেয়ারে ধীর পাঞ্চ-জুম (বেসলাইন ১.০৪ → পয়েন্টে ১.০৮)
//  • BackgroundGlow : উপরে হালকা গ্র্যাডিয়েন্ট + সোনালি গ্লো (কার্ড পড়তে সুবিধা)
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

/** ভিডিও-লেয়ার র‍্যাপ করে জুম দেয় (ইনফোগ্রাফিক/ক্যাপশন এর বাইরে — শুধু ফুটেজ নড়ে) */
export const PunchZoom: React.FC<{segments: ZoomSegment[]; children: React.ReactNode}> = ({
  segments,
  children,
}) => {
  const frame = useCurrentFrame();
  const z = zoomAt(frame, segments);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${z})`,
        transformOrigin: `${ZOOM_ORIGIN_X}px ${ZOOM_ORIGIN_Y}px`,
        overflow: 'hidden',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * উপরে হালকা গাঢ় সবুজ গ্র্যাডিয়েন্ট (কার্ড/ট্র্যাকার পরিষ্কার পড়তে) + ধীরে স্পন্দিত সোনালি গ্লো।
 * গ্র্যাডিয়েন্ট কার্ডের নিচের সীমায় (y ≈ ৬৩৫) পুরো মিলিয়ে যায় — চুলের রেখার (≈ ৫৭০) কাছে প্রায় স্বচ্ছ, মুখ অক্ষত।
 */
export const BackgroundGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.045);
  const fadeEnd = zones.card.top + zones.card.height; // ৬৩৫
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: fadeEnd,
          background: `linear-gradient(180deg, rgba(6,38,29,0.62) 0%, rgba(6,38,29,0.34) 55%, rgba(6,38,29,0) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: faceRef.hairTop,
          background: `radial-gradient(ellipse 620px 300px at 50% 330px, rgba(245,197,66,${(0.1 + 0.06 * pulse).toFixed(3)}) 0%, rgba(245,197,66,0) 100%)`,
        }}
      />
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
