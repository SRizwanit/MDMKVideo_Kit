import fs from 'node:fs';
import {parseTimestamp} from './parseTimestamp';
import {
  CUSTOM_SCENES,
  SCENE_MIN_FRAMES,
  SFX_MIN_GAP_FRAMES,
  countValue,
  direct,
  emptyPlan,
  findPointWords,
  matchesCustom,
  thinEvents,
} from './director';
import {pickSfxSequence, seedFromText} from './sfxPicker';
import {buildCaptionGroups} from './captionGroups';

// ধাপ ৬.২ — ডিরেক্টর টেস্ট: `npm run test:director` (Remotion লাগে না)
const FPS = 30;
const raw = fs.readFileSync(new URL('./timestamp.json', import.meta.url), 'utf8');
const parsed = parseTimestamp(JSON.parse(raw), FPS);
const total = 2233;
let failed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    failed++;
    console.error('✗ ' + msg);
  } else console.log('✓ ' + msg);
};
const sec = (f: number) => (f / FPS).toFixed(2);

// ── সংখ্যা-হেল্পার ──
ok(countValue('আটটি') === 8 && countValue('ষোলটি') === 16 && countValue('চারটির') === 4 && countValue('দুটি') === 2, 'countValue: আটটি/ষোলটি/চারটির/দুটি');
ok(countValue('এক') === null && countValue('নয়') === null && countValue('কাজ') === null, 'countValue: সাধারণ "এক"/"নয়"/অন্য শব্দ → null');
ok(countValue('৮') === 8 && countValue('16') === 16, 'countValue: অঙ্ক (বাংলা/ইংরেজি)');

// ── কাস্টম-মোড ──
ok(matchesCustom(parsed.words), 'matchesCustom: আসল timestamp.json মেলে');
const plan = direct(parsed.words, FPS, total);
ok(plan.mode === 'custom', `মোড = custom (পেলাম: ${plan.mode})`);
ok(plan.scenes.length === CUSTOM_SCENES.length, `${CUSTOM_SCENES.length}টি সিন (পেলাম ${plan.scenes.length})`);
console.log('\nসিন-তালিকা:');
for (const s of plan.scenes) console.log(`  ${s.id.padEnd(12)} ফ্রেম ${s.startFrame}–${s.endFrame} (${sec(s.startFrame)}–${sec(s.endFrame)} সে, ${s.endFrame - s.startFrame} ফ্রেম)`);
ok(plan.scenes.every((s, i) => i === 0 || s.startFrame >= plan.scenes[i - 1].endFrame), 'সিন ওভারলাপ নেই');
ok(plan.scenes.every((s) => s.endFrame - s.startFrame >= SCENE_MIN_FRAMES && s.endFrame <= total && s.startFrame >= 0), 'প্রতি সিন ≥ ন্যূনতম দৈর্ঘ্য ও ভিডিওর ভিতরে');
ok(plan.scenes.map((s) => s.id).join(',') === 'svg1,svg2,svg3,svg4,svg5,svg6,svg7,svg8,svg9,svg1-ending', 'সিন-ক্রম svg1…svg9 + সমাপনী svg1');
ok(plan.scenes[plan.scenes.length - 1].ending === true, 'শেষ সিন = ending সংস্করণ');

// প্রতিটি সিন তার কথার ভিতরে (প্রথম শব্দ ±০.২ সে)
for (const row of CUSTOM_SCENES) {
  const sc = plan.scenes.find((s) => s.id === `${row.component}${row.ending ? '-ending' : ''}`);
  ok(!!sc && Math.abs(sc.startFrame - (Math.round(row.startSec * FPS) - 3)) <= 8, `${row.component}${row.ending ? ' (ending)' : ''} শুরু ≈ ${row.startSec}s`);
}

// ব্যাজ
console.log('\nব্যাজ:', plan.badges.map((b) => `${b.n}@${sec(b.startFrame)}–${sec(b.endFrame)}`).join('  '));
ok(plan.badges.map((b) => b.n).join('') === '1234', 'ব্যাজ ১,২,৩,৪');
const pw = findPointWords(parsed.words);
ok(pw.length === 4 && plan.badges.every((b, i) => b.startFrame === pw[i].startFrame), 'ব্যাজ শুরু = "N নাম্বার"-এর N শব্দের শুরু');
ok(
  plan.badges.every((b) => {
    const s = plan.scenes.find((x) => b.startFrame >= x.startFrame && b.startFrame < x.endFrame);
    return !!s && b.endFrame === s.endFrame;
  }),
  'ব্যাজ নিজের সিনের শেষে নামে',
);

