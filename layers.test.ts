import fs from 'node:fs';
import {parseTimestamp} from './parseTimestamp';
import {SFX_MIN_GAP_FRAMES, direct, emptyPlan} from './director';
import type {DirectorPlan} from './director';
import {
  INTRO_MAX_FRAMES,
  INTRO_START_FRAME,
  INTRO_TRACKER_GAP,
  OUTRO_FRAMES,
  OUTRO_MIN_FRAMES,
  OUTRO_OVERLAP,
  OUTRO_SFX_DELAY,
  planIntroOutro,
} from './introOutroPlan';
import {SFX_COUNT, seedFromText, sfxFile} from './sfxPicker';
import {SFX_VOLUME, buildSfxEvents, planSfx, seedForVideo} from './sfxPlan';

// ধাপ ৬.৩ — SFX-পরিকল্পনা + ইন্ট্রো/আউট্রো-সময় টেস্ট: `npm run test:layers` (Remotion লাগে না)
const FPS = 30;
const rawUrl = new URL('./timestamp.json', import.meta.url);
const raw = fs.readFileSync(rawUrl, 'utf8');
const parsed = parseTimestamp(JSON.parse(raw), FPS);
const total = 2231; // ৭৪.৩৬ সে × ৩০ (গোল করে)
let failed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    failed++;
    console.error('✗ ' + msg);
  } else console.log('✓ ' + msg);
};
const sec = (f: number) => (f / FPS).toFixed(2);

const plan = direct(parsed.words, FPS, total);
ok(plan.mode === 'custom', `আগের ধাপ অক্ষত: মোড = custom (পেলাম: ${plan.mode})`);

// ───────────── ইন্ট্রো/আউট্রো ─────────────
console.log('\n— ইন্ট্রো/আউট্রো —');
const io = planIntroOutro(plan, total);
console.log('  ইন্ট্রো:', io.intro, ' আউট্রো:', io.outro, ' নোট:', io.notes);
ok(!!io.intro && io.intro.startFrame === INTRO_START_FRAME, `ইন্ট্রো আছে, শুরু ফ্রেম ${INTRO_START_FRAME}`);
ok(!!io.intro && io.intro.endFrame <= INTRO_MAX_FRAMES, `ইন্ট্রো ≤ ${INTRO_MAX_FRAMES} ফ্রেম (পেলাম শেষ ${io.intro?.endFrame})`);
ok(!!io.intro && !!plan.tracker && io.intro.endFrame <= plan.tracker.startFrame - INTRO_TRACKER_GAP, 'ইন্ট্রো ট্র্যাকার ঢোকার আগেই শেষ (একই জায়গা)');
ok(!!io.intro && plan.scenes[0].component === 'svg1' && io.intro.startFrame <= plan.scenes[0].startFrame, 'ইন্ট্রো সালাম-কার্ডের আগে/সাথে ঢোকে');

const lastCardEnd = Math.max(...plan.scenes.map((s) => s.endFrame));
ok(!!io.outro && io.outro.endFrame === total, `আউট্রো ভিডিওর শেষ ফ্রেম (${total}) পর্যন্ত`);
ok(!!io.outro && io.outro.startFrame >= lastCardEnd - OUTRO_OVERLAP, `আউট্রো শেষ কার্ডের (${lastCardEnd}) এক্সিটের বেশি ঢোকে না (শুরু ${io.outro?.startFrame})`);
ok(!!io.outro && io.outro.endFrame - io.outro.startFrame >= OUTRO_MIN_FRAMES && io.outro.endFrame - io.outro.startFrame <= OUTRO_FRAMES, `আউট্রো ${OUTRO_MIN_FRAMES}–${OUTRO_FRAMES} ফ্রেমের মধ্যে (${sec((io.outro?.endFrame ?? 0) - (io.outro?.startFrame ?? 0))} সে)`);
ok(!!io.outro && io.outro.startFrame >= (parsed.words[parsed.words.length - 1].endFrame - 4), 'আউট্রো শেষ কথার (সমাপনী সালাম) প্রায় পরে — কথা চলাকালে নয়');
ok(!!io.intro && !!io.outro && io.intro.endFrame < io.outro.startFrame, 'ইন্ট্রো ও আউট্রো একে অপরের সাথে মেশে না');

