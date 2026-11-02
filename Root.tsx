import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {Video} from './Video';
import {CaptionTest} from './Captions';
import {BlocksDemo} from './BlocksDemo';
import {svgPreviews} from './SvgPreview';
import {svgIds, svgRegistry} from './svgRegistry';
import {parseTimestamp} from './parseTimestamp';
import {seedFromText} from './sfxPicker';
import {VIDEO} from './theme';
import type {VideoProps} from './types';

export const VIDEO_WIDTH = VIDEO.width; // 1080
export const VIDEO_HEIGHT = VIDEO.height; // 1920
export const VIDEO_FPS = VIDEO.fps; // 30

// ইনপুট ফাইলের নাম ফিক্সড (রুটে; publicDir = '.')
export const VIDEO_FILE = 'mdmk.mp4';
export const TIMESTAMP_FILE = 'timestamp.json';

// স্টুডিওতে/ক্যালকুলেশনের আগে ব্যবহৃত ডিফল্ট
const defaultProps: VideoProps = {
  words: [],
  meta: {},
  warnings: [],
  videoSrc: staticFile(VIDEO_FILE),
  fps: VIDEO_FPS,
};

/**
 * রেন্ডারের আগে:
 *  ১) mdmk.mp4 থেকে আসল দৈর্ঘ্য পড়ে durationInFrames অটো সেট (হাতে লিখতে হয় না)
 *  ২) timestamp.json পড়ে পার্স করে props-এ দেওয়া
 */
const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({
  props,
}) => {
  const videoSrc = staticFile(VIDEO_FILE);
  const tsSrc = staticFile(TIMESTAMP_FILE);

  // দৈর্ঘ্য পড়া: media-parser (ব্রাউজারে ভিডিও ডিকোড না করে কনটেইনার থেকে পড়ে — কোডেক-নির্ভর নয়)
  const videoMeta = await parseMedia({
    src: videoSrc,
    fields: {durationInSeconds: true},
    acknowledgeRemotionLicense: true,
  });
  if (videoMeta.durationInSeconds === null || videoMeta.durationInSeconds === undefined) {
    throw new Error(`${VIDEO_FILE}-এর দৈর্ঘ্য পড়া যায়নি। ফাইলটি বৈধ MP4 (H.264 + AAC) কিনা দেখো।`);
  }

  const res = await fetch(tsSrc);
  if (!res.ok) {
    throw new Error(
      `${TIMESTAMP_FILE} পাওয়া যায়নি (HTTP ${res.status})। রুটে ${TIMESTAMP_FILE} আপলোড করেছো তো?`,
    );
  }
  let json: unknown;
  let seed: number;
  try {
    const rawText = await res.text();
    json = JSON.parse(rawText);
    // ধাপ ৬.৩: SFX-ক্রমের সিড = কাঁচা টেক্সটের হ্যাশ (ভিন্ন ভিডিও → ভিন্ন ক্রম; একই ফাইল → একই ক্রম)
    seed = seedFromText(rawText);
  } catch {
    throw new Error(
      `${TIMESTAMP_FILE} বৈধ JSON নয়। ফাইলটি আবার এক্সপোর্ট/আপলোড করো।`,
    );
  }

  const parsed = parseTimestamp(json, VIDEO_FPS);

  // দৈর্ঘ্য = ভিডিওর আসল দৈর্ঘ্য; শেষ শব্দ যেন কাটা না পড়ে (অন্তত শেষ শব্দ পর্যন্ত)
  const videoFrames = Math.ceil(videoMeta.durationInSeconds * VIDEO_FPS);
  const durationInFrames = Math.max(videoFrames, parsed.lastWordFrame, 1);

  return {
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    props: {
      ...props,
      words: parsed.words,
      meta: parsed.meta,
      warnings: parsed.warnings,
      videoSrc,
      fps: VIDEO_FPS,
      seed,
    },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="MDMK"
      component={Video}
      // placeholder; calculateMetadata আসল মান বসিয়ে দেয়
      durationInFrames={2233}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
    {/* ধাপ ৩: বাংলা যুক্তাক্ষর টেস্ট (শুধু যাচাইয়ের জন্য) */}
    <Composition
      id="CaptionTest"
      component={CaptionTest}
      durationInFrames={30}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
    {/* ধাপ ৪: ইনফোগ্রাফিক ব্লক ডেমো (শুধু প্রিভিউ/যাচাই) */}
    <Composition
      id="BlocksDemo"
      component={BlocksDemo}
      durationInFrames={150}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
    {/* ধাপ ৫: svg১…svg৯ আলাদা প্রিভিউ (Svg1 … Svg9) */}
    {svgIds.map((id) => (
      <Composition
        key={id}
        id={id.replace('svg', 'Svg')}
        component={svgPreviews[id]}
        durationInFrames={Math.round(svgRegistry[id].seconds * VIDEO_FPS)}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    ))}
    </>
  );
};
