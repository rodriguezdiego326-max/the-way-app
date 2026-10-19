import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/ScriptureBlock.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
function harness(fetchVerses, parsed = {book:'Psalm',chapter:119,verseStart:1,verseEnd:2}) {
  let effect;
  const statuses = [];
  const dependencies = {
    react: {useState: value => [value, () => {}], useEffect: fn => { effect = fn; }},
    'react/jsx-runtime': {jsx: () => null, jsxs: () => null},
    'lucide-react': {},
    '@/lib/passageParser': {parsePassageReference: () => parsed},
    '@/lib/bibleEngine': {fetchVerses},
    '@/lib/bibleTypes': {getBookDisplayName: x => x},
    '@/lib/utils': {vibrate: () => {}},
  };
  const context = vm.createContext({exports:{},require: name => dependencies[name]});
  vm.runInContext(code,context);
  context.exports.default({reference:'Psalm 119:1-2',translation:'WEB',onOpenBible:()=>{},onTextStatus:(...args)=>statuses.push(args)});
  const cleanup = effect();
  return {statuses,cleanup};
}
test('badge gets success only after all requested verses load', async () => {
  const app = harness(async () => ({verses:[{verse:1,text:'First'},{verse:2,text:'Second'}]}));
  assert.deepEqual(app.statuses,[['Psalm 119:1-2','WEB',false]]);
  await new Promise(setImmediate);
  assert.deepEqual(app.statuses.at(-1),['Psalm 119:1-2','WEB',true]);
});
test('missing verses, invalid references and loading errors never report success',async()=>{
  for(const [fetcher, parsed] of [
    [async()=>({verses:[{verse:1,text:'First'}]}),undefined],
    [async()=>{throw new Error('Missing chapter');},undefined],
    [async()=>({verses:[]}),null],
  ]) {
    const app=harness(fetcher,parsed);
    await new Promise(setImmediate);
    assert.equal(app.statuses.some(status=>status[2]===true),false);
  }
});
test('a stale load after navigation or translation change cannot update the badge',async()=>{
  let resolve;
  const app=harness(()=>new Promise(r=>{resolve=r;}));
  app.cleanup();
  resolve({verses:[{verse:1,text:'First'},{verse:2,text:'Second'}]});
  await new Promise(setImmediate);
  assert.equal(app.statuses.some(status=>status[2]===true),false);
});
