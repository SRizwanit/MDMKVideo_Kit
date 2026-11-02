// ধাপ ৬.২ — মূল `MDMK` কম্পোজিশনের স্টিল (ভিডিও + ইনফোগ্রাফিক + ট্র্যাকার + ব্যাজ + ক্যাপশন একসাথে)
//   npm run still:mdmk          → mdmkstill-svg1.png, -svg4.png, -svg6.png, -svg7.png, -svg9.png, -intro.png, -outro.png
//   npm run still:mdmk -- svg6  → একটি (ধাপ ৬.৩: `intro`, `outro`-ও চলে)
// ফ্রেম = সিনের শুরু (director.ts, ৩০fps) + সিনের ভিতরের "ভরা" মুহূর্ত। মাথা/কার্ড/ক্যাপশন তিনটির জায়গা দেখতে।
import {execFileSync} from 'node:child_process';

const FRAMES = {
  svg1: 75, // সালাম ব্যাজ
  svg4: 560, // বাম হাত + ব্যাজ ১ + ট্র্যাকার ১২/১৬
  svg6: 1015, // পর্দা/শিল্ড + ব্যাজ ৩
  svg7: 1398, // নরম বনাম শক্ত + ব্যাজ ৪ (পাঞ্চ-জুম চলছে)
  svg9: 1897, // MDMK ব্যাজ + বেল
  intro: 50, // ধাপ ৬.৩: ইন্ট্রো টাইটেল পটি (উপরে) + সালাম-কার্ড
  outro: 2205, // ধাপ ৬.৩: আউট্রো CTA কার্ড (সমাপনী সালাম সরে যাওয়ার পর)
};
const only = process.argv[2];
for (const [id, frame] of Object.entries(FRAMES)) {
  if (only && only !== id) continue;
  console.log(`▶ MDMK — ${id} — ফ্রেম ${frame}`);
  execFileSync('npx', ['remotion', 'still', 'index.ts', 'MDMK', `mdmkstill-${id}.png`, `--frame=${frame}`], {
    stdio: 'inherit',
  });
}
