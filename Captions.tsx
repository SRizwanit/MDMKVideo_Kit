import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Word} from './types';
import {
  FADE_OUT_FRAMES,
  buildCaptionGroups,
  findGroupAt,
  fontSizeForGroup,
} from './captionGroups';
import type {CaptionGroup, WordKind} from './captionGroups';
import {captionPalette, colors, fonts, safeArea, zones} from './theme';

// ধাপ ৩ — ক্যাশপন ক্যাপশন ইঞ্জিন
// গ্রুপ (২–৩ শব্দ) একসাথে দেখায়; যে শব্দ এখন বলা হচ্ছে সেটা স্প্রিং-পপে বড় হয়ে রঙিন হয়।

/** কিওয়ার্ডের রঙ ও বাড়তি স্কেল */
const KIND_COLOR: Record<WordKind, string | null> = {
  normal: null, // পর্যায়ক্রমে captionPalette
  number: colors.gold,
  keyword: colors.keywordOrange,
  brand: colors.captionCyan,
};
const KIND_SCALE: Record<WordKind, number> = {
  normal: 1,
  number: 1.25,
  keyword: 1.15,
  brand: 1.3,
};

/** বাংলা টেক্সটের জন্য মোটা স্ট্রোক + শ্যাডো (যেকোনো ব্যাকগ্রাউন্ডে পড়া যায়) */
export const captionTextStyle = (fontSize: number): React.CSSProperties => ({
  fontFamily: fonts.bangla,
  fontWeight: 700,
  fontSize,
  // বাংলায় মাত্রা/উপরের চিহ্ন কাটা পড়া এড়াতে লাইন-হাইট বেশি
  lineHeight: 1.4,
  WebkitTextStroke: `${Math.round(fontSize * 0.14)}px ${colors.black}`,
  paintOrder: 'stroke fill',
  textShadow: '0 6px 0 rgba(0,0,0,0.55), 0 10px 26px rgba(0,0,0,0.6)',
  fontKerning: 'normal',
  whiteSpace: 'nowrap',
});

type WordViewProps = {
  word: Word;
  kind: WordKind;
  frame: number;
  fps: number;
  fontSize: number;
};

const WordView: React.FC<WordViewProps> = ({word, kind, frame, fps, fontSize}) => {
  const rel = frame - word.startFrame;
  const upcoming = rel < 0;
  const active = !upcoming && frame < word.endFrame;

  const accent =
    KIND_COLOR[kind] ?? captionPalette[word.index % captionPalette.length];
  const kindScale = KIND_SCALE[kind];

  // স্প্রিং পপ: আন্ডারড্যাম্পড → ১.০ ছাড়িয়ে একটু ওভারশুট
  const s = spring({
    frame: Math.max(0, rel),
    fps,
    config: {damping: 9, stiffness: 220, mass: 0.5},
  });
  const popScale = interpolate(s, [0, 1], [0.9, 1.15]);

  let color: string = colors.white;
  let opacity = 1;
  let scale = 1;

  if (upcoming) {
    color = colors.white;
    opacity = 0.55;
    scale = 1;
  } else if (active) {
    color = accent;
    scale = popScale * kindScale;
  } else {
    // বলা শেষ: সাধারণ শব্দ সাদা, বিশেষ শব্দ নিজের রঙ ধরে রাখে
    color = kind === 'normal' ? colors.white : accent;
    const settle = interpolate(frame - word.endFrame, [0, 5], [1.15, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    scale = settle * kindScale;
  }

  return (
    <span
      style={{
        ...captionTextStyle(fontSize),
        display: 'inline-block',
        color,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: '50% 60%',
      }}
    >
      {word.text}
    </span>
  );
};

type GroupViewProps = {group: CaptionGroup; frame: number; fps: number};

const GroupView: React.FC<GroupViewProps> = ({group, frame, fps}) => {
  const fontSize = fontSizeForGroup(group);

  // এন্ট্রি: দ্রুত ফেড-ইন + হালকা নিচ থেকে ওঠা
  const inT = interpolate(frame - group.showStart, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // এক্সিট: শুধু দীর্ঘ বিরতির আগে ফেড-আউট (সাথে সাথে পরের গ্রুপ এলে নয়)
  const outT = group.fadeOut
    ? interpolate(frame, [group.showEnd - FADE_OUT_FRAMES, group.showEnd], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        right: safeArea.right,
        top: zones.captions.top,
        height: zones.captions.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: inT * outT,
        transform: `translateY(${(1 - inT) * 24}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: fontSize * 0.28,
          rowGap: fontSize * 0.05,
          textAlign: 'center',
        }}
      >
        {group.words.map((w, i) => (
          <WordView
            key={w.index}
            word={w}
            kind={group.kinds[i]}
            frame={frame}
            fps={fps}
            fontSize={fontSize}
          />
        ))}
      </div>
    </div>
  );
};

export const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const groups = useMemo(() => buildCaptionGroups(words), [words]);
  const group = findGroupAt(groups, frame);
  if (!group) return null; // বিরতিতে ক্যাপশন লুকানো (ইনফোগ্রাফিকের জায়গা)
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <GroupView group={group} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

// ───────────── বাংলা যুক্তাক্ষর টেস্ট কম্পোজিশন ─────────────
// `npm run still:conjuncts` → conjuncts.png। ছবিতে যুক্তাক্ষর ভাঙা/বক্স (▯) দেখা গেলে ফন্ট সমস্যা।
const CONJUNCT_SAMPLES: {label: string; text: string}[] = [
  {label: 'ক্ষ', text: 'ক্ষ  লক্ষ্য  শিক্ষা'},
  {label: 'স্ত্র', text: 'স্ত্র  শাস্ত্র  প্রস্রাব'},
  {label: 'ন্ন', text: 'ন্ন  সুন্নাত  অন্ন'},
  {label: 'ঞ্জ', text: 'ঞ্জ  ইস্তিঞ্জার  গঞ্জ'},
  {label: 'র‍্য', text: 'র‍্য  ধৈর্য  কার্য'},
  {label: 'দীর্ঘ শব্দ', text: 'ওয়ারাহমাতুল্লাহি'},
  {label: 'দীর্ঘ শব্দ', text: 'ওয়াবারাকাতুহু।'},
  {label: 'বিরামচিহ্ন', text: 'নাম্বার, হচ্ছে? লাগে। ষোলটি'},
  {label: 'ইংরেজি+সংখ্যা', text: 'MDMK  ৮/১৬  ১২/১৬  +৪'},
];

export const CaptionTest: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgGreen,
        padding: `${safeArea.top}px 60px`,
        gap: 18,
      }}
    >
      {CONJUNCT_SAMPLES.map((s, i) => (
        <div key={i} style={{display: 'flex', flexDirection: 'column'}}>
          <span
            style={{
              fontFamily: fonts.bangla,
              fontSize: 28,
              color: colors.goldSoft,
              lineHeight: 1.4,
            }}
          >
            {s.label}
          </span>
          {/* প্লেইন + ক্যাপশন-স্টাইল (স্ট্রোকসহ) পাশাপাশি */}
          <span
            style={{
              fontFamily: fonts.bangla,
              fontWeight: 700,
              fontSize: 52,
              color: colors.white,
              lineHeight: 1.4,
            }}
          >
            {s.text}
          </span>
          <span
            style={{
              ...captionTextStyle(64),
              color: colors.captionYellow,
            }}
          >
            {s.text}
          </span>
        </div>
      ))}
    </AbsoluteFill>
  );
};
