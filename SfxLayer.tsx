import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SFX_VOLUME, SFX_WINDOW_FRAMES} from './sfxPlan';
import type {SfxCue} from './sfxPlan';

// ধাপ ৬.৩ — সাউন্ড-ইফেক্ট লেয়ার (সবার উপরের অডিও-লেয়ার; কিছু আঁকে না)
//
// ✅ ডিফল্ট চালু। বন্ধ করতে নিচের `SFX_ENABLED`-কে `false` করো (এক লাইন) — তখন কোনো `sfxN.wav` লোডই হয় না।
// কোন ফ্রেমে কোন সাউন্ড তা `sfxPlan.ts`-এর `planSfx` ঠিক করে (ডিরেক্টরের ইভেন্ট → ১ সে-তে ১টি → পরপর একই নয়)।
// ফাইল রুটে (`publicDir = '.'`): `staticFile('sfx7.wav')`।

/** SFX চালু/বন্ধের সুইচ */
export const SFX_ENABLED = true;

export const SfxLayer: React.FC<{cues: SfxCue[]}> = ({cues}) => {
  if (!SFX_ENABLED || cues.length === 0) return null;
  return (
    <>
      {cues.map((cue) => (
        <Sequence
          key={`sfx-${cue.frame}-${cue.n}`}
          from={cue.frame}
          durationInFrames={SFX_WINDOW_FRAMES}
          layout="none"
          name={`sfx${cue.n}: ${cue.label}`}
        >
          <Audio src={staticFile(cue.file)} volume={SFX_VOLUME} />
        </Sequence>
      ))}
    </>
  );
};
