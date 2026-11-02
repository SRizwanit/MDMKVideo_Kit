import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {countUpSmooth, popIn, shake} from './animations';
import {bnPlus, toBengaliDigits} from './bnDigits';
import {ProgressRing} from './ProgressTracker';
import {SvgCard, SvgProps} from './svgKit';
import {colors, fonts} from './theme';

// svg৩ — "+৪" ব্যাজ, রিং ৮ → ১২ (সময়: ০০:১০.৫৭–০০:১৩.০৫)
// "আজ পরবর্তী ৪টি জানবো" → ব্যাজ পপ + রিং এক্সটেন্ড (৮→১২) + ৯/১০/১১/১২ চারটি পিপ একে একে জ্বলে।

const Pip: React.FC<{n: number; delay: number}> = ({n, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = popIn(frame, fps, delay, {damping: 9, stiffness: 220, mass: 0.5});
  return (
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(145deg, ${colors.captionGreen}, #1aa860)`,
        border: `5px solid ${colors.white}`,
        transform: `scale(${s})`,
        opacity: Math.min(1, s * 3),
        fontFamily: fonts.bangla,
        fontWeight: 700,
        fontSize: 40,
        lineHeight: 1.4,
        color: colors.bgDeep,
      }}
    >
      {toBengaliDigits(n)}
    </div>
  );
};

export const Svg3: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const v = countUpSmooth(frame, 8, 12, delay + 22, 40);
  const badge = popIn(frame, fps, delay + 4, {damping: 8, stiffness: 200, mass: 0.6});
  const rot = shake(frame, delay + 14, 24, 8, 2);
  const glow = interpolate(Math.sin((frame - delay) * 0.2), [-1, 1], [0.3, 0.7]);

  return (
    <SvgCard title="আজ আরও চারটি" accent={colors.captionGreen} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%'}}>
        <ProgressRing value={v} total={16} size={330} stroke={34} fontSize={64} color={colors.captionGreen} />
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
          <div
            style={{
              padding: '6px 44px',
              borderRadius: 999,
              background: `linear-gradient(145deg, ${colors.gold}, ${colors.goldDark})`,
              border: `6px solid ${colors.goldSoft}`,
              boxShadow: `0 0 ${40 * glow}px ${colors.gold}, 0 10px 30px rgba(0,0,0,0.5)`,
              transform: `scale(${badge}) rotate(${rot}deg)`,
              opacity: Math.min(1, badge * 3),
              fontFamily: fonts.bangla,
              fontWeight: 700,
              fontSize: 120,
              lineHeight: 1.3,
              color: colors.bgDeep,
            }}
          >
            {bnPlus(4)}
          </div>
          <div style={{display: 'flex', gap: 18}}>
            {[9, 10, 11, 12].map((n, i) => (
              <Pip key={n} n={n} delay={delay + 26 + i * 10} />
            ))}
          </div>
        </div>
      </div>
    </SvgCard>
  );
};
