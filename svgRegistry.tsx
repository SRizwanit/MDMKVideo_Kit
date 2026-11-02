import React from 'react';
import {Svg1} from './svg1';
import {Svg2} from './svg2';
import {Svg3} from './svg3';
import {Svg4} from './svg4';
import {Svg5} from './svg5';
import {Svg6} from './svg6';
import {Svg7} from './svg7';
import {Svg8} from './svg8';
import {Svg9} from './svg9';
import type {SvgProps} from './svgKit';

// ধাপ ৫ — svg১…svg৯ রেজিস্ট্রি (ধাপ ৬-এর director.ts এখান থেকে নাম ধরে কম্পোনেন্ট নেবে)
// `seconds` = timestamp.json থেকে মাপা ডিফল্ট সিন-দৈর্ঘ্য (শুধু প্রিভিউ-কম্পোজিশনের জন্য;
// আসল শুরু/শেষ সময় ডিরেক্টর ঠিক করবে)। `stillFrame` = যাচাইয়ের স্টিলের ফ্রেম।

export type SvgId = 'svg1' | 'svg2' | 'svg3' | 'svg4' | 'svg5' | 'svg6' | 'svg7' | 'svg8' | 'svg9';

type Entry = {
  Component: React.FC<SvgProps & {ending?: boolean}>;
  title: string;
  seconds: number;
  stillFrame: number;
};

export const svgRegistry: Record<SvgId, Entry> = {
  svg1: {Component: Svg1, title: 'সালাম ব্যাজ', seconds: 4.04, stillFrame: 70},
  svg2: {Component: Svg2, title: 'প্রগ্রেস রিং ৮/১৬', seconds: 6.03, stillFrame: 80},
  svg3: {Component: Svg3, title: '+৪ ব্যাজ, ৮→১২', seconds: 2.48, stillFrame: 65},
  svg4: {Component: Svg4, title: 'বাম হাত + পানি/ঢিলা', seconds: 4.87, stillFrame: 110},
  svg5: {Component: Svg5, title: 'ফোঁটা বন্ধ + আড়ালে চলা', seconds: 7.93, stillFrame: 200},
  svg6: {Component: Svg6, title: 'পর্দা/শিল্ড (সতর আড়াল)', seconds: 12.07, stillFrame: 130},
  svg7: {Component: Svg7, title: 'নরম বনাম শক্ত', seconds: 10.81, stillFrame: 130},
  svg8: {Component: Svg8, title: 'বই + আলো + চারা', seconds: 4.9, stillFrame: 120},
  svg9: {Component: Svg9, title: 'MDMK ব্যাজ + বেল', seconds: 6.57, stillFrame: 90},
};

export const svgIds = Object.keys(svgRegistry) as SvgId[];
