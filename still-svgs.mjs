// ধাপ ৫ — svg১…svg৯-এর স্টিল রেন্ডার (যাচাইয়ের জন্য): `npm run still:svgs` → svgstill-1.png … svgstill-9.png
// ফ্রেম-নম্বর svgRegistry.tsx-এর `stillFrame` থেকে পড়ে। একটি বেছে নিতে: `npm run still:svgs -- 4`
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const reg = readFileSync(new URL('./svgRegistry.tsx', import.meta.url), 'utf8');
const only = process.argv[2];
for (let n = 1; n <= 9; n++) {
  if (only && String(n) !== only) continue;
  const m = reg.match(new RegExp(`svg${n}:.*stillFrame: (\\d+)`));
  if (!m) throw new Error(`svgRegistry.tsx-এ svg${n} এন্ট্রি পাওয়া যায়নি`);
  console.log(`▶ svg${n} — ফ্রেম ${m[1]}`);
  execFileSync(
    'npx',
    ['remotion', 'still', 'index.ts', `Svg${n}`, `svgstill-${n}.png`, `--frame=${m[1]}`],
    {stdio: 'inherit'},
  );
}
