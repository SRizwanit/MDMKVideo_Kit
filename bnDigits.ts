// ধাপ ৪ — বাংলা অঙ্ক হেল্পার (বিশুদ্ধ TypeScript, Remotion-মুক্ত → টেস্টযোগ্য)

const BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** ইংরেজি অঙ্ক → বাংলা অঙ্ক। অন্য অক্ষর (/ + . , ইত্যাদি) অপরিবর্তিত। */
export const toBengaliDigits = (value: number | string): string =>
  String(value).replace(/[0-9]/g, (d) => BN[Number(d)]);

/** (৮, ১৬) → "৮/১৬" */
export const bnFraction = (a: number, b: number): string =>
  `${toBengaliDigits(Math.round(a))}/${toBengaliDigits(Math.round(b))}`;

/** (৪) → "+৪" */
export const bnPlus = (n: number): string => `+${toBengaliDigits(Math.round(n))}`;