// অটো-মোডে (ট্র্যাকার/কার্ড অন্য সময়ে) ও সংঘর্ষ নেই
const auto = direct(parsed.words, FPS, total, 'auto');
const ioAuto = planIntroOutro(auto, total);
ok(!auto.tracker || !ioAuto.intro || ioAuto.intro.endFrame <= auto.tracker.startFrame - INTRO_TRACKER_GAP, 'অটো-মোডেও ইন্ট্রো ট্র্যাকারের আগে শেষ');
ok(!ioAuto.outro || ioAuto.outro.startFrame >= Math.max(...auto.scenes.map((s) => s.endFrame)) - OUTRO_OVERLAP, 'অটো-মোডেও আউট্রো শেষ কার্ডের পরে');

// ট্র্যাকার আগে ঢুকলে ইন্ট্রো ছাঁটে (কৃত্রিম প্ল্যান)
const earlyTracker: DirectorPlan = {...emptyPlan(), tracker: {...(plan.tracker as NonNullable<DirectorPlan['tracker']>), startFrame: 60}};
const ioEarly = planIntroOutro(earlyTracker, total);
ok(!!ioEarly.intro && ioEarly.intro.endFrame === 60 - INTRO_TRACKER_GAP, 'ট্র্যাকার ৬০-এ ঢুকলে ইন্ট্রো ৫৪-তে শেষ');
const ioVeryEarly = planIntroOutro({...earlyTracker, tracker: {...(earlyTracker.tracker as NonNullable<DirectorPlan['tracker']>), startFrame: 20}}, total);
ok(ioVeryEarly.intro === null, 'ট্র্যাকার ২০-এ ঢুকলে ইন্ট্রোর জায়গা নেই → বাদ');

// শেষ কার্ডের পর জায়গা কম হলে আউট্রো বাদ
const tight: DirectorPlan = {...emptyPlan(), scenes: [{...plan.scenes[0], endFrame: total - 10}]};
ok(planIntroOutro(tight, total).outro === null, 'শেষ কার্ড ভিডিওর শেষের ১০ ফ্রেম আগে শেষ → আউট্রো বাদ (জায়গা কম)');
const roomy: DirectorPlan = {...emptyPlan(), scenes: [{...plan.scenes[0], endFrame: 500}]};
const ioRoomy = planIntroOutro(roomy, total);
ok(!!ioRoomy.outro && ioRoomy.outro.startFrame === total - OUTRO_FRAMES, 'শেষ কার্ডের পর অনেক জায়গা থাকলে আউট্রো শেষ ৩ সে-তে');

// ক্র্যাশ নেই
const e0 = planIntroOutro(emptyPlan(), 0);
ok(e0.intro === null && e0.outro === null, 'দৈর্ঘ্য ০ → ইন্ট্রো/আউট্রো নেই (ক্র্যাশ নেই)');
const e20 = planIntroOutro(emptyPlan(), 20);
ok(e20.intro === null && e20.outro === null, 'ছোট ভিডিও (২০ ফ্রেম) → দুটিই বাদ (ক্র্যাশ নেই)');

// ───────────── SFX ─────────────
console.log('\n— SFX —');
const seed = seedFromText(raw);
const cues = planSfx(plan, io, seed, total);
console.log('  ইভেন্ট:', plan.events.length, '→ বাজবে:', cues.length, 'টি');
for (const c of cues) console.log(`  ফ্রেম ${String(c.frame).padStart(4)} (${sec(c.frame).padStart(5)} সে)  sfx${String(c.n).padStart(2)}  ${c.kind.padEnd(8)} ${c.label}`);

