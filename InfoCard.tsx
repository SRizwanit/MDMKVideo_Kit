import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {fadeOut, popIn} from './animations';
import {colors, fonts} from './theme';

// ধাপ ৪ — ইনফোগ্রাফিক কার্ড/প্যানেল ফ্রেম
// গ্লাস/গ্র্যাডিয়েন্ট প্যানেল + শিরোনাম + আইকন-স্লট; স্প্রিং এন্ট্রি, ঐচ্ছিক এক্সিট।

export type InfoCardProps = {
  /** শিরোনাম (বাংলা) */
  title?: string;
  /** শিরোনামের পাশে আইকন (SVG/JSX) */
  icon?: React.ReactNode;
  /** কার্ডের ভিতরের কনটেন্ট */
  children?: React.ReactNode;
  /** এন্ট্রি শুরুর ফ্রেম (স্থানীয়) */
  delay?: number;
  /** এক্সিট শুরুর ফ্রেম (স্থানীয়); না দিলে এক্সিট নেই */
  exitAt?: number;
  exitDuration?: number;
  width?: number | string;
  minHeight?: number;
  /** বর্ডার/শিরোনামের অ্যাকসেন্ট রঙ */
  accent?: string;
  style?: React.CSSProperties;
  /** ধাপ ৬.১: কমপ্যাক্ট কার্ডের জন্য — ডিফল্ট আগের মানই (padding '28px 36px', শিরোনাম ৫৪px, ফাঁক ১৮, কোণ ৪০) */
  padding?: string;
  titleSize?: number;
  titleGap?: number;
  radius?: number;
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  children,
  delay = 0,
  exitAt,
  exitDuration = 8,
  width = '100%',
  minHeight,
  accent = colors.gold,
  style,
  padding = '28px 36px',
  titleSize = 54,
  titleGap = 18,
  radius = 40,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = popIn(frame, fps, delay, {damping: 14, stiffness: 140, mass: 0.7});
  const out = exitAt === undefined ? 1 : fadeOut(frame, exitAt, exitDuration);
  const exitScale =
    exitAt === undefined
      ? 1
      : interpolate(frame, [exitAt, exitAt + exitDuration], [1, 0.92], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <div
      style={{
        width,
        minHeight,
        boxSizing: 'border-box',
        padding,
        borderRadius: radius,
        background: `linear-gradient(160deg, ${colors.glass} 0%, rgba(14,79,92,0.62) 100%)`,
        border: `3px solid ${accent}`,
        boxShadow: '0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.06)',
        backdropFilter: 'blur(14px)',
        transform: `scale(${enter * exitScale})`,
        transformOrigin: '50% 30%',
        opacity: Math.min(1, enter * 3) * out,
        ...style,
      }}
    >
      {(title || icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: children ? titleGap : 0,
          }}
        >
          {icon && <div style={{flexShrink: 0, display: 'flex'}}>{icon}</div>}
          {title && (
            <div
              style={{
                fontFamily: fonts.bangla,
                fontWeight: 700,
                fontSize: titleSize,
                lineHeight: 1.4,
                color: accent,
              }}
            >
              {title}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
