import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn, slideIn} from './animations';
import {Drop, DrawCheck, DrawPath, SText, SvgCard, SvgProps} from './svgKit';
import {colors} from './theme';

// svg৪ — বাম হাত + পানি/ঢিলা (সময়: ০০:১৫.১০–০০:১৯.৯৭)
// "১) পানি/ঢিলা ব্যবহারে বাম হাত" → বাম হাতের আউটলাইন (বিমূর্ত) ড্র-অন, "বাম" ব্যাজ, ফোঁটা পড়া, ঢিলা-পাথর, ✔।
// কোনো মানব-চিত্র নয় — শুধু হাতের রেখাচিত্র আইকন।

/** গোলাকৃতি আয়তের পাথ */
const rrect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
  `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

export const Svg4: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = delay;

  const badge = popIn(frame, fps, d + 40, {damping: 8, stiffness: 220, mass: 0.5});
  const stone = slideIn(frame, fps, d + 36, 'right', 220);
  const labelA = interpolate(frame - (d + 30), [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ফোঁটা: ৩টি, ৩৬ ফ্রেমের চক্র
  const drops = [0, 12, 24].map((off, i) => {
    const t = (((frame - (d + 28) - off) % 36) + 36) % 36;
    const started = frame - (d + 28) - off >= 0;
    const y = interpolate(t, [0, 28], [50, 235], {extrapolateRight: 'clamp'});
    const op = started ? interpolate(t, [24, 30], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
    return <Drop key={i} x={430} y={y} s={17} opacity={op} />;
  });
  const rip = (((frame - (d + 28)) % 36) + 36) % 36;
  const ripR = interpolate(rip, [24, 36], [8, 44], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ripO = frame < d + 28 ? 0 : interpolate(rip, [24, 36], [0.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const g = colors.gold;
  return (
    <SvgCard title="বাম হাত" accent={colors.gold} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={808} height={380} viewBox="0 0 808 380">
        {/* বাম হাত (পাম ভিতরের দিকে, থাম্ব ডানে) */}
        <g transform="translate(40 66) scale(1.22)">
          <DrawPath d={rrect(36, 130, 108, 100, 34)} delay={d + 2} duration={26} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          <DrawPath d={rrect(36, 88, 24, 60, 12)} delay={d + 8} duration={16} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          <DrawPath d={rrect(64, 60, 24, 88, 12)} delay={d + 12} duration={16} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          <DrawPath d={rrect(92, 42, 24, 106, 12)} delay={d + 16} duration={16} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          <DrawPath d={rrect(120, 58, 24, 90, 12)} delay={d + 20} duration={16} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          <g transform="translate(142 206) rotate(42)">
            <DrawPath d={rrect(-12, -74, 24, 80, 12)} delay={d + 24} duration={16} stroke={g} width={7} fill={g} fillOpacity={0.14} />
          </g>
        </g>
        {/* "বাম" ব্যাজ */}
        <g transform={`translate(70 52) scale(${badge})`} opacity={Math.min(1, badge * 3)}>
          <circle r={44} fill={colors.gold} stroke={colors.goldSoft} strokeWidth={5} />
          <SText x={0} y={16} size={46} color={colors.bgDeep}>
            বাম
          </SText>
        </g>

        {/* পানি: ফোঁটা পড়ছে */}
        <g opacity={labelA}>
          <ellipse cx={430} cy={262} rx={86} ry={14} fill="rgba(95,208,255,0.18)" />
        </g>
        {drops}
        <ellipse cx={430} cy={262} rx={ripR} ry={ripR * 0.28} fill="none" stroke="#bff0ff" strokeWidth={4} opacity={ripO} />
        <SText x={430} y={332} size={44} color="#9fe6ff" opacity={labelA}>
          পানি
        </SText>

        {/* "বা" */}
        <SText x={545} y={180} size={40} color={colors.textDim} opacity={labelA}>
          বা
        </SText>

        {/* ঢিলা (পাথর) */}
        <g transform={`translate(${stone.x} -26)`} opacity={stone.opacity}>
          <path
            d="M600 292 C588 248 618 205 676 200 C734 196 772 232 766 280 C762 318 712 334 664 334 C626 334 604 318 600 292 Z"
            fill="#a99f91"
            stroke={colors.goldSoft}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <path d="M630 236 C650 222 676 222 696 230" stroke="rgba(255,255,255,0.45)" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M690 300 L706 276 L726 292" stroke="rgba(0,0,0,0.28)" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <SText x={684} y={384} size={44} color={colors.goldSoft}>
            ঢিলা
          </SText>
        </g>

        <DrawCheck cx={760} cy={52} r={34} delay={d + 74} />
      </svg>
    </SvgCard>
  );
};