ok(cues.length >= 18 && cues.length <= plan.events.length + 1, `কিউ-সংখ্যা যুক্তিসঙ্গত (পেলাম ${cues.length}; ডিরেক্টরের ইভেন্ট ${plan.events.length} + CTA ১)`);
ok(cues.every((c, i) => i === 0 || c.frame - cues[i - 1].frame >= SFX_MIN_GAP_FRAMES), '১ সেকেন্ডে সর্বোচ্চ ১টি SFX (পরপর কিউ ≥ ৩০ ফ্রেম ব্যবধান)');
ok(cues.every((c, i) => i === 0 || c.frame > cues[i - 1].frame), 'কিউ ফ্রেম-ক্রমে সাজানো');
ok(cues.every((c) => c.frame >= 0 && c.frame < total), 'প্রতিটি কিউ ভিডিওর ভিতরে');
ok(cues.every((c, i) => i === 0 || c.n !== cues[i - 1].n), 'পরপর দুটি SFX কখনো একই নয়');
ok(cues.every((c) => c.n >= 1 && c.n <= SFX_COUNT && c.file === sfxFile(c.n)), `সব নম্বর ১–${SFX_COUNT}, ফাইলের নাম sfxN.wav`);
ok(cues.every((c) => fs.existsSync(new URL(`./${c.file}`, import.meta.url))), 'প্রতিটি sfx-ফাইল রুটে আসলেই আছে');
ok(new Set(cues.slice(0, SFX_COUNT).map((c) => c.n)).size === Math.min(SFX_COUNT, cues.length), `প্রথম ${Math.min(SFX_COUNT, cues.length)}টিতে কোনো SFX রিপিট নেই (পুল না ফুরানো পর্যন্ত)`);

const again = planSfx(plan, io, seed, total);
ok(JSON.stringify(again) === JSON.stringify(cues), 'একই ভিডিও আবার → হুবহু একই SFX-ক্রম (স্থির)');
const other = planSfx(plan, io, seedFromText(raw + ' '), total);
ok(other.map((c) => c.n).join() !== cues.map((c) => c.n).join(), 'ভিন্ন টেক্সট (ভিন্ন ভিডিও) → ভিন্ন SFX-ক্রম');
ok(other.map((c) => c.frame).join() === cues.map((c) => c.frame).join(), 'শুধু সাউন্ড বদলায়, সময় একই (সময় ডিরেক্টরের)');

ok(cues[0].kind === 'intro' && cues[0].frame === plan.scenes[0].startFrame, 'প্রথম SFX = শুরুর সালাম-সিনের শুরুতে');
const outroCues = cues.filter((c) => c.kind === 'outro');
ok(outroCues.length === 2, `আউট্রো-কিউ ২টি: সমাপনী সালাম + CTA (পেলাম ${outroCues.length})`);
ok(!!io.outro && outroCues.some((c) => c.frame === io.outro!.startFrame + OUTRO_SFX_DELAY), `CTA-র SFX আউট্রো শুরুর ${OUTRO_SFX_DELAY} ফ্রেম পরে`);
ok(cues.filter((c) => c.kind === 'badge').length === 4, 'নম্বর-ব্যাজ ১–৪ → ৪টি SFX');
ok(cues.some((c) => c.kind === 'progress'), 'প্রগ্রেস ৮→১২ → SFX আছে');

// সিড
const seedA = seedForVideo(undefined, parsed.words);
ok(seedA === seedForVideo(undefined, parsed.words) && seedForVideo(12345, parsed.words) === 12345, 'seedForVideo: স্থির; props.seed থাকলে সেটাই');
ok(seedForVideo(undefined, parsed.words.slice(1)) !== seedA, 'seedForVideo: শব্দ বদলালে সিড বদলায়');

// ভলিউম, ইভেন্ট-সংযোজন, খালি ইনপুট
ok(SFX_VOLUME > 0 && SFX_VOLUME <= 0.5, `SFX ভলিউম কথার চেয়ে নিচু (${SFX_VOLUME})`);
ok(buildSfxEvents(plan, io).length === plan.events.length + 1 && buildSfxEvents(plan, {...io, outro: null}).length === plan.events.length, 'ইভেন্ট = ডিরেক্টরের + (আউট্রো থাকলে) CTA ১টি');
ok(planSfx(emptyPlan(), {intro: null, outro: null, notes: []}, 1, 100).length === 0, 'খালি প্ল্যান → কোনো SFX নেই (ক্র্যাশ নেই)');
ok(planSfx(plan, io, seed, 600).every((c) => c.frame < 600), 'ভিডিও ছোট হলে দৈর্ঘ্যের বাইরের কিউ বাদ');

console.log(failed === 0 ? '\n✅ সব টেস্ট পাশ' : `\n❌ ${failed}টি ফেইল`);
process.exit(failed === 0 ? 0 : 1);
