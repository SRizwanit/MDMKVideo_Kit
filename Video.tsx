import React, {useMemo} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from './types';
import {colors, zones} from './theme';
import {Captions} from './Captions';
import {fadeOut} from './animations';
import {
  DirectedScene,
  ENDING_EXIT_FRAMES,
  EXIT_FRAMES,
  direct,
} from './director';
import {SceneFlash, StageBackground, StageProgressBar, StageVideo} from './Effects';
import {planStage, stageAt} from './stagePlan';
import {ProgressTracker} from './ProgressTracker';
import {NumberBadge} from './NumberBadge';
import {AutoCountCard, AutoPointCard} from './AutoScenes';
import {CARD_LEFT, CARD_W} from './svgKit';
import {svgRegistry} from './svgRegistry';
import {IntroOutro} from './IntroOutro';
import {planIntroOutro} from './introOutroPlan';
import {SfxLayer} from './SfxLayer';
import {planSfx, seedForVideo} from './sfxPlan';

/**
 * নম্বর-ব্যাজ: কার্ডের উপরের-ডান কোণায় ঝুলে থাকে (ট্র্যাকার y ১৫০–২৩৪-এর নিচে, কার্ড y ২৫০ থেকে)।
 * ধাপ ৬.৪: আগে উপরের-বামে ছিল এবং শিরোনামের প্রথম অক্ষর ঢেকে দিত (যেমন "সতর আড়াল"-এর "স") — এখন ডানে; শিরোনাম বাম-ঘেঁষা, তাই সংঘর্ষ নেই।
 */
const BADGE_SIZE = 104;
const BADGE_LEFT = CARD_LEFT + CARD_W - BADGE_SIZE; // ৮৩৬ → ব্যাজ x ৮৩৬–৯৪০ (নিরাপদ-এলাকার ডান সীমা ৯৪০)
const BADGE_TOP = zones.card.top - 14; // ২৩৬

/** Sequence-এর শেষ ফ্রেমগুলোয় ফেড-আউট (ট্র্যাকার/ব্যাজের জন্য — এদের নিজস্ব এক্সিট নেই) */
const FadeEnd: React.FC<{durationInFrames: number; frames?: number; children: React.ReactNode}> = ({
  durationInFrames,
  frames = EXIT_FRAMES,
  children,
}) => {
  const frame = useCurrentFrame();
  const o = fadeOut(frame, Math.max(0, durationInFrames - frames), frames);
  return <AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>{children}</AbsoluteFill>;
};

/** ডিরেক্টরের একটি সিন → সঠিক কম্পোনেন্ট (Sequence-এর ভিতরে; ফ্রেম স্থানীয়) */
const SceneView: React.FC<{scene: DirectedScene}> = ({scene}) => {
  const dur = scene.endFrame - scene.startFrame;
  const exitDuration = scene.ending ? ENDING_EXIT_FRAMES : EXIT_FRAMES;
  const exit = {exitAt: Math.max(0, dur - exitDuration), exitDuration};

  if (scene.component === 'autoPoint') {
    return (
      <AutoPointCard
        n={scene.props?.n ?? 1}
        headline={scene.props?.headline ?? ''}
        icon={scene.props?.icon ?? 'check'}
        {...exit}
      />
    );
  }
  if (scene.component === 'autoCount') {
    return <AutoCountCard value={scene.props?.value} total={scene.props?.total} plus={scene.props?.plus} {...exit} />;
  }
  if (scene.component === 'svg1') {
    const {Component} = svgRegistry.svg1;
    return <Component ending={scene.ending} {...exit} />;
  }
  const {Component} = svgRegistry[scene.component];
  return <Component {...exit} />;
};

/**
 * মূল ভিডিও কম্পোজিশন — লেয়ারের চূড়ান্ত ক্রম (নিচ থেকে উপরে):
 *   ০) স্টেজ-ব্যাকগ্রাউন্ড (ভিডিও ছোট হলে)               [ধাপ ৬.৪]
 *   ১) ভিডিও (+ অডিও) — পুরো-স্ক্রিন ↔ নিচের গোল-কোণা ফ্রেম  [ধাপ ২ + ৬.২ + ৬.৪]
 *   ২) ইফেক্টস: স্টেজ-অগ্রগতি বার + সিন-ফ্ল্যাশ           [ধাপ ৬.২ + ৬.৪]
 *   ৩) ইনফোগ্রাফিক: সিন-কার্ড (svg১…৯/অটো) → ট্র্যাকার → নম্বর-ব্যাজ   [ধাপ ৪–৬.২]
 *   ৪) ক্যাপশন                                       [ধাপ ৩]
 *   ৫) ইন্ট্রো টাইটেল (উপরে ট্র্যাকার-জোনে) + আউট্রো CTA (কার্ড-জোনে)   [ধাপ ৬.৩]
 *   ৬) SFX অডিও (সবার উপরে; কিছু আঁকে না)             [ধাপ ৬.৩ — `SFX_ENABLED` সুইচ SfxLayer.tsx-এ]
 */
