import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {drawOn, fadeOut} from './animations';
import {InfoCard} from './InfoCard';
import {colors, fonts, safeArea, zones} from './theme';

// ধাপ ৫ — svg১…svg৯-এর শেয়ার্ড কিট (সব ফাইল ফ্ল্যাট, রুটে)
// • SvgCard  : InfoCard-ভিত্তিক সিন (শিরোনাম + ৮০৮×৩৮০ "ডিজাইন-বডি", ধাপ ৬.১ থেকে ×০.৭৮ স্কেলে দেখানো)
// • SvgStage : কার্ডহীন মুক্ত সিন (svg1, svg9)
// • DrawPath : `pathLength=1` কৌশলে ড্র-অন — পাথের দৈর্ঘ্য হিসাব করতে হয় না
// সব অ্যানিমেশন ফ্রেম-ভিত্তিক (স্থানীয় ফ্রেম; Sequence-এর ভিতরে ০ থেকে শুরু)।
// কোনো মানব-চিত্র নেই — শুধু বিমূর্ত আইকন।

export type SvgProps = {
  /** সিনের ভিতরে কত ফ্রেম পর অ্যানিমেশন শুরু */
  delay?: number;
  /** এক্সিট (ফেড-আউট) শুরুর স্থানীয় ফ্রেম; না দিলে এক্সিট নেই — ধাপ ৬.২-এর ডিরেক্টর দেবে */
  exitAt?: number;
  exitDuration?: number;
};

// ── ধাপ ৬.১: কার্ড ছোট করা (নিচের সীমা y ≈ ৬৩৫; আগে ৭৯০) ──
// svg১…৯ আঁকা আছে ৮০৮×৩৮০ "ডিজাইন-বডি"-র স্থানাঙ্কে (ফাইলগুলো অপরিবর্তিত)। কার্ড ছোট হওয়ায়
// পুরো বডি CSS `scale(BODY_SCALE)` দিয়ে ছোট করে দেখানো হয় — কাঠামো/অ্যানিমেশন/অনুপাত অক্ষত।
export const BODY_W = 808; // ডিজাইন-বডির মাপ (SVG-র viewBox)
export const BODY_H = 380;
export const BODY_SCALE = 1; // স্টেজ-লেআউটে (ধাপ ৬.৪) আবার পূর্ণ আকার — আগে ০.৭৮ (লেখা চেপে যেত)
export const BODY_SHOWN_W = Math.round(BODY_W * BODY_SCALE); // ৬৩০
export const BODY_SHOWN_H = Math.round(BODY_H * BODY_SCALE); // ২৯৬
const CARD_PAD_X = 26;
const CARD_PAD_Y = 28;
const TITLE_SIZE = 54;
const TITLE_GAP = 18;
export const CARD_W = BODY_SHOWN_W + CARD_PAD_X * 2; // ৮৬০
// শিরোনাম-সারি ≈ ৩৮×১.৪ = ৫৩.২; মোট ≈ ১৬+৫৩+৪+২৯৬+১৬ ≈ ৩৮৫ → নিচে y ≈ ৬৩৫
export const CARD_H = zones.card.height - 1; // ৩৮৪ (minHeight; আসল উচ্চতা কনটেন্ট থেকে ≈ ৩৮৫)
/** কার্ড নিরাপদ-এলাকার (বাম ৬০ – ডান ১৪০) মাঝে বসে */
export const CARD_LEFT = 1080 - safeArea.right - CARD_W; // ৮০ (ডানের ১৪০ নিরাপদ-এলাকা মেনে)
/** কার্ডহীন সিন (svg১, svg৯)-এর স্কেল: ৫০০px উঁচু ব্যাজ → ৩৭০ (জোনের ৩৮৫-র ভিতরে) */
export const STAGE_SCALE = 1;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** ইনফোগ্রাফিক জোনে (card zone) বসানো পজিশনড কন্টেইনার — কার্ড (কেন্দ্রে, ৬৯০ চওড়া) */
const place: React.CSSProperties = {
  position: 'absolute',
  left: CARD_LEFT,
  top: zones.card.top,
  width: CARD_W,
  height: CARD_H,
};

/** কার্ডহীন মুক্ত সিনের বক্স — পুরো নিরাপদ-চওড়া (৮৮০), একই উচ্চতা */
const placeStage: React.CSSProperties = {
  position: 'absolute',
  left: CARD_LEFT,
  top: zones.card.top,
  width: CARD_W,
  height: CARD_H,
};

/** কার্ড-সহ সিন: শিরোনাম + আইকন + বডি */
export const SvgCard: React.FC<
  SvgProps & {
    title: string;
    icon?: React.ReactNode;
    accent?: string;
    children: React.ReactNode;
  }
> = ({title, icon, accent, delay = 0, exitAt, exitDuration = 8, children}) => (
  <div style={place}>
    <InfoCard
      title={title}
      icon={icon}
      accent={accent}
      delay={delay}
      exitAt={exitAt}
      exitDuration={exitDuration}
      width={CARD_W}
      minHeight={CARD_H}
      padding={`${CARD_PAD_Y}px ${CARD_PAD_X}px`}
      titleSize={TITLE_SIZE}
      titleGap={TITLE_GAP}
      radius={40}
    >
      {/* দেখানোর বক্স ৮০৮×৩৮০; ভিতরে ৮০৮×৩৮০ ডিজাইন-বডি ×১ */}
      <div style={{width: BODY_SHOWN_W, height: BODY_SHOWN_H, position: 'relative'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: BODY_W,
            height: BODY_H,
            transform: `scale(${BODY_SCALE})`,
            transformOrigin: '0 0',
          }}
        >
          {children}
        </div>
      </div>
    </InfoCard>
  </div>
);

