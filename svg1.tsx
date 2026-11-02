import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn} from './animations';
import {DrawPath, SText, SvgProps, SvgStage, star8Paths} from './svgKit';
import {colors} from './theme';

// svg১ — সালাম ব্যাজ (সময়: ০০:০০.২৬–০০:০৪.৩০ ও সমাপনী ০১:০৮.০৫–০১:১২.০৪)
// ইসলামিক জ্যামিতিক ফ্রেম (আট-কোণা তারা) + অর্ধচন্দ্র-তারা + "সালাম" ফিতা।
// অ্যানিমেশন: স্কেল-পপ + ঘূর্ণিত প্যাটার্ন। `ending` = সমাপনী সংস্করণ (উল্টো ঘূর্ণন, নরম সোনালি, দ্রুত ফেড)।

export type Svg1Props = SvgProps & {ending?: boolean};

export const Svg1: React.FC<Svg1Props> = ({delay = 0, exitAt, exitDuration, ending = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = Math.max(0, frame - delay);

  const pop = popIn(frame, fps, delay, {damping: 11, stiffness: 150, mass: 0.7});
  const dir = ending ? -1 : 1;
  const rotOuter = dir * t * 0.35;
  const rotInner = -dir * t * 0.5;
  const accent = ending ? colors.goldSoft : colors.gold;

  const [a1, a2] = star8Paths(210);
  const [b1, b2] = star8Paths(150);
  const ribbonT = interpolate(t, [24, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const moonT = interpolate(t, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ৮টি ছোট বিন্দু বাইরের বৃত্তে (ঝিকিমিকি)
  const dots = Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const tw = 0.5 + 0.5 * Math.sin(t * 0.18 + i);
    return (
      <circle
        key={i}
        cx={250 + 232 * Math.cos(a)}
        cy={250 + 232 * Math.sin(a)}
        r={i % 2 === 0 ? 7 : 4.5}
        fill={accent}
        opacity={0.35 + 0.65 * tw}
      />
    );
  });

  return (
    <SvgStage exitAt={exitAt} exitDuration={ending ? 14 : exitDuration}>
      <svg width={500} height={500} viewBox="0 0 500 500" style={{transform: `scale(${pop})`, opacity: Math.min(1, pop * 3)}}>
        <defs>
          <radialGradient id="s1-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0e4f5c" />
            <stop offset="100%" stopColor="#06261d" />
          </radialGradient>
        </defs>
        <circle cx={250} cy={250} r={244} fill="url(#s1-bg)" stroke={accent} strokeWidth={6} />
        {dots}
        {/* বাইরের তারা — ধীরে ঘোরে */}
        <g transform={`translate(250 250) rotate(${rotOuter})`}>
          <DrawPath d={a1} delay={delay + 2} duration={26} stroke={accent} width={6} fill={accent} fillOpacity={0.12} />
          <DrawPath d={a2} delay={delay + 6} duration={26} stroke={accent} width={6} fill={accent} fillOpacity={0.12} />
        </g>
        {/* ভিতরের তারা — উল্টো ঘোরে */}
        <g transform={`translate(250 250) rotate(${rotInner})`}>
          <DrawPath d={b1} delay={delay + 10} duration={22} stroke={colors.captionCyan} width={5} />
          <DrawPath d={b2} delay={delay + 14} duration={22} stroke={colors.captionCyan} width={5} />
        </g>
        {/* অর্ধচন্দ্র + তারা (স্থির, নরম পপ) */}
        <g transform={`translate(250 232) scale(${moonT})`} opacity={moonT}>
          <path
            d="M 40 -78 A 82 82 0 1 0 40 78 A 64 64 0 1 1 40 -78 Z"
            fill={accent}
            stroke={colors.goldSoft}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path
            d="M 58 -22 L 69 4 L 97 6 L 75 24 L 83 51 L 58 36 L 33 51 L 41 24 L 19 6 L 47 4 Z"
            fill={colors.goldSoft}
            transform="translate(10 -6) scale(0.8)"
          />
        </g>
        {/* ফিতা */}
        <g opacity={ribbonT} transform={`translate(0 ${(1 - ribbonT) * 24})`}>
          <rect x={130} y={372} width={240} height={70} rx={35} fill={colors.bgDeep} stroke={accent} strokeWidth={5} />
          <SText x={250} y={423} size={50} color={accent}>
            সালাম
          </SText>
        </g>
      </svg>
    </SvgStage>
  );
};
