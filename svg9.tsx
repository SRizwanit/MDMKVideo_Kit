import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {popIn, shake} from './animations';
import {SText, SvgProps, SvgStage, ramp} from './svgKit';
import {colors} from './theme';

// svg৯ — MDMK লোগো-ব্যাজ + ফলো/বেল (সময়: ০১:০০.৩৪–০১:০৬.৯১)
// "আরও ছোট ছোট সুন্নাত শিখতে MDMK এর সাথে থাকি" → ব্যাজ পপ + স্পন্দিত রিং, বেল ঝাঁকুনি, "সাথে থাকুন" পিল।
// (লোগো এখনো দেওয়া হয়নি — এখানে টেক্সট-ব্যাজ; নিজের লোগো পরে বদলানো যাবে, README-তে গাইড থাকবে)

export const Svg9: React.FC<SvgProps> = ({delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = delay;

  const badge = popIn(frame, fps, d, {damping: 10, stiffness: 170, mass: 0.7});
  const bell = popIn(frame, fps, d + 22, {damping: 8, stiffness: 220, mass: 0.5});
  const ring = shake(frame, d + 30, 30, 16, 4);
  const ring2 = shake(frame, d + 100, 30, 16, 4); // আবার ঝাঁকুনি
  const pill = ramp(frame, d + 36, 14);
  const pulse = ((frame - d) % 60) / 60;
  const pulseR = interpolate(pulse, [0, 1], [158, 215]);
  const pulseO = interpolate(pulse, [0, 1], [0.55, 0]);

  return (
    <SvgStage exitAt={exitAt} exitDuration={exitDuration}>
      <svg width={760} height={500} viewBox="0 0 760 500">
        <defs>
          <radialGradient id="s9-bg" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#1aa7c4" />
            <stop offset="100%" stopColor="#0e4f5c" />
          </radialGradient>
        </defs>
        {/* স্পন্দিত রিং */}
        <circle cx={380} cy={190} r={pulseR} fill="none" stroke={colors.captionCyan} strokeWidth={6} opacity={frame >= d ? pulseO : 0} />
        {/* ব্যাজ */}
        <g transform={`translate(380 190) scale(${badge})`} opacity={Math.min(1, badge * 3)}>
          <circle r={156} fill="url(#s9-bg)" stroke={colors.goldSoft} strokeWidth={9} />
          <circle r={132} fill="none" stroke={colors.gold} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
          <SText x={0} y={26} size={92} color={colors.white}>
            MDMK
          </SText>
        </g>
        {/* বেল */}
        <g transform={`translate(560 80) scale(${bell}) rotate(${ring + ring2})`} opacity={Math.min(1, bell * 3)} style={{transformOrigin: '0 0'}}>
          <circle r={58} fill={colors.bgDeep} stroke={colors.gold} strokeWidth={6} />
          <g transform="translate(-34 -38) scale(0.76)">
            <path d="M45 10 C30 10 24 24 24 40 L24 54 L14 66 L76 66 L66 54 L66 40 C66 24 60 10 45 10 Z" fill={colors.gold} />
            <circle cx={45} cy={76} r={8} fill={colors.goldDark} />
          </g>
          <circle cx={36} cy={-36} r={14} fill={colors.danger} stroke="#fff" strokeWidth={3} />
        </g>
        {/* পিল */}
        <g opacity={pill} transform={`translate(0 ${(1 - pill) * 30})`}>
          <rect x={190} y={394} width={380} height={80} rx={40} fill={colors.gold} stroke={colors.goldSoft} strokeWidth={5} />
          <SText x={380} y={450} size={48} color={colors.bgDeep}>
            সাথে থাকুন
          </SText>
        </g>
      </svg>
    </SvgStage>
  );
};
