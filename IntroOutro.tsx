import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {fadeOut, popIn, shake, slideIn} from './animations';
import type {IntroOutroPlan} from './introOutroPlan';
import {colors, fonts, safeArea, zones} from './theme';

// ধাপ ৬.৩ — ইন্ট্রো টাইটেল + আউট্রো CTA (লেয়ার: ক্যাপশনের উপরে, SFX অডিওর নিচে — Video.tsx দেখো)
//
// • ইন্ট্রো: উপরে ট্র্যাকার-জোনে (y ১৫০–২৩৪) ছোট কাচ-পটি — [অর্ধচন্দ্র-আইকন] MDMK | বিষয়। সিন ১-এ ট্র্যাকার নেই, তাই খালি জায়গা।
// • আউট্রো: কার্ড-জোনে (y ২৫০–৬৩৫) "MDMK এর সাথে থাকুন" কার্ড — লোগো-ব্যাজ + ফলো-বাটন + ঝাঁকুনি-বেল। ভিডিওর শেষ ফ্রেম পর্যন্ত থাকে।
// সব আইকন বিমূর্ত ভেক্টর (SVG) — ইমোজি/মানব-চিত্র নেই। সময় ঠিক করে `introOutroPlan.ts`।
//
// ✏️ নতুন ভিডিওতে বদলানোর জায়গা — শুধু নিচের চারটি লেখা (খালি রাখলে ওই অংশ বাদ):

/** ব্র্যান্ড-নাম (ইন্ট্রো পটি + আউট্রো ব্যাজ) */
export const BRAND = 'MDMK';
/** ইন্ট্রো পটির বিষয়-লাইন — প্রতিটি নতুন ভিডিওতে বদলাও (খালি '' = শুধু ব্র্যান্ড) */
export const INTRO_SUBTITLE = 'ইস্তিঞ্জার সুন্নাত · ৯–১২';
/** আউট্রো CTA-র মূল লাইন ও উপ-লাইন */
export const OUTRO_TITLE = 'MDMK এর সাথে থাকুন';
export const OUTRO_SUBTITLE = 'আরও ছোট ছোট সুন্নাত শিখতে';
/** আউট্রো বাটনের লেখা */
export const OUTRO_BUTTON = 'ফলো করুন';

const INTRO_EXIT_FRAMES = 10;
const SAFE_W = 1080 - safeArea.left - safeArea.right; // ৮৮০
const textShadow = '0 2px 6px rgba(0,0,0,0.45)';

// ───────────── আইকন (ভেক্টর) ─────────────
const CrescentIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <path
      d="M 40 -78 A 82 82 0 1 0 40 78 A 64 64 0 1 1 40 -78 Z"
      fill={colors.gold}
      stroke={colors.goldSoft}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path
      d="M 58 -22 L 69 4 L 97 6 L 75 24 L 83 51 L 58 36 L 33 51 L 41 24 L 19 6 L 47 4 Z"
      fill={colors.goldSoft}
      transform="translate(10 -6) scale(0.8)"
    />
  </svg>
);

const BellIcon: React.FC<{size: number; color: string; dot?: string}> = ({size, color, dot}) => (
  <svg width={size} height={size} viewBox="0 0 90 90" style={{overflow: 'visible'}}>
    <path d="M45 10 C30 10 24 24 24 40 L24 54 L14 66 L76 66 L66 54 L66 40 C66 24 60 10 45 10 Z" fill={color} />
    <circle cx={45} cy={76} r={8} fill={color} />
    {dot ? <circle cx={68} cy={16} r={11} fill={dot} stroke="#ffffff" strokeWidth={3} /> : null}
  </svg>
);

