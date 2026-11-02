import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {slideIn} from './animations';
import {Drop, DrawCheck, DrawCross, SText, SvgCard, SvgProps} from './svgKit';
import {colors} from './theme';

// svg৭ — নরম বনাম শক্ত জায়গা (সময়: ০০:৪২.৩৫–০০:৫৩.১৬)
// "৪) নরম জায়গা খোঁজা, ছিটা যেন কাপড়/শরীরে না লাগে" → দুই-কলাম তুলনা (বাঁয়ে নরম মাটি = ছিটা শোষণ ✔,
// ডানে শক্ত মেঝে = ছিটকে যায় ✗)। ফোঁটা ৫৪ ফ্রেমের চক্রে পড়তে থাকে। কোনো মানব-চিত্র নয়।

const PERIOD = 54;
const IMPACT = 34; // চক্রের কত ফ্রেমে ফোঁটা মাটি ছোঁয়

const Column: React.FC<{
  cx: number;
  soft: boolean;
  startFrame: number;
}> = ({cx, soft, startFrame}) => {
  const frame = useCurrentFrame();
  const t = (((frame - startFrame) % PERIOD) + PERIOD) % PERIOD;
  const on = frame >= startFrame;
  const surfaceY = 238;

  // পড়ন্ত ফোঁটা
  const fallY = interpolate(t, [0, IMPACT], [132, surfaceY - 2], {extrapolateRight: 'clamp'});
  const fallO = on && t < IMPACT ? 1 : 0;

  // নরম: শোষণ — ফোঁটা ছোট হয়ে মাটিতে ঢোকে, ছোট ঢেউ
  const absorbT = interpolate(t, [IMPACT, IMPACT + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // শক্ত: ছিটা — ৪টি ছোট ফোঁটা বাইরে ছিটকে যায়
  const splash = interpolate(t, [IMPACT, IMPACT + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dirs = [
    [-1.0, -1.0],
    [-0.45, -1.5],
    [0.45, -1.5],
    [1.0, -1.0],
  ];

  return (
    <g>
      <Drop x={cx} y={fallY} s={20} opacity={fallO} />
      {soft && on && t >= IMPACT && (
        <>
          <Drop x={cx} y={surfaceY + 4 + absorbT * 18} s={20} scale={1 - absorbT} opacity={1 - absorbT * 0.4} />
          <ellipse cx={cx} cy={surfaceY + 2} rx={10 + absorbT * 52} ry={(10 + absorbT * 52) * 0.22} fill="none" stroke="#bff0ff" strokeWidth={4} opacity={1 - absorbT} />
          <ellipse cx={cx} cy={surfaceY + 16} rx={34 * absorbT} ry={9 * absorbT} fill="rgba(60,30,10,0.55)" />
        </>
      )}
      {!soft && on && t >= IMPACT && (
        <>
          {dirs.map(([dx, dy], i) => (
            <circle
              key={i}
              cx={cx + dx * 62 * splash}
              cy={surfaceY - 6 + dy * 44 * splash + 70 * splash * splash * (0.6 + 0.2 * (i % 2))}
              r={9 - 4 * splash}
              fill="#5fd0ff"
              opacity={1 - splash}
            />
          ))}
          <ellipse cx={cx} cy={surfaceY} rx={14 + splash * 70} ry={(14 + splash * 70) * 0.12} fill="none" stroke="#bff0ff" strokeWidth={4} opacity={1 - splash} />
        </>
      )}
    </g>
  );
};

export const Svg7: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = delay;
  const L = slideIn(frame, fps, d + 4, 'left', 260);
  const R = slideIn(frame, fps, d + 12, 'right', 260);

  // নরম মাটির বিন্দু (শোষণকারী ছিদ্র)
  const dots = Array.from({length: 22}, (_, i) => ({
    x: 52 + ((i * 53) % 296),
    y: 262 + ((i * 37) % 74),
    r: 4 + (i % 3) * 2,
  }));

  return (
    <SvgCard title="জায়গা বাছাই" accent={colors.captionGreen} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={808} height={380} viewBox="0 0 808 380">
        {/* বাঁ কলাম: নরম */}
        <g transform={`translate(${L.x} 0)`} opacity={L.opacity}>
          <SText x={190} y={58} size={50} color={colors.captionGreen}>
            নরম
          </SText>
          <rect x={30} y={238} width={320} height={112} rx={18} fill="#6b4a2f" />
          <rect x={30} y={238} width={320} height={16} rx={8} fill="#8a6440" />
          {dots.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="rgba(255,225,170,0.28)" />
          ))}
        </g>
        <Column cx={190} soft startFrame={d + 20} />
        <DrawCheck cx={322} cy={44} r={28} delay={d + 40} />

        {/* মাঝের বিভাজক */}
        <line x1={404} y1={30} x2={404} y2={350} stroke="rgba(255,255,255,0.25)" strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" />

        {/* ডান কলাম: শক্ত */}
        <g transform={`translate(${R.x} 0)`} opacity={R.opacity}>
          <SText x={618} y={58} size={50} color="#ff9b9b">
            শক্ত
          </SText>
          <rect x={458} y={238} width={320} height={112} rx={18} fill="#7d8794" />
          <rect x={458} y={238} width={320} height={14} rx={7} fill="#a9b3c0" />
          <path d="M560 252 L578 290 L560 320 M690 252 L676 282 L696 318" stroke="rgba(0,0,0,0.3)" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Column cx={618} soft={false} startFrame={d + 28} />
        <DrawCross cx={750} cy={44} r={28} delay={d + 48} />
      </svg>
    </SvgCard>
  );
};
