import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {drawOn} from './animations';
import {InfoCard} from './InfoCard';
import {NumberBadge} from './NumberBadge';
import {Pop, Shake, Slide, Wipe} from './Pop';
import {ProgressRing, ProgressTracker} from './ProgressTracker';
import {countUpSmooth} from './animations';
import {CARD_LEFT, CARD_W} from './svgKit';
import {colors, faceRef, fonts, safeArea, zones} from './theme';

// ধাপ ৪ — ডেমো কম্পোজিশন: সব ব্লক একসাথে প্রিভিউ (শুধু যাচাইয়ের জন্য; চূড়ান্ত ভিডিওতে নেই)
// `npm run still:blocks` → blocks.png (ফ্রেম ৯০) · `npm run render:blocks` → blocks-demo.mp4

const Guide: React.FC<{top: number; height: number; label: string}> = ({
  top,
  height,
  label,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 12,
      right: 12,
      top,
      height,
      border: '3px dashed rgba(255,255,255,0.35)',
      borderRadius: 24,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      padding: 14,
      fontFamily: fonts.bangla,
      fontSize: 26,
      lineHeight: 1.4,
      color: 'rgba(255,255,255,0.6)',
    }}
  >
    {label}
  </div>
);

// ছোট বিমূর্ত আইকন (মানব-চিত্র নয়): চেক-মার্ক বৃত্ত, ড্র-অন অ্যানিমেশনসহ
const CheckIcon: React.FC<{delay?: number}> = ({delay = 0}) => {
  const frame = useCurrentFrame();
  const circle = drawOn(frame, delay, 2 * Math.PI * 38, 24);
  const tick = drawOn(frame, delay + 18, 70, 14);
  return (
    <svg width={56} height={56} viewBox="0 0 96 96">
      <circle
        cx={48}
        cy={48}
        r={38}
        fill="none"
        stroke={colors.success}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circle.strokeDasharray}
        strokeDashoffset={circle.strokeDashoffset}
      />
      <path
        d="M28 50 L43 65 L69 34"
        fill="none"
        stroke={colors.success}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={tick.strokeDasharray}
        strokeDashoffset={tick.strokeDashoffset}
      />
    </svg>
  );
};

// বেল আইকন (শেক ডেমো)
const BellIcon: React.FC = () => (
  <svg width={90} height={90} viewBox="0 0 90 90">
    <path
      d="M45 10 C30 10 24 24 24 40 L24 54 L14 66 L76 66 L66 54 L66 40 C66 24 60 10 45 10 Z"
      fill={colors.gold}
    />
    <circle cx={45} cy={76} r={8} fill={colors.goldDark} />
  </svg>
);

export const BlocksDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  void fps;
  const cardW = CARD_W; // ৬৯০ (ধাপ ৬.১: আগে ৮৮০)
  const ringValue = countUpSmooth(frame, 8, 12, 50, 30);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgDeep} 0%, ${colors.bgGreen} 55%, ${colors.bgTeal} 100%)`,
      }}
    >
      {/* লেআউট গাইড */}
      <Guide top={zones.infographic.top} height={zones.infographic.height} label="ইনফোগ্রাফিক জোন (উপরের ১/৩)" />
      <Guide top={zones.speaker.top} height={zones.speaker.height} label="বক্তার জায়গা — ঢাকা যাবে না" />
      <Guide top={zones.captions.top} height={zones.captions.height} label="ক্যাপশন জোন (নিচের ১/৩)" />
      {/* ধাপ ৬.১: বক্তার চুলের উপরের রেখা (আসল ফুটেজে ≈ y ৫৭০) ও কার্ডের নিচের সীমা — যাচাইয়ের গাইড */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: faceRef.hairTop,
          height: 0,
          borderTop: '3px dashed rgba(255,120,120,0.8)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: faceRef.hairTop + 4,
          fontFamily: fonts.bangla,
          fontSize: 24,
          lineHeight: 1.4,
          color: 'rgba(255,150,150,0.95)',
        }}
      >
        চুলের রেখা ≈ {faceRef.hairTop}
      </div>

      {/* ১) প্রগ্রেস ট্র্যাকার ৮/১৬ → ১২/১৬ */}
      <ProgressTracker
        from={8}
        to={12}
        total={16}
        animateAt={50}
        animateDuration={30}
        label="সুন্নাত"
        delay={0}
      />

      {/* ২) ইনফো-কার্ড: শিরোনাম + আইকন + ভিতরে নম্বর-ব্যাজ, রিং */}
      <div
        style={{
          position: 'absolute',
          left: CARD_LEFT,
          top: zones.card.top,
          width: cardW,
        }}
      >
        <InfoCard
          title="বাম হাত ব্যবহার করব"
          icon={<CheckIcon delay={14} />}
          delay={6}
          width={cardW}
          minHeight={zones.card.height - 1}
          padding="16px 30px"
          titleSize={38}
          titleGap={4}
          radius={32}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <NumberBadge n={1} delay={16} label="নাম্বার" size={84} />
            <Pop delay={30}>
              <ProgressRing value={ringValue} total={16} size={160} stroke={18} />
            </Pop>
            <Shake delay={70} duration={28} amplitude={14}>
              <Pop delay={36}>
                <BellIcon />
              </Pop>
            </Shake>
          </div>
          <Wipe delay={40} direction="left" duration={24} style={{marginTop: 18}}>
            <div
              style={{
                height: 14,
                borderRadius: 7,
                background: `linear-gradient(90deg, ${colors.gold}, ${colors.captionGreen})`,
              }}
            />
          </Wipe>
        </InfoCard>
      </div>

      {/* ৩) স্লাইড-ইন ডেমো (বক্তার জোনের বাইরে, ক্যাপশন জোনের ঠিক উপরে নয় — শুধু উপরের জোনে ছোট) */}
      <Slide
        from="right"
        delay={20}
        style={{
          position: 'absolute',
          right: safeArea.right,
          top: zones.tracker.top + zones.tracker.height + 4,
          fontFamily: fonts.bangla,
          fontSize: 24,
          lineHeight: 1.4,
          color: colors.goldSoft,
        }}
      >
        {/* স্লাইড-ইন নমুনা লেবেল */}
        স্লাইড-ইন ✓
      </Slide>
    </AbsoluteFill>
  );
};
