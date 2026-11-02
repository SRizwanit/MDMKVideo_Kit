import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn, shake, slideIn, wipe} from './animations';
import type {Direction, WipeDirection} from './animations';

// ধাপ ৪ — অ্যানিমেশন র‍্যাপার কম্পোনেন্ট (যেকোনো ছেলেকে র‍্যাপ করে অ্যানিমেট করে)

type Common = {
  /** কত ফ্রেম পর শুরু (স্থানীয় ফ্রেম) */
  delay?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** পপ-ইন (স্কেল ০ → ১, সামান্য ওভারশুট) */
export const Pop: React.FC<Common & {origin?: string}> = ({
  delay = 0,
  style,
  children,
  origin = '50% 50%',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = popIn(frame, fps, delay);
  return (
    <div
      style={{
        transform: `scale(${s})`,
        transformOrigin: origin,
        opacity: Math.min(1, s * 3),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** স্লাইড-ইন */
export const Slide: React.FC<
  Common & {from?: Direction; distance?: number}
> = ({delay = 0, from = 'left', distance = 300, style, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {x, y, opacity} = slideIn(frame, fps, delay, from, distance);
  return (
    <div
      style={{
        transform: `translate(${x}px, ${y}px)`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** ওয়াইপ-রিভিল (পর্দা নামা/ওঠা) */
export const Wipe: React.FC<
  Common & {direction?: WipeDirection; duration?: number}
> = ({delay = 0, direction = 'down', duration = 20, style, children}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{clipPath: wipe(frame, delay, duration, direction), ...style}}>
      {children}
    </div>
  );
};

/** শেক (ঘণ্টা-ঝাঁকুনি) — ঘূর্ণন ডিগ্রিতে */
export const Shake: React.FC<
  Common & {duration?: number; amplitude?: number; cycles?: number; origin?: string}
> = ({
  delay = 0,
  duration = 24,
  amplitude = 12,
  cycles = 3,
  origin = '50% 0%',
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const deg = shake(frame, delay, duration, amplitude, cycles);
  return (
    <div
      style={{
        transform: `rotate(${deg}deg)`,
        transformOrigin: origin,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
