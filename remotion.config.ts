import {Config} from '@remotion/cli/config';
import os from 'node:os';

// ফ্ল্যাট স্ট্রাকচার: mdmk.mp4 ও timestamp.json রুটে থাকে, তাই publicDir = রুট
Config.setPublicDir('.');

// আউটপুট সেটিংস
Config.setCodec('h264');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');

// কনকারেন্সি: GitHub Actions রানারে (২ কোর) নিরাপদ মান; ধাপ ৭-এ টিউন হবে
// কোর-সংখ্যার বেশি দিলে Remotion এরর দেয় (১-কোর মেশিনে ২ দিলে ফেইল) — তাই min(২, কোর)
Config.setConcurrency(Math.max(1, Math.min(2, os.cpus().length)));
