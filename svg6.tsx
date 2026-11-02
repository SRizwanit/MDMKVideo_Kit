import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn, shake} from './animations';
import {DrawCheck, DrawPath, SText, SvgCard, SvgProps, ramp} from './svgKit';
import {colors} from './theme';

// svg৬ — পর্দা/শিল্ড (সতর আড়াল) (সময়: ০০:২৯.৬১–০০:৪১.৬৮)
// "৩) নির্দিষ্ট জায়গা না থাকলে সতর যেন নজরে না আসে" → পর্দা উপর থেকে নামে (wipe-down) + শিল্ড পপ + ✔;
// ডানে "চোখ-কাটা" আইকন (চোখের উপর লাল স্ল্যাশ)। কোনো মানব-চিত্র নয়।

export const Svg6: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = delay;

  const drop = ramp(frame, d + 6, 34); // পর্দা নামা
  const curtainH = 290 * (1 - Math.pow(1 - drop, 3));
  const shield = popIn(frame, fps, d + 40, {damping: 9, stiffness: 190, mass: 0.6});
  const wob = shake(frame, d + 44, 26, 5, 2);
  const eyeT = ramp(frame, d + 30, 16);
  const blink = 1 - 0.85 * Math.max(0, Math.sin((frame - d) * 0.09)) ** 12;

  // পর্দার ভাঁজ
  const folds = Array.from({length: 7}, (_, i) => 60 + i * 46);

  return (
    <SvgCard title="সতর আড়াল" accent={colors.captionPink} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={808} height={380} viewBox="0 0 808 380">
        <defs>
          <clipPath id="s6-curtain">
            <rect x={40} y={34} width={340} height={curtainH} />
          </clipPath>
          <linearGradient id="s6-cloth" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1b8f7a" />
            <stop offset="50%" stopColor="#25b79c" />
            <stop offset="100%" stopColor="#1b8f7a" />
          </linearGradient>
        </defs>
        {/* রড */}
        <rect x={28} y={20} width={364} height={16} rx={8} fill={colors.goldDark} stroke={colors.goldSoft} strokeWidth={3} />
        <circle cx={28} cy={28} r={12} fill={colors.gold} />
        <circle cx={392} cy={28} r={12} fill={colors.gold} />
        {/* পর্দা */}
        <g clipPath="url(#s6-curtain)">
          <rect x={40} y={34} width={340} height={310} rx={6} fill="url(#s6-cloth)" />
          {folds.map((x, i) => (
            <path key={i} d={`M${x} 34 C ${x + 14} 130 ${x - 14} 230 ${x} 344`} stroke="rgba(0,0,0,0.25)" strokeWidth={6} fill="none" />
          ))}
          <rect x={40} y={322} width={340} height={22} fill="rgba(0,0,0,0.25)" />
        </g>
        {/* শিল্ড */}
        <g transform={`translate(210 198) scale(${shield}) rotate(${wob})`} opacity={Math.min(1, shield * 3)}>
          <path
            d="M0 -88 L74 -60 L74 12 C74 60 38 88 0 106 C-38 88 -74 60 -74 12 L-74 -60 Z"
            fill={colors.bgDeep}
            stroke={colors.gold}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          <path d="M0 -62 L50 -42 L50 10 C50 44 26 64 0 78 Z" fill={colors.gold} opacity={0.22} />
        </g>
        <DrawCheck cx={210} cy={198} r={38} delay={d + 56} color={colors.captionGreen} />

        {/* চোখ-কাটা আইকন */}
        <g opacity={eyeT} transform={`translate(${(1 - eyeT) * 40} 0)`}>
          <path d="M470 190 Q 590 84 710 190 Q 590 296 470 190 Z" fill="rgba(255,255,255,0.1)" stroke={colors.white} strokeWidth={8} strokeLinejoin="round" />
          <g transform={`translate(590 190) scale(1 ${blink})`}>
            <circle r={40} fill={colors.captionCyan} stroke={colors.white} strokeWidth={5} />
            <circle r={17} fill={colors.bgDeep} />
            <circle cx={-12} cy={-12} r={7} fill="#fff" />
          </g>
        </g>
        <DrawPath d="M486 98 L698 282" delay={d + 62} duration={16} stroke={colors.danger} width={14} />
        <SText x={590} y={352} size={44} color="#ffb3b3" opacity={eyeT}>
          নজরে না আসুক
        </SText>
      </svg>
    </SvgCard>
  );
};