// ───────────── ইন্ট্রো টাইটেল ─────────────
export const IntroTitle: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = slideIn(frame, fps, 0, 'up', 70);
  const out = fadeOut(frame, Math.max(0, durationInFrames - INTRO_EXIT_FRAMES), INTRO_EXIT_FRAMES);
  const glint = interpolate(frame, [6, 40], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        top: zones.tracker.top + 4,
        width: SAFE_W,
        height: 76,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter.opacity * out,
        transform: `translateY(${enter.y}px)`,
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          height: 76,
          padding: '0 34px 0 26px',
          borderRadius: 38,
          background: colors.glass,
          border: `3px solid ${colors.glassBorder}`,
          boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
        }}
      >
        <CrescentIcon size={46} />
        <span
          style={{
            fontFamily: fonts.bangla,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1,
            color: colors.gold,
            letterSpacing: 2,
            textShadow,
          }}
        >
          {BRAND}
        </span>
        {INTRO_SUBTITLE ? (
          <>
            <span style={{width: 3, height: 36, borderRadius: 2, background: colors.glassBorder}} />
            <span
              style={{
                fontFamily: fonts.bangla,
                fontWeight: 600,
                fontSize: 36,
                lineHeight: 1.25,
                color: colors.white,
                whiteSpace: 'nowrap',
                textShadow,
              }}
            >
              {INTRO_SUBTITLE}
            </span>
          </>
        ) : null}
        {/* হালকা আলোর ঝিলিক (বাঁ → ডানে) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 70,
            left: `${glint}%`,
            transform: 'skewX(-20deg)',
            background: 'linear-gradient(90deg, rgba(255,224,138,0), rgba(255,224,138,0.28), rgba(255,224,138,0))',
          }}
        />
      </div>
    </div>
  );
};

// ───────────── আউট্রো CTA ─────────────
export const OutroCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const panel = popIn(frame, fps, 0, {damping: 12, stiffness: 140, mass: 0.7});
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badge = popIn(frame, fps, 6, {damping: 9, stiffness: 170, mass: 0.7});
  const text = slideIn(frame, fps, 12, 'right', 60);
  const button = popIn(frame, fps, 20, {damping: 8, stiffness: 200, mass: 0.6});
  const ring = shake(frame, 28, 30, 16, 4);
  const pulse = (frame % 50) / 50;
  const pulseScale = interpolate(pulse, [0, 1], [1, 1.35]);
  const pulseOpacity = interpolate(pulse, [0, 1], [0.55, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        top: zones.card.top + 22,
        width: SAFE_W,
        display: 'flex',
        justifyContent: 'center',
        opacity: fadeIn,
        transform: `scale(${interpolate(panel, [0, 1], [0.9, 1])})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          width: 800,
          boxSizing: 'border-box',
          padding: '28px 36px',
          borderRadius: 44,
          background: `linear-gradient(160deg, ${colors.bgTeal} 0%, ${colors.bgDeep} 100%)`,
          border: `5px solid ${colors.gold}`,
          boxShadow: '0 10px 34px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 28, width: '100%'}}>
          {/* লোগো-ব্যাজ (স্পন্দিত রিং সহ) */}
          <div style={{position: 'relative', width: 148, height: 148, flexShrink: 0}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `5px solid ${colors.captionCyan}`,
                opacity: pulseOpacity,
                transform: `scale(${pulseScale})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #1aa7c4 0%, #0e4f5c 100%)',
                border: `7px solid ${colors.goldSoft}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${badge})`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.bangla,
                  fontWeight: 800,
                  fontSize: 36, // ব্যাজের ভিতরের ১১৮px-এ আরামে ঢোকে (৪২-এ কিনারা ঘেঁষছিল)
                  lineHeight: 1,
                  color: colors.white,
                  letterSpacing: 1,
                  textShadow,
                }}
              >
                {BRAND}
              </span>
            </div>
          </div>
          {/* লেখা */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              opacity: text.opacity,
              transform: `translateX(${text.x}px)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.bangla,
                fontWeight: 800,
                fontSize: 52,
                lineHeight: 1.3,
                color: colors.white,
                whiteSpace: 'nowrap',
                textShadow,
              }}
            >
              {OUTRO_TITLE}
            </span>
            {OUTRO_SUBTITLE ? (
              <span
                style={{
                  fontFamily: fonts.bangla,
                  fontWeight: 600,
                  fontSize: 34,
                  lineHeight: 1.3,
                  color: colors.goldSoft,
                  whiteSpace: 'nowrap',
                  textShadow,
                }}
              >
                {OUTRO_SUBTITLE}
              </span>
            ) : null}
          </div>
        </div>
        {/* ফলো-বাটন + ঝাঁকুনি-বেল */}
        {OUTRO_BUTTON ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              height: 76,
              padding: '0 40px 0 30px',
              borderRadius: 38,
              background: colors.gold,
              border: `4px solid ${colors.goldSoft}`,
              transform: `scale(${button})`,
            }}
          >
            <div style={{transform: `rotate(${ring}deg)`, transformOrigin: '50% 12%', display: 'flex'}}>
              <BellIcon size={46} color={colors.bgDeep} dot={colors.danger} />
            </div>
            <span
              style={{
                fontFamily: fonts.bangla,
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1.2,
                color: colors.bgDeep,
              }}
            >
              {OUTRO_BUTTON}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ───────────── সমন্বয় ─────────────
/** `plan` = `planIntroOutro(...)`-এর ফলাফল; null হলে ওই অংশ আঁকা হয় না */
export const IntroOutro: React.FC<{plan: IntroOutroPlan}> = ({plan}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {plan.intro && (
      <Sequence
        from={plan.intro.startFrame}
        durationInFrames={plan.intro.endFrame - plan.intro.startFrame}
        name="intro-title"
      >
        <IntroTitle durationInFrames={plan.intro.endFrame - plan.intro.startFrame} />
      </Sequence>
    )}
    {plan.outro && (
      <Sequence
        from={plan.outro.startFrame}
        durationInFrames={plan.outro.endFrame - plan.outro.startFrame}
        name="outro-cta"
      >
        <OutroCta />
      </Sequence>
    )}
  </AbsoluteFill>
);
