import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {countUp, countUpSmooth, popIn} from './animations';
import {toBengaliDigits} from './bnDigits';
import {ProgressRing} from './ProgressTracker';
import {Drop, DrawCheck, DrawPath, SText, SvgCard, SvgProps} from './svgKit';
import {colors, fonts} from './theme';
import type {AutoIconKind} from './director';

// ধাপ ৬.২ — অটো-মোডের জেনেরিক ইনফোগ্রাফিক কার্ড (নতুন ভিডিওর জন্য; এই ভিডিও কাস্টম svg১…৯ ব্যবহার করে)
//  • AutoPointCard : "এক/দুই/… নাম্বার" → আইকন + বাক্যের শিরোনাম
//  • AutoCountCard : সংখ্যা → রিং (জানা/বাকি) অথবা "+n" ব্যাজ
// দুটোই svgKit-এর SvgCard-এর ভিতরে (৮০৮×৩৮০ ডিজাইন-বডি, ×০.৭৮ স্কেলে দেখানো) — মানব-চিত্র নেই, শুধু বিমূর্ত আইকন।

const BODY_W = 808;
const BODY_H = 380;

// ───────────── আইকন (ডিজাইন-বডির স্থানাঙ্কে, কেন্দ্র (০,০), ≈ ২০০×২২০) ─────────────
const SHIELD = 'M0 -100 L84 -66 L84 10 C84 62 44 94 0 116 C-44 94 -84 62 -84 10 L-84 -66 Z';
const BOOK =
  'M0 -52 C-40 -74 -84 -74 -104 -62 L-104 62 C-84 50 -40 50 0 74 C40 50 84 50 104 62 L104 -62 C84 -74 40 -74 0 -52 Z';

const PointIcon: React.FC<{kind: AutoIconKind; delay: number}> = ({kind, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = popIn(frame, fps, delay, {damping: 9, stiffness: 200, mass: 0.6});
  return (
    <g transform={`translate(150 190)`}>
      <circle r={118} fill="rgba(245,197,66,0.10)" stroke="rgba(245,197,66,0.35)" strokeWidth={4} transform={`scale(${pop})`} />
      {kind === 'drop' && (
        <g transform={`translate(0 52) scale(${pop})`}>
          <Drop x={0} y={0} s={56} />
        </g>
      )}
      {kind === 'shield' && (
        <g transform="scale(0.78)">
          <DrawPath d={SHIELD} delay={delay} duration={26} stroke={colors.captionPink} width={9} fill={colors.captionPink} fillOpacity={0.2} />
          <DrawCheck cx={0} cy={4} r={36} delay={delay + 20} color={colors.captionGreen} />
        </g>
      )}
      {kind === 'book' && (
        <g transform="scale(0.8)">
          <DrawPath d={BOOK} delay={delay} duration={26} stroke={colors.goldSoft} width={9} fill={colors.goldSoft} fillOpacity={0.2} />
          <DrawPath d="M0 -52 L0 74" delay={delay + 14} duration={14} stroke={colors.goldSoft} width={8} />
        </g>
      )}
      {kind === 'check' && <DrawCheck cx={0} cy={0} r={78} delay={delay} color={colors.captionGreen} />}
    </g>
  );
};

// ───────────── AutoPointCard ─────────────
export const AutoPointCard: React.FC<
  SvgProps & {n: number; headline: string; icon: AutoIconKind}
> = ({n, headline, icon, delay = 0, exitAt, exitDuration}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - (delay + 10), [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <SvgCard
      title={`নাম্বার ${toBengaliDigits(n)}`}
      accent={colors.gold}
      delay={delay}
      exitAt={exitAt}
      exitDuration={exitDuration}
    >
      <div style={{position: 'relative', width: BODY_W, height: BODY_H}}>
        <svg width={BODY_W} height={BODY_H} viewBox={`0 0 ${BODY_W} ${BODY_H}`} style={{position: 'absolute', left: 0, top: 0}}>
          <PointIcon kind={icon} delay={delay + 6} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 0,
            width: 480,
            height: BODY_H,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: fonts.bangla,
              fontWeight: 700,
              fontSize: 46,
              lineHeight: 1.4,
              color: colors.white,
              textShadow: '0 4px 14px rgba(0,0,0,0.6)',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              opacity: t,
              transform: `translateX(${(1 - t) * 40}px)`,
            }}
          >
            {headline}
          </div>
        </div>
      </div>
    </SvgCard>
  );
};

// ───────────── AutoCountCard ─────────────
const CountChip: React.FC<{label: string; value: number; color: string; delay: number; y: number}> = ({
  label,
  value,
  color,
  delay,
  y,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = popIn(frame, fps, delay, {damping: 12, stiffness: 160, mass: 0.7});
  const n = countUp(frame, 0, value, delay + 4, 24);
  return (
    <g transform={`translate(0 ${y}) scale(${s})`} opacity={Math.min(1, s * 3)}>
      <rect x={0} y={0} width={280} height={96} rx={48} fill="rgba(6,38,29,0.7)" stroke={color} strokeWidth={5} />
      <SText x={140} y={66} size={46} color={color}>
        {`${toBengaliDigits(n)} ${label}`}
      </SText>
    </g>
  );
};

export const AutoCountCard: React.FC<SvgProps & {value?: number; total?: number; plus?: number}> = ({
  value,
  total,
  plus,
  delay = 0,
  exitAt,
  exitDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // রিং-সংস্করণ (জানা/বাকি) — svg2-র মতো
  if (total !== undefined && value !== undefined) {
    const v = countUpSmooth(frame, 0, value, delay + 14, 42);
    return (
      <SvgCard title="অগ্রগতি" accent={colors.gold} delay={delay} exitAt={exitAt} exitDuration={exitDuration}>
        <div style={{position: 'relative', width: BODY_W, height: BODY_H}}>
          <div style={{position: 'absolute', left: 70, top: 30}}>
            <ProgressRing value={v} total={total} size={320} stroke={30} fontSize={80} />
          </div>
          <svg width={BODY_W} height={BODY_H} viewBox={`0 0 ${BODY_W} ${BODY_H}`} style={{position: 'absolute', left: 0, top: 0}}>
            <g transform="translate(470 80)">
              <CountChip label="জানা" value={value} color={colors.gold} delay={delay + 34} y={0} />
              <CountChip label="বাকি" value={Math.max(0, total - value)} color={colors.captionCyan} delay={delay + 46} y={130} />
            </g>
          </svg>
        </div>
      </SvgCard>
    );
  }

  // "+n" সংস্করণ — svg3-র মতো ব্যাজ পপ
  const n = plus ?? 0;
  const badge = popIn(frame, fps, delay + 4, {damping: 8, stiffness: 200, mass: 0.6});
  return (
    <SvgCard
      title={`আরও ${toBengaliDigits(n)}টি`}
      accent={colors.captionGreen}
      delay={delay}
      exitAt={exitAt}
      exitDuration={exitDuration}
    >
      <div style={{position: 'relative', width: BODY_W, height: BODY_H, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            width: 270,
            height: 270,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(145deg, ${colors.gold} 0%, ${colors.goldDark} 100%)`,
            border: `12px solid ${colors.goldSoft}`,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            transform: `scale(${badge})`,
            opacity: Math.min(1, badge * 3),
            fontFamily: fonts.bangla,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1.3,
            color: colors.bgDeep,
          }}
        >
          {`+${toBengaliDigits(n)}`}
        </div>
      </div>
    </SvgCard>
  );
};
