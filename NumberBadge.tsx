import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn} from './animations';
import {toBengaliDigits} from './bnDigits';
import {colors, fonts} from './theme';

// ধাপ ৪ — "১ / ২ / ৩ / ৪" রঙিন নম্বর-ব্যাজ (বাংলা অঙ্ক)

export type NumberBadgeProps = {
  /** সংখ্যা (ইংরেজি/বাংলা যেকোনো — বাংলা অঙ্কে দেখানো হয়) */
  n: number | string;
  delay?: number;
  size?: number;
  /** ব্যাজের মূল রঙ (ডিফল্ট সোনালি) */
  color?: string;
  /** পাশের লেবেল, যেমন "নাম্বার" (ঐচ্ছিক) */
  label?: string;
  style?: React.CSSProperties;
};

export const NumberBadge: React.FC<NumberBadgeProps> = ({
  n,
  delay = 0,
  size = 150,
  color = colors.gold,
  label,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = popIn(frame, fps, delay, {damping: 9, stiffness: 200, mass: 0.6});
  // হালকা ঘূর্ণন-ইন (-২০° → ০°)
  const rot = interpolate(s, [0, 1], [-20, 0]);
  const labelT = interpolate(frame - delay, [8, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 20,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(145deg, ${color} 0%, ${colors.goldDark} 100%)`,
          border: `${Math.round(size * 0.05)}px solid ${colors.goldSoft}`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 0 ${Math.round(size * 0.06)}px rgba(245,197,66,0.25)`,
          transform: `scale(${s}) rotate(${rot}deg)`,
          opacity: Math.min(1, s * 3),
        }}
      >
        <span
          style={{
            fontFamily: fonts.bangla,
            fontWeight: 700,
            fontSize: size * 0.62,
            lineHeight: 1.3,
            color: colors.bgDeep,
          }}
        >
          {toBengaliDigits(n)}
        </span>
      </div>
      {label && (
        <span
          style={{
            fontFamily: fonts.bangla,
            fontWeight: 700,
            fontSize: size * 0.38,
            lineHeight: 1.4,
            color: colors.white,
            opacity: labelT,
            transform: `translateX(${(1 - labelT) * -20}px)`,
            textShadow: '0 4px 14px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
