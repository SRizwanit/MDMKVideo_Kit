import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn} from './animations';
import {Drop, DrawCheck, DrawPath, SText, SvgCard, SvgProps} from './svgKit';
import {colors} from './theme';

// svg৫ — ফোঁটা বন্ধ + আড়ালে চলাফেরা (সময়: ০০:২০.৬৭–০০:২৮.৬০)
// "২) ফোঁটা বন্ধ হতে আড়ালে কিছুক্ষণ চলাফেরা" → ফোঁটার ব্যবধান ক্রমে বাড়ে, শেষে ✔;
// ডানে দেয়ালের আড়ালে বিমূর্ত পদচিহ্ন-পথ এক-এক করে আসে (কোনো মানব-চিত্র নয়)।

const CLR = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const Svg5: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = delay;

  // ফোঁটা পড়ার শুরু (স্থানীয় ফ্রেম) — ব্যবধান বাড়ছে
  const starts = [12, 40, 82, 140];
  const FALL = 30;
  const drops = starts.map((s, i) => {
    const t = frame - (d + s);
    if (t < 0 || t > FALL + 4) return null;
    const y = interpolate(t, [0, FALL], [40, 235], {extrapolateRight: 'clamp'});
    const op = interpolate(t, [FALL - 4, FALL + 2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const rs = interpolate(t, [FALL - 2, FALL + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g key={i}>
        <Drop x={200} y={y} s={17} opacity={op} />
        <ellipse cx={200} cy={262} rx={10 + rs * 38} ry={(10 + rs * 38) * 0.28} fill="none" stroke="#bff0ff" strokeWidth={4} opacity={rs > 0 ? 1 - rs : 0} />
      </g>
    );
  });
  const lastEnd = d + starts[3] + FALL;
  const check = popIn(frame, fps, lastEnd, {damping: 9, stiffness: 200, mass: 0.6});
  const hint = CLR(frame - d, 4, 14);

  // দেয়াল ইট (৩ কলাম, বিজোড় সারি আধা-ইট সরানো; ক্লিপ-পাথে কাটা)
  const bricks: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = -1; c < 3; c++) {
      const off = r % 2 === 0 ? 0 : 18;
      bricks.push(
        <rect key={`${r}-${c}`} x={430 + c * 36 + off} y={46 + r * 38} width={34} height={32} rx={5}
          fill={r % 2 === 0 ? '#8a6a4b' : '#9b7855'} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />,
      );
    }
  }
  const wallT = CLR(frame - d, 6, 26);

  // পদচিহ্ন: ডান-নিচ থেকে দেয়ালের দিকে
  const steps = Array.from({length: 9}, (_, i) => {
    const k = i / 8;
    const x = 752 + (548 - 752) * k;
    const y = 290 + (126 - 290) * k;
    const ang = (Math.atan2(126 - 290, 548 - 752) * 180) / Math.PI + 90;
    const side = i % 2 === 0 ? -1 : 1;
    const ox = Math.cos(((ang - 90) * Math.PI) / 180 + Math.PI / 2) * 13 * side;
    const oy = Math.sin(((ang - 90) * Math.PI) / 180 + Math.PI / 2) * 13 * side;
    const at = d + 30 + i * 13;
    const p = CLR(frame, at, at + 8);
    const fade = 1 - 0.55 * k;
    return (
      <g key={i} transform={`translate(${x + ox} ${y + oy}) rotate(${ang})`} opacity={p * fade}>
        <ellipse cx={0} cy={0} rx={10} ry={17} fill={colors.goldSoft} transform={`scale(${0.6 + 0.4 * p})`} />
        <ellipse cx={0} cy={-24} rx={6} ry={7} fill={colors.goldSoft} transform={`scale(${0.6 + 0.4 * p})`} />
      </g>
    );
  });

  return (
    <SvgCard title="ফোঁটা বন্ধ হওয়া" accent={colors.captionCyan} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={808} height={380} viewBox="0 0 808 380">
        {/* বাঁয়ে: ফোঁটা কমে আসছে */}
        <rect x={110} y={20} width={180} height={14} rx={7} fill={colors.goldDark} opacity={hint} />
        <ellipse cx={200} cy={266} rx={96} ry={14} fill="rgba(95,208,255,0.16)" opacity={hint} />
        {drops}
        <g transform={`translate(200 150) scale(${check})`} opacity={Math.min(1, check * 3)}>
          <DrawCheck cx={0} cy={0} r={58} delay={lastEnd} />
        </g>
        <SText x={200} y={352} size={42} color="#9fe6ff" opacity={hint}>
          ফোঁটা বন্ধ
        </SText>

        {/* ডানে: দেয়াল + আড়ালে পদচিহ্ন */}
        <g opacity={wallT} transform={`translate(${(1 - wallT) * 30} 0)`}>
          <rect x={430} y={36} width={100} height={310} rx={10} fill="rgba(0,0,0,0.25)" />
          <clipPath id="s5-wall">
            <rect x={430} y={36} width={100} height={310} rx={10} />
          </clipPath>
          <g clipPath="url(#s5-wall)">{bricks}</g>
        </g>
        {steps}
        <SText x={640} y={372} size={42} color={colors.goldSoft} opacity={wallT}>
          আড়ালে চলা
        </SText>
      </svg>
    </SvgCard>
  );
};
