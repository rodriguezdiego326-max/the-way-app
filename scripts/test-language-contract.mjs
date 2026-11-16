import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`LANGUAGE CONTRACT FAILED: ${message}`);
    process.exitCode = 1;
  }
}

const i18n = read('src/lib/i18n.tsx');
const app = read('src/App.tsx');
const you = read('src/screens/YouScreen.tsx');
const ask = read('src/screens/AskScreen.tsx');
const today = read('src/screens/TodayScreen.tsx');
const bibleTypes = read('src/lib/bibleTypes.ts');
const bibleEngine = read('src/lib/bibleEngine.ts');
const sermonClient = read('src/lib/sermonInsights.ts');
const sermonHook = read('src/hooks/useSermonInsights.ts');
const sermonFn = read('supabase/functions/generate-sermon-insights/index.ts');
const parentGuideScreen = read('src/screens/ParentGuideScreen.tsx');
const parentGuideEs = read('src/lib/parentGuideContent.es.ts');
const catechismScreen = read('src/screens/CatechismScreen.tsx');
const westminsterEs = read('src/lib/catechismWestminster.es.ts');
const heidelbergEs = read('src/lib/catechismHeidelberg.es.ts');

const dictionarySection = i18n.slice(0, i18n.indexOf('interface LanguageContextValue'));
const keyMatches = [...dictionarySection.matchAll(/^\s*(['"])(.*?)\1\s*:/gm)]
  .map((match) => match[2].replace(/\\'/g, "'"));
const duplicateKeys = [...new Set(keyMatches.filter((key, index) => keyMatches.indexOf(key) !== index))];

assert(duplicateKeys.length === 0, `duplicate Spanish dictionary keys: ${duplicateKeys.join(', ')}`);
assert(i18n.includes("localStorage.setItem(SCRIPTURE_STORAGE_KEY, next === 'es' ? 'RV1909' : 'WEB')"),
  'app language must own bundled Scripture language');
assert(i18n.includes('<LanguageBoundary key={language}>{children}</LanguageBoundary>'),
  'language switch must remount clean React content');
assert(!/originalText|restoreText|restoreTree|reverseTranslat/i.test(i18n),
  'crash-prone DOM restoration code must not return');

assert(app.includes("const loadedTranslation: BibleTranslation = loadedLanguage === 'es' ? 'RV1909' : 'WEB'"),
  'profile load must synchronize in-memory Bible translation');
assert(app.includes("const nextLanguage = tr === 'RV1909' ? 'es' : 'en'"),
  'Bible version changes must switch the whole app language');
assert(you.includes("preferred_translation: next === 'es' ? 'RV1909' : 'WEB'"),
  'Settings language switch must persist matching Scripture translation');

assert(ask.includes("askLang === 'es' ? 'Spanish' : 'English'"),
  'Ask must send the selected response language to intelligence');
assert(ask.includes("response_language: askLang === 'es' ? 'es' : 'en'"),
  'Ask messages must record their response language');

assert(today.includes("activeTranslation === 'RV1909' ? 'es' : 'en'"),
  'Today must derive response language from active Scripture translation');
assert(today.includes('wrongLanguage'),
  'Today must reject cached AI responses from a different language');

assert(bibleTypes.includes("export type BibleTranslation = 'WEB' | 'RV1909'"),
  'only installed bundled Bible translations should drive the language contract');
assert(bibleEngine.includes("case 'RV1909'") && bibleEngine.includes('localRV1909Provider'),
  'RV1909 must use the bundled Spanish provider');

assert(sermonClient.includes("responseLanguage: 'English' | 'Spanish'"),
  'sermon insights client must send response language');
assert(sermonHook.includes("responseLanguage: language === 'es' ? 'Spanish' : 'English'"),
  'sermon insight generation must follow app language');
assert(sermonHook.includes('stored.language !== language'),
  'cached sermon insights from another language must be invalidated');
assert(sermonFn.includes('responseLanguage: "English" | "Spanish"'),
  'sermon insights Edge Function must validate response language');
assert(sermonFn.includes('All summary, point titles'),
  'sermon insights prompt must pin all generated prose to requested language');

assert(parentGuideScreen.includes("language === 'es' ? parentGuidesEs : parentGuides"),
  'Parent Guide must switch its built-in teaching content with app language');
assert((parentGuideEs.match(/id:\s*["']/g) || []).length === 11,
  'Spanish Parent Guide must contain all 11 curated topics');

assert(catechismScreen.includes('westminsterShorterCatechismEs')
  && catechismScreen.includes('heidelbergCatechismEs'),
  'Catechism screen must switch both historic catechism sets with app language');
assert((westminsterEs.match(/number:\s*\d+/g) || []).length === 25,
  'Spanish Westminster content must contain questions 1–25');
assert((heidelbergEs.match(/number:\s*\d+/g) || []).length === 15,
  'Spanish Heidelberg content must contain questions 1–15');

if (!process.exitCode) {
  console.log('Language contract: PASS');
}
