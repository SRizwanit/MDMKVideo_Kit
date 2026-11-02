import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {countUp, countUpSmooth, slideIn} from './animations';
import {toBengaliDigits} from './bnDigits';
import {Pop} from './Pop';
import {ProgressRing} from './ProgressTracker';
import {SvgCard, SvgProps, ramp} from './svgKit';
import {colors, fonts} from './theme';

// svg২ — প্রগ্রেস রিং ৮/১৬ (সময়: ০০:০৪.৫৪–০০:১০.৫৭)
// "গত দুটি ভিডিওতে ১৬টির মধ্যে ৮টি সুন্নাত জেনেছি" → রিং ড্র-অন (০ → ৮) + সংখ্যা কাউন্ট-আপ।
// ডানে "জানা ৮ / বাকি ৮" দুটি চিপ।

const Chip: React.FC<{label: string; value: number; color: string; delay: number}> = ({
  label,
  value,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = slideIn(frame, fps, delay, 'right', 160);
  const n = countUp(frame, 0, value, delay + 4, 24);
  return (
    <div
      style={{
        transform: `translateX(${s.x}px)`,
        opacity: s.opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '14px 26px',
        borderRadius: 26,
        background: 'rgba(255,255,255,0.08)',
        border: `3px solid ${color}`,
      }}
    >
      <span style={{fontFamily: fonts.bangla, fontWeight: 700, fontSize: 70, lineHeight: 1.3, color}}>
        {toBengaliDigits(n)}
      </span>
      <span style={{fontFamily: fonts.bangla, fontWeight: 600, fontSize: 40, lineHeight: 1.4, color: colors.white}}>
        {label}
      </span>
    </div>
  );
};

export const Svg2: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const v = countUpSmooth(frame, 0, 8, delay + 14, 42);
  const pulse = 1 + 0.03 * Math.sin(ramp(frame, delay + 60, 60) * Math.PI * 4);
  return (
    <SvgCard title="সুন্নাত জানা" accent={colors.gold} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%'}}>
        <Pop delay={delay + 8}>
          <div style={{transform: `scale(${pulse})`}}>
            <ProgressRing value={v} total={16} size={340} stroke={36} fontSize={66} />
          </div>
        </Pop>
        <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
          <Chip label="জানা" value={8} color={colors.gold} delay={delay + 34} />
          <Chip label="বাকি" value={8} color={colors.captionCyan} delay={delay + 46} />
        </div>
      </div>
    </SvgCard>
  );
};
