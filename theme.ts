import {continueRender, delayRender} from 'remotion';
import {loadFont as loadHindSiliguri} from '@remotion/google-fonts/HindSiliguri';
import {loadFont as loadNotoSansBengali} from '@remotion/google-fonts/NotoSansBengali';

// ───────────── ফন্ট (বাংলা) ─────────────
// প্রাইমারি: **Baloo Da 2** — গোলচে, বন্ধুত্বপূর্ণ, মোটা বাংলা ফন্ট (রিল/শর্টসে জনপ্রিয়; "রোবটিক" ভাব নেই)।
// ফলব্যাক ১: Hind Siliguri, ফলব্যাক ২: Noto Sans Bengali (যুক্তাক্ষর/গ্লিফ না পেলে ধাপে ধাপে নামবে)।
// ফন্ট বদলাতে চাইলে শুধু নিচের BANGLA_PRIMARY_FAMILY লাইন বদলাও (যেমন 'Anek Bangla')
// এবং BANGLA_PRIMARY_CSS-এর family=… নাম মিলিয়ে নাও।
const BANGLA_PRIMARY_FAMILY = 'Baloo Da 2';
const BANGLA_PRIMARY_CSS =
  'https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;600;700;800&display=swap';
const BANGLA_PRIMARY_WEIGHTS = [500, 600, 700, 800] as const;

const hind = loadHindSiliguri('normal', {
  weights: ['500', '600', '700'],
  subsets: ['bengali', 'latin'],
});
const noto = loadNotoSansBengali('normal', {
  weights: ['500', '700'],
  subsets: ['bengali', 'latin'],
});

/**
 * প্রাইমারি ফন্ট Google Fonts CSS লিংক দিয়ে লোড (নাম-ইমপোর্ট-মুক্ত, তাই প্যাকেজের মডিউল-নামে ভুলের ঝুঁকি নেই)।
 * রেন্ডারের আগে `delayRender` দিয়ে অপেক্ষা করে; নেটওয়ার্ক না পেলে ফলব্যাক ফন্টেই চলবে (রেন্ডার থামবে না)।
 */
const primaryReady: Promise<void> =
  typeof document === 'undefined'
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const handle = delayRender(`${BANGLA_PRIMARY_FAMILY} ফন্ট লোড হচ্ছে`, {
          timeoutInMilliseconds: 60000,
        });
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          continueRender(handle);
          resolve();
        };
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = BANGLA_PRIMARY_CSS;
        link.onload = () => {
          Promise.all(
            BANGLA_PRIMARY_WEIGHTS.flatMap((w) => [
              document.fonts.load(`${w} 40px "${BANGLA_PRIMARY_FAMILY}"`, 'আইক্ষস্ত্র১২৩'),
              document.fonts.load(`${w} 40px "${BANGLA_PRIMARY_FAMILY}"`, 'MDMK0123'),
            ]),
          )
            .catch(() => undefined)
            .then(finish);
        };
        link.onerror = finish; // ফন্ট না এলেও রেন্ডার চলবে (ফলব্যাক ফন্ট)
        document.head.appendChild(link);
        setTimeout(finish, 45000);
      });

/** কম্পোনেন্ট রেন্ডারের আগে ফন্ট লোড হয়েছে কিনা নিশ্চিত করতে (delayRender-এ ব্যবহারযোগ্য) */
export const fontsReady = Promise.all([hind.waitUntilDone(), noto.waitUntilDone(), primaryReady]);

export const fonts = {
  bangla: `"${BANGLA_PRIMARY_FAMILY}", ${hind.fontFamily}, ${noto.fontFamily}, sans-serif`,
  banglaFallback: `${hind.fontFamily}, ${noto.fontFamily}, sans-serif`,
};

// ───────────── আউটপুট মাপ ─────────────
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

// ───────────── রঙ প্যালেট (ইসলামিক-ইনফোগ্রাফিক) ─────────────
// গাঢ় সবুজ/নীলাভ + সোনালি + উজ্জ্বল অ্যাকসেন্ট
export const colors = {
  // ব্যাকগ্রাউন্ড
  bgDeep: '#06261d',
  bgGreen: '#0b3d2e',
  bgTeal: '#0e4f5c',
  // সোনালি
  gold: '#f5c542',
  goldSoft: '#ffe08a',
  goldDark: '#b8892b',
  // টেক্সট
  white: '#ffffff',
  textDim: 'rgba(255,255,255,0.72)',
  black: '#000000',
  // ক্যাপশন অ্যাকসেন্ট (ধাপ ৩-এ পর্যায়ক্রমে)
  captionYellow: '#ffe14d',
  captionGreen: '#3dff8f',
  captionPink: '#ff6fb5',
  captionCyan: '#4de3ff',
  // কিওয়ার্ড হাইলাইট ("সুন্নাত", "বাম হাত") — ধাপ ৩
  keywordOrange: '#ff9f43',
  // স্ট্যাটাস
  success: '#3dd68c',
  danger: '#ff5d5d',
  // গ্লাস প্যানেল
  glass: 'rgba(6,38,29,0.72)',
  glassBorder: 'rgba(245,197,66,0.45)',
} as const;

/** ক্যাপশনে পর্যায়ক্রমে ব্যবহারের রঙ-তালিকা */
export const captionPalette = [
  colors.captionYellow,
  colors.captionGreen,
  colors.captionPink,
  colors.captionCyan,
] as const;

