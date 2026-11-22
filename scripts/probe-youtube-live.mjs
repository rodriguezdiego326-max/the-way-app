import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { Innertube } from 'youtubei.js';

// Use the same resolver as the Edge Function; a different client can hide its failure.
const source = readFileSync('supabase/functions/church-youtube-live-source/youtubeSource.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const { resolveYouTubeLiveHls } = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

try {
  const result = await resolveYouTubeLiveHls(process.env.TEST_YOUTUBE_URL || '', (signal) => Innertube.create({
    lang: 'en',
    location: 'US',
    fetch: (input, init) => fetch(input, { ...init, signal }),
  }));
  console.log('VIDEO_ID=' + result.videoId);
  console.log('TITLE=' + (result.title ?? ''));
  console.log('HLS_HOST=' + new URL(result.hlsUrl).hostname);
  console.log('PROBE_RESULT=resolvable_live_hls');
  // Resolving a URL does not prove that LiveKit can play it or translate its audio.
} catch (error) {
  console.error('PROBE_RESULT=' + error.message);
  process.exitCode = 3;
}
