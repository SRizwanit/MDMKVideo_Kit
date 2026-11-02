import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {countUpSmooth, slideIn} from './animations';
import {bnFraction} from './bnDigits';
import {colors, fonts, safeArea, zones} from './theme';

// ধাপ ৪ — প্রগ্রেস ট্র্যাকার ("৮/১৬ → ১২/১৬")
//  • ProgressTracker: স্ক্রিনের উপরের বার (সব সিনে থাকার জন্য), ১৬টি সেগমেন্ট
//  • ProgressRing   : গোল রিং (svg2/svg3-এ ব্যবহৃত হবে); মান প্রপস দিয়ে নিয়ন্ত্রিত

export type ProgressTrackerProps = {
  /** শুরুর মান (যেমন ৮) */
  from: number;
  /** শেষ মান (যেমন ১২); from = to হলে স্থির */
  to: number;
  /** মোট (যেমন ১৬) */
  total: number;
  /** মান বাড়া শুরুর ফ্রেম (স্থানীয়) */
  animateAt?: number;
  animateDuration?: number;
  /** বাঁ পাশের লেবেল */
  label?: string;
  /** এন্ট্রি দেরি (ফ্রেম) */
  delay?: number;
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  from,
  to,
  total,
  animateAt = 0,
  animateDuration = 30,
  label,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = countUpSmooth(frame, from, to, animateAt, animateDuration);
  const slide = slideIn(frame, fps, delay, 'up', 80);

  const segments = Array.from({length: total}, (_, i) => i);

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        right: safeArea.right,
        top: zones.tracker.top,
        height: zones.tracker.height,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 28px',
        boxSizing: 'border-box',
        borderRadius: 999,
        background: colors.glass,
        border: `2px solid ${colors.glassBorder}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        transform: `translateY(${slide.y}px)`,
        opacity: slide.opacity,
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: fonts.bangla,
            fontWeight: 600,
            fontSize: 30,
            lineHeight: 1.4,
            color: colors.goldSoft,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
      <div style={{flex: 1, display: 'flex', gap: 5, alignItems: 'center'}}>
        {segments.map((i) => {
          const fill = Math.max(0, Math.min(1, v - i));
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 22,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.16)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${colors.goldSoft}, ${colors.gold})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <span
        style={{
          fontFamily: fonts.bangla,
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.4,
          color: colors.gold,
          minWidth: 110,
          textAlign: 'right',
        }}
      >
        {bnFraction(v, total)}
      </span>
    </div>
  );
};

// ───────────── রিং ─────────────
export type ProgressRingProps = {
  /** বর্তমান মান — কলার অ্যানিমেট করবে (countUpSmooth ইত্যাদি দিয়ে) */
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  /** মাঝের টেক্সট; না দিলে "৮/১৬" */
  centerText?: string;
  fontSize?: number;
  color?: string;
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  total,
  size = 360,
  stroke = 34,
  centerText,
  fontSize,
  color = colors.gold,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = Math.max(0, Math.min(1, value / total));
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - t)}
          // ১২ টার দিক থেকে শুরু
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.bangla,
          fontWeight: 700,
          fontSize: fontSize ?? size * 0.28,
          lineHeight: 1.4,
          color: colors.white,
          textShadow: '0 4px 14px rgba(0,0,0,0.6)',
        }}
      >
        {centerText ?? bnFraction(value, total)}
      </div>
    </div>
  );
};
