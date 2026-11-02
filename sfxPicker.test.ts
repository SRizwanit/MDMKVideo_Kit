// ধাপ ৫ — sfxPicker.ts-এর টেস্ট: `npm run test:sfx` (সব লাইনে true / ০ আসা চাই)
import {pickSfxSequence, seedFromText, SFX_COUNT, sfxFile} from './sfxPicker';
const a = pickSfxSequence(30, seedFromText('ভিডিও এক'));
const a2 = pickSfxSequence(30, seedFromText('ভিডিও এক'));
const b = pickSfxSequence(30, seedFromText('ভিডিও দুই'));
console.log('A :', a.join(' '));
console.log('B :', b.join(' '));
console.log('একই seed একই ক্রম:', JSON.stringify(a) === JSON.stringify(a2));
console.log('ভিন্ন seed ভিন্ন ক্রম:', JSON.stringify(a) !== JSON.stringify(b));
console.log('প্রথম ১২টি সব আলাদা:', new Set(a.slice(0, SFX_COUNT)).size === SFX_COUNT);
let adj = 0; for (const s of [a, b, pickSfxSequence(500, 1), pickSfxSequence(500, 99)]) for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) adj++;
console.log('পরপর একই (০ হওয়া চাই):', adj);
console.log('পরিসর ১..১২:', a.every((n) => n >= 1 && n <= SFX_COUNT), sfxFile(a[0]));
console.log('পুল=১:', pickSfxSequence(3, 5, 1).join(','), ' ইভেন্ট=০:', pickSfxSequence(0, 5).length);
