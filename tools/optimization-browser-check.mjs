import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { fixture, combatFixture, retinueFixture, npcFixture } from '../tests/fixture.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PEDIPALPUS_PLAYWRIGHT || 'playwright');
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const checksVersion = process.env.PEDIPALPUS_CHECKS_VERSION || '1.0.14';
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.0 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type','image/png');return response.end(uploadedImages.get(url.pathname));}
    if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); return response.end(pageHTML); }
    let target;
    if (url.pathname === '/checks-reference.js') target = fileURLToPath(new URL(`../../pedipalpus-checks/ucurifunke-v${checksVersion}/${checksVersion === '1.0.8' ? 'ucurifunke-checks/' : ''}scripts/ucurifunke-checks.js`, import.meta.url));
    else { target = path.resolve(root, '.' + url.pathname); if (!target.startsWith(root + path.sep)) throw new Error('Invalid path'); }
    response.setHeader('Content-Type', target.endsWith('.wav') ? 'audio/wav' : target.endsWith('.svg') ? 'image/svg+xml' : target.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(await fs.readFile(target));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser=await chromium.launch({headless:true,...(process.env.PEDIPALPUS_BROWSER?{executablePath:process.env.PEDIPALPUS_BROWSER}:{})});
  const page=await browser.newPage({viewport:{width:1460,height:1000}});
  await page.addInitScript(()=>{
    window.previewAudioEvents=[];
    window.previewSamples=[];
    const create=AudioContext.prototype.createGain;
    AudioContext.prototype.createGain=function(){
      const gain=create.call(this),set=gain.gain.setValueAtTime.bind(gain.gain);
      gain.gain.setValueAtTime=(value,time)=>{previewAudioEvents.push(value);return set(value,time);};
      return gain;
    };
    const makeSource=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(){
      const source=makeSource.call(this),start=source.start.bind(source);
      source.start=(...args)=>{if(source.buffer)previewSamples.push(source.buffer.duration);return start(...args);};return source;
    };
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
  const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
  const action=async name=>{const field=page.locator(`[data-action="${name}"]`);if(!await field.isVisible()&&!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await field.click();};
  const upload=async(raw,destination='')=>{
    await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'Test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))});
    await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="destination"]').selectOption(destination);await page.locator('.mock-dialog [data-action="import"]').click();
    await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();await idle();
  };
  const raw=retinueFixture();raw.Name='Testheld';raw.CurrentAE=7;raw.DerivedValues.push({ShortName:'AE',TotalValue:20});raw.ComplexConditions=[{Name:'Benommen',Level:0,Suppression:0}];
  const currentAttributes=value=>{if(!value||typeof value!=='object')return;if(['MU','KL','IN','CH','FF','GE','KO','KK','gMR','kMR','RE'].includes(value.ShortName)&&Number.isSafeInteger(value.TotalValue)){value.BaseValue=value.TotalValue;value.ModValue=0;delete value.TotalValue;}for(const child of Object.values(value))currentAttributes(child);};currentAttributes(raw);
  await upload(raw);const actorId=await page.locator('[name="actor"]').inputValue();
  const before=await page.evaluate(id=>JSON.stringify(game.actors.get(id).getFlag('pedipalpus-foundry','character')),actorId);
  await action('playstate');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  assert.equal(await page.evaluate(id=>JSON.stringify(game.actors.get(id).getFlag('pedipalpus-foundry','character')),actorId),before);
  console.log('PASS: Saving an unchanged state dialog makes no character-data changes and creates no empty override.');

  await page.locator('[data-action="battle"]').click();assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  const energy=()=>page.getByRole('button',{name:'Energien von Skelett bearbeiten',exact:true});
  await energy().click();assert.equal(await page.locator('[data-complex]').count(),0);assert.equal(await page.locator('[data-resource-row]').count(),1);
  const minus=()=>page.locator('[data-energy-step="-1"][data-energy-row="0"][data-energy-name="LE"]');
  await minus().click();assert.equal(await page.locator('[data-resource-row="0"]').inputValue(),'13');
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue[0].CurrentLe,actorId),14);
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue[0].CurrentLe,actorId),14);
  await energy().click();await minus().click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  let saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.deepEqual(saved.localState.resources,{'["id","old-skeleton"]':{LE:13}});assert.equal(saved.localState.conditions,undefined);assert.equal(saved.resources[0].value,31);
  assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  console.log('PASS: Clicking companion LE opens only that creature; plus/minus stays a draft until Save and does not freeze owner or other companion values.');

  raw.CurrentAE=10;raw.Demons[0].CurrentAstralEnergy=24;raw.ComplexConditions[0].Level=1;
  await upload(raw,actorId);saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.equal(saved.retinue.find(row=>row.InventoryId==='old-skeleton').CurrentLe,13);assert.equal(saved.resources.find(row=>row.name==='AE').value,10);
  assert.equal(saved.retinue.find(row=>row.InventoryId==='demon-1').CurrentAstralEnergy,24);assert.equal(saved.conditions.complex.find(row=>row.name==='Benommen').level,1);
  await action('playstate');const painIndex=await page.locator('[data-complex]').evaluateAll(fields=>fields.find(field=>field.closest('label').textContent.includes('Schmerz')).dataset.complex);await page.locator(`[data-complex="${painIndex}"]`).fill('1');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);assert.deepEqual(saved.localState.conditions.complex.map(row=>row.Name),['Schmerz']);
  raw.CurrentAE=11;raw.ComplexConditions[0].Level=2;raw.ComplexConditions.push({Name:'Wut',Level:1,Suppression:0});await upload(raw,actorId);
  saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.equal(saved.conditions.complex.find(row=>row.name==='Schmerz').level,1);assert.equal(saved.conditions.complex.find(row=>row.name==='Benommen').level,2);assert.equal(saved.conditions.complex.find(row=>row.name==='Wut').level,1);assert.equal(saved.resources.find(row=>row.name==='AE').value,11);
  console.log('PASS: Retained local edits coexist with fresh untouched energies and newly changed source conditions across repeated imports.');

  if(await page.locator('[data-action="battle"]').count())await page.locator('[data-action="battle"]').click();await page.locator('[name="modifier"]').fill('3');
  await page.locator('[data-action="expand-companions"]').click();await idle();assert.equal(await page.locator('.pp-companion-section[open]').count(),3);
  await page.locator('[name="search"]').fill('Testdämon');assert.equal(await page.locator('.pp-companion-section:not([hidden])').count(),1);
  await page.locator('[data-action="collapse-companions"]').click();await idle();assert.equal(await page.locator('[name="search"]').inputValue(),'');assert.equal(await page.locator('.pp-companion-section[open]').count(),0);assert.equal(await page.locator('[name="modifier"]').inputValue(),'3');
  const messageCount=await page.evaluate(()=>testMessages.length);await page.locator('.pp-companion-quick [data-check="animals:0:0:attack"]').click();await idle();assert.equal(await page.evaluate(()=>testMessages.length),messageCount+1);assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  console.log('PASS: Expand/collapse preserves the next modifier, collapse clears temporary search expansion and quick rolls keep companions closed.');

  for(const theme of ['fantasy','ork','dark','light','demonic','aristocrat','warrior','arcane','sneaky']){
    if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption(theme);await page.locator(`.pp-root[data-theme="${theme}"]`).waitFor();
    await page.evaluate(()=>{for(const app of foundry.applications.api.ApplicationV2.instances())app.setPosition({width:440,height:580});});assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,theme);
    await energy().click();assert.equal(await page.locator('.mock-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,theme);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  }
  console.log('PASS: Direct energy editing and compact fold controls fit all nine themes at a narrow width.');

  if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption('fantasy');await page.locator('.pp-root[data-theme="fantasy"]').waitFor();
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('.pp-root').screenshot({path:path.resolve(root,'../artifacts/optimierung-1.9.0.png')});
  await energy().click();await page.locator('.mock-dialog').screenshot({path:path.resolve(root,'../artifacts/begleiterenergie-1.9.0.png')});await page.locator('.mock-dialog [data-action="reset"]').click();await idle();
  saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);assert.equal(saved.retinue.find(row=>row.InventoryId==='old-skeleton').CurrentLe,14);assert.equal(saved.conditions.complex.find(row=>row.name==='Schmerz').level,1);
  console.log('PASS: Reset from the creature shortcut restores only that companion while retaining the main character condition.');

  const large=structuredClone(raw);large.Name='Großes Testgefolge';large.Animals=Array.from({length:100},(_,index)=>({...structuredClone(raw.Animals[0]),Name:`Trupp ${index}`,InventoryId:`bench-${index}`}));large.Demons=[];large.Undead=[];
  await upload(large);const largeId=await page.locator('[name="actor"]').inputValue();if(await page.locator('[data-action="battle"]').count())await page.locator('[data-action="battle"]').click();
  assert.equal(await page.locator('.pp-companion-section').count(),100);await page.locator('[name="search"]').fill('Trupp 57');assert.equal(await page.locator('.pp-companion-section:not([hidden])').count(),1);
  const filterMs=await page.evaluate(()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0],start=performance.now();app.filterChecks();return performance.now()-start;});
  await page.getByRole('button',{name:'Energien von Trupp 57 bearbeiten',exact:true}).click();await minus().click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  const members=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue,largeId);assert.equal(members.find(row=>row.InventoryId==='bench-57').CurrentLe,13);assert.ok(members.filter(row=>row.InventoryId!=='bench-57').every(row=>row.CurrentLe===14));
  await page.locator('[data-action="collapse-companions"]').click();await idle();assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  console.log(`PASS: One hundred companions filter and edit independently; observed local filter call ${filterMs.toFixed(1)} ms.`);

  await page.evaluate(()=>{for(const actor of game.actors.contents)actor.isOwner=false;});await page.evaluate(async()=>{for(const app of foundry.applications.api.ApplicationV2.instances())await app.render({force:true});});
  assert.equal(await page.locator('[data-action="companion-state"]:not([disabled])').count(),0);await page.locator('[data-action="expand-companions"]').click();await idle();assert.equal(await page.locator('.pp-companion-section[open]').count(),100);
  assert.deepEqual(errors,[]);console.log('PASS: Observers can fold their view but cannot edit energies; no browser errors occurred.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