/** কার্ডহীন মুক্ত সিন (এক্সিটে ফেড) */
export const SvgStage: React.FC<{
  exitAt?: number;
  exitDuration?: number;
  children: React.ReactNode;
}> = ({exitAt, exitDuration = 8, children}) => {
  const frame = useCurrentFrame();
  const out = exitAt === undefined ? 1 : fadeOut(frame, exitAt, exitDuration);
  return (
    <div
      style={{
        ...placeStage,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: out,
        transform: `scale(${interpolate(out, [0, 1], [0.94, 1])})`,
      }}
    >
      {/* ধাপ ৬.১: ব্যাজ জোনে ঢোকাতে স্কেল-ডাউন (বক্স কেন্দ্রে, ওভারফ্লো সমান দুই দিকে) */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${STAGE_SCALE})`,
          transformOrigin: '50% 50%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** ড্র-অন পাথ: `d` যেকোনো পাথ; `fill` থাকলে আঁকা শেষের পর ধীরে ভরাট হয় */
export const DrawPath: React.FC<{
  d: string;
  delay: number;
  duration?: number;
  stroke: string;
  width?: number;
  fill?: string;
  fillOpacity?: number;
  transform?: string;
}> = ({d, delay, duration = 24, stroke, width = 8, fill, fillOpacity = 0.25, transform}) => {
  const frame = useCurrentFrame();
  const dr = drawOn(frame, delay, 1, duration);
  const f = interpolate(frame - delay, [duration * 0.7, duration * 1.3], [0, fillOpacity], clamp);
  return (
    <path
      d={d}
      pathLength={1}
      fill={fill ?? 'none'}
      fillOpacity={fill ? f : undefined}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={dr.strokeDashoffset}
      opacity={dr.progress > 0 ? 1 : 0}
      transform={transform}
    />
  );
};

/** ড্র-অন চেক-মার্ক (বৃত্ত + টিক), কেন্দ্র (cx, cy) */
export const DrawCheck: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  delay: number;
  color?: string;
}> = ({cx, cy, r = 36, delay, color = colors.success}) => {
  const k = r / 38;
  return (
    <g transform={`translate(${cx - 48 * k} ${cy - 48 * k}) scale(${k})`}>
      <DrawPath
        d="M48 10 a38 38 0 1 1 -0.01 0"
        delay={delay}
        duration={20}
        stroke={color}
        width={8}
      />
      <DrawPath d="M28 50 L43 65 L69 34" delay={delay + 14} duration={12} stroke={color} width={9} />
    </g>
  );
};

/** ড্র-অন ক্রস (✗), কেন্দ্র (cx, cy) */
export const DrawCross: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  delay: number;
  color?: string;
}> = ({cx, cy, r = 36, delay, color = colors.danger}) => {
  const k = r / 38;
  return (
    <g transform={`translate(${cx - 48 * k} ${cy - 48 * k}) scale(${k})`}>
      <DrawPath
        d="M48 10 a38 38 0 1 1 -0.01 0"
        delay={delay}
        duration={20}
        stroke={color}
        width={8}
      />
      <DrawPath d="M33 33 L63 63" delay={delay + 14} duration={10} stroke={color} width={9} />
      <DrawPath d="M63 33 L33 63" delay={delay + 20} duration={10} stroke={color} width={9} />
    </g>
  );
};

/** পানির ফোঁটা পাথ (টিপ উপরে), কেন্দ্র-নিচ (0,0), উচ্চতা ≈ ২ × s */
export const dropPath = (s: number): string =>
  `M0 ${-2 * s} C ${0.15 * s} ${-1.2 * s} ${s} ${-0.6 * s} ${s} ${0.1 * s} ` +
  `A ${s} ${s} 0 0 1 ${-s} ${0.1 * s} C ${-s} ${-0.6 * s} ${-0.15 * s} ${-1.2 * s} 0 ${-2 * s} Z`;

/** ফোঁটা (ভরাট, গ্র্যাডিয়েন্ট ছাড়া নরম নীল) */
export const Drop: React.FC<{
  x: number;
  y: number;
  s?: number;
  opacity?: number;
  scale?: number;
}> = ({x, y, s = 18, opacity = 1, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path d={dropPath(s)} fill="#5fd0ff" stroke="#bff0ff" strokeWidth={3} strokeLinejoin="round" />
    <ellipse cx={-s * 0.35} cy={-s * 0.2} rx={s * 0.16} ry={s * 0.3} fill="#ffffff" opacity={0.7} />
  </g>
);

/** SVG টেক্সট (বাংলা ফন্টে) */
export const SText: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({x, y, size = 40, color = colors.white, anchor = 'middle', weight = 700, opacity = 1, children}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontFamily={fonts.bangla}
    fontWeight={weight}
    fontSize={size}
    fill={color}
    opacity={opacity}
    style={{paintOrder: 'stroke fill'}}
    stroke="rgba(0,0,0,0.35)"
    strokeWidth={size * 0.06}
  >
    {children}
  </text>
);

/** আট-কোণা ইসলামিক তারা (রুব-আল-হিজব): দুটি ঘোরানো বর্গ */
export const star8Paths = (r: number): [string, string] => {
  const sq = (rot: number) => {
    const pts = [0, 1, 2, 3].map((i) => {
      const a = ((rot + i * 90) * Math.PI) / 180;
      return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
    });
    return `M${pts[0]} L${pts[1]} L${pts[2]} L${pts[3]} Z`;
  };
  return [sq(45), sq(0)];
};

/** স্থানীয় ফ্রেম → ০..১ ক্ল্যাম্পড */
export const ramp = (frame: number, start: number, dur: number): number =>
  interpolate(frame, [start, start + dur], [0, 1], clamp);