export const Video: React.FC<VideoProps> = ({videoSrc, words, seed}) => {
  const {fps, durationInFrames} = useVideoConfig();
  // ডিরেক্টরের পরিকল্পনা একবারই (words/ভিডিও-দৈর্ঘ্য বদলালে নতুন)
  const plan = useMemo(() => direct(words, fps, durationInFrames), [words, fps, durationInFrames]);
  // ধাপ ৬.৩: ইন্ট্রো/আউট্রোর সময় + SFX-ক্রম (সিড = timestamp.json-এর টেক্সট-হ্যাশ → ভিডিওভেদে ভিন্ন, একই ভিডিওতে স্থির)
  const introOutro = useMemo(() => planIntroOutro(plan, durationInFrames), [plan, durationInFrames]);
  const sfxCues = useMemo(
    () => planSfx(plan, introOutro, seedForVideo(seed, words), durationInFrames),
    [plan, introOutro, seed, words, durationInFrames],
  );

  // ধাপ ৬.৪: স্টেজ-লেআউট — ইনফোগ্রাফিক চলাকালীন ভিডিও নিচে গোল-কোণা ফ্রেমে ছোট (সময়-পরিকল্পনা stagePlan.ts)
  const frame = useCurrentFrame();
  const stageSegs = useMemo(() => planStage(plan, introOutro, durationInFrames), [plan, introOutro, durationInFrames]);
  const stage = stageAt(frame, stageSegs);

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      {/* লেয়ার ০: স্টেজ-ব্যাকগ্রাউন্ড (গাঢ় নীল-টিল, তারা, গ্লো) — ভিডিও ছোট হলে দেখা যায় */}
      <StageBackground stage={stage} />

      {/* লেয়ার ১: মূল ভিডিও + অডিও।
          সোর্স ৪৮০×৮৬৪ (৯:১৬) → পুরো-স্ক্রিনে ১০৮০×১৯২০ (objectFit: cover) অথবা স্টেজে ৩৯৬×৭০৪ গোল-কোণা ফ্রেম; পাঞ্চ-জুম শুধু ফুটেজে */}
      <StageVideo segments={plan.zoom} stage={stage}>
        <OffthreadVideo
          src={videoSrc}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </StageVideo>

      {/* লেয়ার ২: ইফেক্টস */}
      <StageProgressBar stage={stage} />
      <SceneFlash starts={plan.flashes} />

      {/* লেয়ার ৩: ইনফোগ্রাফিক — সিন-কার্ড */}
      {plan.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.endFrame - scene.startFrame}
          name={scene.id}
        >
          <SceneView scene={scene} />
        </Sequence>
      ))}

      {/* প্রগ্রেস-ট্র্যাকার (৮/১৬ → ১২/১৬) — সিন ২–৭ জুড়ে */}
      {plan.tracker && (
        <Sequence
          from={plan.tracker.startFrame}
          durationInFrames={plan.tracker.endFrame - plan.tracker.startFrame}
          name="tracker"
        >
          <FadeEnd durationInFrames={plan.tracker.endFrame - plan.tracker.startFrame}>
            <ProgressTracker
              from={plan.tracker.from}
              to={plan.tracker.to}
              total={plan.tracker.total}
              animateAt={plan.tracker.animateAt}
              animateDuration={plan.tracker.animateDuration}
              label={plan.tracker.label}
            />
          </FadeEnd>
        </Sequence>
      )}

      {/* নম্বর-ব্যাজ ("এক/দুই/তিন/চার নাম্বার" শব্দ ধরে অটো পপ) */}
      {plan.badges.map((b) => (
        <Sequence
          key={`badge-${b.n}-${b.startFrame}`}
          from={b.startFrame}
          durationInFrames={b.endFrame - b.startFrame}
          name={`badge-${b.n}`}
        >
          <FadeEnd durationInFrames={b.endFrame - b.startFrame}>
            <NumberBadge
              n={b.n}
              size={BADGE_SIZE}
              style={{position: 'absolute', left: BADGE_LEFT, top: BADGE_TOP}}
            />
          </FadeEnd>
        </Sequence>
      ))}

      {/* লেয়ার ৪ (সবার উপরে): ক্যাশপন ক্যাপশন — বিরতিতে নিজে লুকায় (গ্যাপ-লজিক); ক্যাপশন নিচে y ১২৮০+, কার্ড উপরে */}
      <Captions words={words} />

      {/* লেয়ার ৫: ইন্ট্রো টাইটেল (শুরুতে, উপরে) + আউট্রো CTA (শেষে, কার্ড-জোনে) */}
      <IntroOutro plan={introOutro} />

      {/* লেয়ার ৬: SFX অডিও — ডিরেক্টরের ইভেন্টে, ভলিউম ≈ ০.৩৫, ১ সে-তে ১টি, পরপর একই নয় */}
      <SfxLayer cues={sfxCues} />
    </AbsoluteFill>
  );
};
