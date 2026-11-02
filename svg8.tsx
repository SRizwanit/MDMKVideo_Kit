import React from 'react';
import {useCurrentFrame} from 'remotion';
import {DrawPath, SvgCard, SvgProps, ramp} from './svgKit';
import {colors} from './theme';

// svg৮ — খোলা বই + আলো-রশ্মি + বাড়ন্ত চারা (সময়: ০০:৫৪.৮২–০০:৫৯.৭২)
// "সুন্নাত শিখি ও সুন্নাত অনুযায়ী জীবন গড়ি" → বই খোলে, আলোর রশ্মি স্ক্যান করে, বই থেকে চারা গজায়।

export const Svg8: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const d = delay;

  const open = ramp(frame, d + 4, 26);
  const openE = 1 - Math.pow(1 - open, 3);
  const raysT = ramp(frame, d + 26, 20);
  const sweep = Math.sin((frame - d) * 0.07) * 9; // রশ্মি স্ক্যান (ডিগ্রি)
  const leafL = ramp(frame, d + 66, 16);
  const leafR = ramp(frame, d + 74, 16);

  const cx = 404;
  const spineY = 300;

  // রশ্মি: বইয়ের মাঝ থেকে উপরে ফ্যান
  const ray = (deg: number, w: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const L = 250;
    const x = cx + L * Math.cos(a);
    const y = 168 + L * Math.sin(a);
    const nx = -Math.sin(a) * w;
    const ny = Math.cos(a) * w;
    return `M${cx} 168 L${x + nx} ${y + ny} L${x - nx} ${y - ny} Z`;
  };

  const lines = [0, 1, 2, 3, 4];

  return (
    <SvgCard title="শিখি ও গড়ি" accent={colors.goldSoft} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={808} height={380} viewBox="0 0 808 380">
        <defs>
          <linearGradient id="s8-ray" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={colors.goldSoft} stopOpacity={0.85} />
            <stop offset="100%" stopColor={colors.goldSoft} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* আলো-রশ্মি (স্ক্যান) */}
        <g opacity={raysT * 0.9} transform={`rotate(${sweep} ${cx} 168)`}>
          <path d={ray(-34, 30)} fill="url(#s8-ray)" />
          <path d={ray(0, 34)} fill="url(#s8-ray)" />
          <path d={ray(34, 30)} fill="url(#s8-ray)" />
        </g>

        {/* বই: বাঁ ও ডান পাতা (স্পাইন থেকে খোলে) */}
        <g transform={`translate(${cx} 0) scale(${openE} 1) translate(${-cx} 0)`}>
          <path d={`M${cx} ${spineY} L${cx} 170 Q 300 136 144 168 L144 ${spineY - 4} Q 300 ${spineY - 32} ${cx} ${spineY} Z`} fill="#fff4d6" stroke={colors.gold} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${cx} ${spineY} L${cx} 170 Q 508 136 664 168 L664 ${spineY - 4} Q 508 ${spineY - 32} ${cx} ${spineY} Z`} fill="#fff4d6" stroke={colors.gold} strokeWidth={7} strokeLinejoin="round" />
          {/* কভারের নিচের ধার */}
          <path d={`M132 ${spineY - 2} Q 300 ${spineY + 34} ${cx} ${spineY + 14} Q 508 ${spineY + 34} 676 ${spineY - 2}`} fill="none" stroke={colors.goldDark} strokeWidth={9} strokeLinecap="round" />
          {/* লাইন (লেখা) */}
          {lines.map((i) => {
            const y = 196 + i * 18;
            return (
              <g key={i} opacity={ramp(frame, d + 20 + i * 3, 8)}>
                <path d={`M176 ${y + 4} Q 290 ${y - 10} 372 ${y + 12}`} stroke={colors.goldDark} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.55} />
                <path d={`M436 ${y + 12} Q 520 ${y - 10} 632 ${y + 4}`} stroke={colors.goldDark} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.55} />
              </g>
            );
          })}
        </g>

        {/* চারা: স্পাইনের উপর থেকে */}
        <DrawPath d={`M${cx} 176 C ${cx - 6} 140 ${cx + 6} 112 ${cx} 82`} delay={d + 52} duration={22} stroke={colors.captionGreen} width={10} />
        <g transform={`translate(${cx} 100) scale(${leafL}) rotate(-8)`} opacity={leafL}>
          <path d="M0 0 C -30 -50 -88 -44 -92 -8 C -60 14 -22 10 0 0 Z" fill={colors.captionGreen} stroke="#1aa860" strokeWidth={4} strokeLinejoin="round" />
          <path d="M-6 -2 C -34 -14 -60 -16 -80 -12" stroke="#0a7a45" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(${cx} 84) scale(${leafR}) rotate(8)`} opacity={leafR}>
          <path d="M0 0 C 30 -52 90 -46 94 -8 C 62 14 22 10 0 0 Z" fill="#7dffb0" stroke="#1aa860" strokeWidth={4} strokeLinejoin="round" />
          <path d="M6 -2 C 34 -14 62 -16 82 -12" stroke="#0a7a45" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>

      </svg>
    </SvgCard>
  );
};