// ───────────── স্পেসিং ─────────────
export const spacing = {
  xs: 8,
  sm: 16,
  md: 32,
  lg: 48,
  xl: 72,
} as const;

// ───────────── সেফ-এরিয়া (ফেসবুক রিল/ইউটিউব শর্টস UI) ─────────────
// নিচে ক্যাপশন/অ্যাকাউন্ট-নাম, ডানে লাইক/শেয়ার বাটন, উপরে সার্চ/শিরোনাম বার ঢেকে দেয়।
export const safeArea = {
  top: 150,
  bottom: 380,
  left: 60,
  right: 140,
} as const;

// ───────────── বক্তার মুখের রেফারেন্স রেখা (আসল ফুটেজে মাপা — ধাপ ৫-এর লগ) ─────────────
// চুলের উপরের অংশ ≈ y ৫৭০, চোখ ≈ y ৮৫০, থুতনি ≈ y ১১৮০ (১০৮০×১৯২০ ফ্রেমে)।
export const faceRef = {
  hairTop: 570,
  eyes: 850,
  chin: 1180,
} as const;

// ───────────── লেআউট জোন (ধাপ ৩/৪-এ ব্যবহৃত; ধাপ ৬.১-এ ছোট করা হয়েছে) ─────────────
// চেয়ারে-বসা বক্তার মুখ ঢাকা এড়াতে: ইনফোগ্রাফিক উপরে, ক্যাপশন নিচের ১/৩-এ
// ধাপ ৬.১: কার্ডের নিচের সীমা আগে y ৭৯০ ছিল (কপাল/চুলের ≈ ২০০px উপর চাপত);
// ✱ স্টেজ-লেআউট (ধাপ ৬.৪, ব্যবহারকারীর রেফারেন্স-ছবি অনুযায়ী): ইনফোগ্রাফিক চলাকালীন ভিডিও নিচে গোল-কোণা ফ্রেমে (`stageFrame`)
// ছোট হয়ে যায় — তাই কার্ড আর মুখের উপর পড়ে না; কার্ড আবার পূর্ণ আকারে (নিচের সীমা y ৭৮০)।
// এখন y ≈ ৬৩৫ (ব্যবহারকারীর সিদ্ধান্ত: ৬২০–৬৫০)। চুলের রেখা (৫৭০) ছুঁয়ে মাত্র ≈ ৬৫px; চোখ-কপাল পুরো খোলা।
export const CARD_BOTTOM = 780;
export const zones = {
  infographic: {
    top: safeArea.top,
    height: CARD_BOTTOM + 5 - safeArea.top, // ৪৯০ → নিচে y=৬৪০
  },
  // ধাপ ৪: ইনফোগ্রাফিক জোনের ভিতরে — উপরে প্রগ্রেস-ট্র্যাকার, নিচে কার্ড/SVG এলাকা
  tracker: {
    top: safeArea.top,
    height: 84,
  },
  card: {
    top: safeArea.top + 84 + 16, // ২৫০
    height: CARD_BOTTOM - (safeArea.top + 84 + 16), // ৩৮৫ → নিচে y=৬৩৫ (আগে ৫৪০ → ৭৯০)
  },
  // বক্তার মুখ/শরীরের জায়গা — এখানে ইনফোগ্রাফিক/ক্যাপশন বসবে না
  speaker: {
    top: CARD_BOTTOM + 5, // ৬৪০ (আগে ৭৯০)
    height: 1280 - (CARD_BOTTOM + 5),
  },
  captions: {
    // নিচের ১/৩ (≈ y 1280–1540), সেফ-এরিয়ার ঠিক উপরে
    top: 1280,
    height: 1920 - safeArea.bottom - 1280,
  },
} as const;

// ───────────── স্টেজ-লেআউট (ধাপ ৬.৪) ─────────────
// ইনফোগ্রাফিক সিন চলার সময় ভিডিও পুরো-স্ক্রিন থেকে এই ফ্রেমে ছোট হয় (৯:১৬ অনুপাত অক্ষত — বিকৃতি নেই)।
// কার্ড y ২৫০–৭৮০, ফ্রেম y ৮২০–১৫২৪ (সেফ-এরিয়ার নিচ ১৫৪০-এর ভিতরে), ক্যাপশন (y ১২৮০–১৫৪০) ফ্রেমের নিচের অংশে বসে।
const STAGE_FRAME_W = 396;
export const stageFrame = {
  width: STAGE_FRAME_W,
  height: Math.round((STAGE_FRAME_W * 16) / 9), // ৭০৪
  left: Math.round((1080 - STAGE_FRAME_W) / 2), // ৩৪২
  top: CARD_BOTTOM + 40, // ৮২০
  radius: 40,
} as const;

/** স্টেজ-ব্যাকগ্রাউন্ডের রঙ (গাঢ় নীল-টিল; বদলাতে চাইলে এখানে) */
export const stageColors = {
  top: '#061a2b',
  mid: '#0a2c3d',
  bottom: '#07202f',
  glow: 'rgba(77,227,255,0.22)',
  frameBorder: 'rgba(255,255,255,0.92)',
} as const;

export const theme = {VIDEO, colors, captionPalette, fonts, spacing, safeArea, zones, faceRef, stageFrame, stageColors};
export default theme;
