import React from 'react';
import {AbsoluteFill} from 'remotion';
import {svgIds, svgRegistry} from './svgRegistry';
import type {SvgId} from './svgRegistry';
import {ProgressTracker} from './ProgressTracker';
import {colors, faceRef, fonts, zones} from './theme';

// ধাপ ৫ — প্রিভিউ-কম্পোজিশন: প্রতিটি SVG আলাদাভাবে (গাঢ় ব্যাকগ্রাউন্ড + লেআউট-গাইডসহ)।
// শুধু যাচাইয়ের জন্য; চূড়ান্ত ভিডিওতে নেই। কম্পোজিশন আইডি: Svg1 … Svg9।
//   npm run still:svgs   → সবগুলোর স্টিল (svg1.png … svg9.png)
//   npm run preview      → স্টুডিওতে Svg১…Svg৯ ঘুরিয়ে দেখো

export const makeSvgPreview = (id: SvgId): React.FC => {
  const {Component} = svgRegistry[id];
  const Preview: React.FC = () => (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bgDeep} 0%, ${colors.bgGreen} 55%, ${colors.bgTeal} 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: zones.speaker.top,
          height: zones.speaker.height,
          border: '3px dashed rgba(255,255,255,0.25)',
          borderRadius: 24,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.bangla,
          fontSize: 28,
          lineHeight: 1.4,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        বক্তার জায়গা
      </div>
      {/* ধাপ ৬.১: বক্তার চুলের উপরের রেখা (≈ y ৫৭০) — কার্ডের নিচ (≈ ৬৩৫) এর সাথে দূরত্ব দেখতে */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: faceRef.hairTop,
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
      <ProgressTracker from={8} to={8} total={16} label="সুন্নাত" />
      <Component />
    </AbsoluteFill>
  );
  return Preview;
};

/** মডিউল-স্তরে একবার বানানো (রেন্ডারে নতুন কম্পোনেন্ট তৈরি হলে রিমাউন্ট হতো) */
export const svgPreviews = Object.fromEntries(svgIds.map((id) => [id, makeSvgPreview(id)])) as Record<
  SvgId,
  React.FC
>;