// ট্র্যাকার
const t = plan.tracker;
console.log('\nট্র্যাকার:', t);
const s2 = plan.scenes.find((s) => s.id === 'svg2')!;
const s3 = plan.scenes.find((s) => s.id === 'svg3')!;
const s7 = plan.scenes.find((s) => s.id === 'svg7')!;
ok(!!t && t.from === 8 && t.to === 12 && t.total === 16, 'ট্র্যাকার ৮ → ১২ / ১৬');
ok(!!t && t.startFrame > s2.startFrame && t.endFrame === s7.endFrame, 'ট্র্যাকার svg2 → svg7-এর শেষ');
ok(!!t && t.startFrame + t.animateAt === s3.startFrame + 22, 'ট্র্যাকারের ৮→১২ বাড়া শুরু = svg3-র রিং বাড়ার ফ্রেম (সিন + ২২)');

// জুম, ফ্ল্যাশ
ok(plan.zoom.length === 4 && plan.zoom.every((z) => z.endFrame > z.startFrame), 'পাঞ্চ-জুম ৪টি পয়েন্টে');
ok(plan.flashes.length === plan.scenes.length, 'প্রতি সিনের শুরুতে ফ্ল্যাশ');

// ইভেন্ট ও ছাঁটাই
console.log('\nইভেন্ট (কাঁচা):', plan.events.length);
for (const e of plan.events) console.log(`  ${sec(e.frame).padStart(6)}s  ${e.kind.padEnd(8)} ${e.label}`);
ok(plan.events.every((e, i) => i === 0 || e.frame >= plan.events[i - 1].frame), 'ইভেন্ট ফ্রেম-ক্রমে');
ok(plan.events.every((e) => e.frame >= 0 && e.frame < total), 'ইভেন্ট ভিডিওর ভিতরে');
ok(plan.events.filter((e) => e.kind === 'badge').length === 4, '৪টি badge-ইভেন্ট');
ok(plan.events.some((e) => e.kind === 'intro') && plan.events.some((e) => e.kind === 'outro'), 'intro ও outro ইভেন্ট');
ok(plan.events.filter((e) => e.kind === 'progress').length === 1, 'একটি progress-ইভেন্ট (৮→১২)');
// ব্যাজ-ওয়ালা সিনে আলাদা "scene" ইভেন্ট নেই (ডুপ্লিকেট এড়ানো)
ok(!plan.events.some((e) => e.kind === 'scene' && ['svg4', 'svg5', 'svg6', 'svg7'].includes(e.sceneId ?? '')), 'ব্যাজ-সিনে ডুপ্লিকেট scene-ইভেন্ট নেই');

const thin = thinEvents(plan.events);
console.log('\nছাঁটা ইভেন্ট:', thin.length);
for (const e of thin) console.log(`  ${sec(e.frame).padStart(6)}s  ${e.kind.padEnd(8)} ${e.label}`);
ok(thin.every((e, i) => i === 0 || e.frame - thin[i - 1].frame >= SFX_MIN_GAP_FRAMES), '১ সেকেন্ডে সর্বোচ্চ ১টি (ছাঁটার পর)');
ok(thin.some((e) => e.kind === 'intro') && thin.some((e) => e.kind === 'outro') && thin.filter((e) => e.kind === 'badge').length === 4, 'ছাঁটায় intro/outro/৪ ব্যাজ টিকে আছে');
const seq = pickSfxSequence(thin.length, seedFromText(raw));
ok(seq.length === thin.length && seq.every((n, i) => i === 0 || n !== seq[i - 1]), `SFX-ক্রম: ${thin.length}টি, পরপর একই নয়`);

// ক্যাপশন-গ্যাপ বনাম সিন: ১ সেকেন্ডের বেশি বিরতিতে ক্যাপশন লুকায়; সিন তখনো থাকতে পারে (জায়গা আলাদা, y ২৫০–৬৩৫ বনাম ১২৮০+)
const groups = buildCaptionGroups(parsed.words);
let overlapsNote = 0;
for (let i = 1; i < groups.length; i++) {
  const gapStart = groups[i - 1].endFrame;
  const gapEnd = groups[i].startFrame;
  if (gapEnd - gapStart > 20) overlapsNote++;
}
console.log(`\nক্যাপশন-গ্রুপ ${groups.length}টি; ২০+ ফ্রেমের বিরতি ${overlapsNote}টি (এখানে ক্যাপশন নেই, কার্ড/বক্তা দেখা যাবে)`);

// ── অটো-মোড (একই শব্দে জোর করে) ──
const auto = direct(parsed.words, FPS, total, 'auto');
console.log('\nঅটো-মোড সিন:');
for (const s of auto.scenes) console.log(`  ${s.id.padEnd(12)} ${s.component.padEnd(10)} ${sec(s.startFrame)}–${sec(s.endFrame)}s ${s.props ? JSON.stringify(s.props) : ''}`);
console.log('অটো ব্যাজ:', auto.badges.map((b) => b.n).join(','), ' ট্র্যাকার:', auto.tracker ? `${auto.tracker.from}→${auto.tracker.to}/${auto.tracker.total}` : 'নেই');
ok(auto.mode === 'auto', 'অটো-মোড চলেছে');
ok(auto.scenes.every((s, i) => i === 0 || s.startFrame >= auto.scenes[i - 1].endFrame), 'অটো: সিন ওভারলাপ নেই');
ok(auto.scenes.filter((s) => s.component === 'autoPoint').map((s) => s.props?.n).join('') === '1234', 'অটো: ৪টি নম্বর-কার্ড (১–৪)');
ok(auto.scenes.filter((s) => s.component === 'svg1').length === 2 && auto.scenes[0].component === 'svg1' && auto.scenes[auto.scenes.length - 1].ending === true, 'অটো: শুরুর সালাম + শেষের সালাম');
ok(auto.scenes.some((s) => s.component === 'svg9') && auto.scenes.some((s) => s.component === 'svg8'), 'অটো: MDMK → svg9, সুন্নাত শিখি → svg8');
const ring = auto.scenes.find((s) => s.component === 'autoCount' && s.props?.total !== undefined);
ok(!!ring && ring.props?.value === 8 && ring.props?.total === 16, 'অটো: "ষোলটি … আটটি" → রিং ৮/১৬');
const plusScene = auto.scenes.find((s) => s.component === 'autoCount' && s.props?.plus !== undefined);
ok(!!plusScene && plusScene.props?.plus === 4, 'অটো: "পরবর্তী চারটি" → +৪');
ok(!!auto.tracker && auto.tracker.from === 8 && auto.tracker.to === 12 && auto.tracker.total === 16, 'অটো: ট্র্যাকার ৮ → ১২ / ১৬');
const headlines = auto.scenes.filter((s) => s.component === 'autoPoint').map((s) => s.props?.headline ?? '');
console.log('অটো শিরোনাম:', headlines);
ok(headlines.every((h) => h.length > 0 && h.length <= 70), 'অটো: শিরোনাম খালি নয়, ≤ ৭০ অক্ষর');
ok(auto.scenes.filter((s) => s.component === 'autoPoint').map((s) => s.props?.icon).join(',') === 'drop,drop,shield,drop', 'অটো: আইকন (পানি→ফোঁটা, সতর→শিল্ড)');

// ── কাস্টম না মিললে 'detect' অটোতে নামে ──
const shifted = parsed.words.map((w) => ({...w, startFrame: w.startFrame + 20, endFrame: w.endFrame + 20, startSec: w.startSec + 0.7, endSec: w.endSec + 0.7}));
ok(!matchesCustom(shifted) && direct(shifted, FPS, total + 40).mode === 'auto', 'সময় সরে গেলে detect → অটো-মোড');

// ── খালি/ছোট ইনপুট ──
ok(direct([], FPS, total).scenes.length === 0 && emptyPlan().events.length === 0, 'শব্দ নেই → খালি প্ল্যান (ক্র্যাশ নেই)');
const tiny = direct(parsed.words.slice(0, 5), FPS, 200);
ok(tiny.scenes.every((s) => s.endFrame <= 200), 'ছোট ভিডিওতে সিন দৈর্ঘ্যের ভিতরে');

console.log(failed === 0 ? '\n✅ সব টেস্ট পাশ' : `\n❌ ${failed}টি ফেইল`);
process.exit(failed === 0 ? 0 : 1);
