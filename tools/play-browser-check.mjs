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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.5.0 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
  const action=async name=>{if(!await page.locator(`[data-action="${name}"]`).isVisible()){if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();}await page.locator(`[data-action="${name}"]`).click();};
  const upload=async(raw,{destination='',keepConditions=true,keepResources=true}={})=>{
    await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'Test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))});
    await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);
    await page.locator('[name="destination"]').selectOption(destination);await page.locator('.mock-dialog [data-action="import"]').click();
    await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));
    if(await page.locator('.pp-import-diff').count()){
      if(await page.locator('[name="keepLocalConditions"]').count())await page.locator('[name="keepLocalConditions"]').setChecked(keepConditions);
      if(await page.locator('[name="keepLocalResources"]').count())await page.locator('[name="keepLocalResources"]').setChecked(keepResources);
      await page.locator('.mock-dialog [data-action="accept"]').click();
    }
    await idle();
  };
  const raw=retinueFixture();raw.Name='Testheld';raw.MeleeWeapons[0].Damage='1W6+2';raw.AcademicSkills[0].Subskills[0].Description='Kartographische Kenntnisse';raw.AcademicSkills[0].Subskills[0].Range='Sicht';
  raw.MeleeWeapons[0].Handedness='Einhändig';Object.assign(raw.ParryWeapons[0],{InventoryItemId:'shield',Handedness:'Einhändig'});
  await upload(raw);const actorId=await page.locator('[name="actor"]').inputValue();
  await page.locator('[data-action="battle"]').click();
  assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  await page.locator('[name="modifier"]').fill('2');let before=await page.evaluate(()=>testMessages.length);
  await page.locator('.pp-companion-quick [data-check="animals:0:0:attack"]').click();await idle();
  assert.equal(await page.evaluate(()=>testMessages.length),before+1);assert.equal(await page.locator('.pp-companion-section[open]').count(),0);assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
  console.log('PASS: A closed companion exposes a normal quick roll, consumes exactly one modifier and stays closed.');

  const sourceBefore=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').sourceJSON,actorId);
  await action('playstate');await page.locator('[data-complex="0"]').fill('1');await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('12');await page.locator('[data-resource-row="1"][data-energy="LE"]').fill('3');
  await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  let saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.equal(saved.resources[0].value,12);assert.equal(saved.retinue[0].CurrentLe,3);assert.equal(saved.checks.find(row=>row.name==='Geographie').value,6);assert.equal(saved.sourceJSON,sourceBefore);
  assert.match(await page.locator('.pp-companion-section').first().textContent(),/LE 3 \/ 20/);
  console.log('PASS: Local conditions and root/companion energy changes update visible values while the imported file stays byte-identical.');

  await action('playstate');await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('1');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').resources[0].value,actorId),12);
  await action('playstate');await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('2');await page.evaluate(async id=>{const actor=game.actors.get(id),data=structuredClone(actor.getFlag('pedipalpus-foundry','character'));data.profile.notes='Gleichzeitige Änderung';await actor.setFlag('pedipalpus-foundry','character',data);},actorId);await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  assert.match(await page.locator('.pp-feedback').textContent(),/inzwischen geändert/);assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').profile.notes,actorId),'Gleichzeitige Änderung');
  console.log('PASS: Cancellation keeps state; a concurrent character edit rejects the stale dialog without overwriting it.');

  raw.CurrentLE=30;raw.AcademicSkills[0].Subskills[0].TotalValue=9;raw.Animals.unshift({...raw.Animals[0],InventoryId:'other-skeleton',Name:'Andere Wache',CurrentLe:18});
  await upload(raw,{destination:actorId});saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.equal(saved.resources[0].value,12);assert.equal(saved.retinue.find(row=>row.InventoryId==='old-skeleton').CurrentLe,3);assert.equal(saved.retinue.find(row=>row.InventoryId==='other-skeleton').CurrentLe,18);assert.equal(saved.checks.find(row=>row.name==='Geographie').value,7);
  raw.CurrentLE=29;await upload(raw,{destination:actorId,keepConditions:false,keepResources:false});saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);
  assert.equal(saved.localState,undefined);assert.equal(saved.resources[0].value,29);assert.equal(saved.retinue.find(row=>row.InventoryId==='old-skeleton').CurrentLe,14);assert.equal(saved.checks.find(row=>row.name==='Geographie').value,9);
  console.log('PASS: Reimport explicitly keeps or replaces local states; reordered creatures retain their own identities and newly added creatures keep source values.');

  if(await page.locator('[data-action="full"]').count())await page.locator('[data-action="full"]').click();await page.locator('[name="search"]').fill('Geographie');
  await page.locator('[data-check-id="AcademicSkills:0:0"] [data-action="info"]').click();assert.match(await page.locator('.mock-dialog').textContent(),/Kartographische Kenntnisse/);await page.locator('[name="abilityNote"]').fill('<script>Persönliche Notiz</script>');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  await page.locator('[data-check-id="AcademicSkills:0:0"] [data-action="info"]').click();assert.equal(await page.locator('[name="abilityNote"]').inputValue(),'<script>Persönliche Notiz</script>');assert.equal(await page.locator('.mock-dialog script').count(),0);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  console.log('PASS: Ability information comes from source fields; a personal note is escaped and survives reopening.');

  await page.locator('[name="search"]').fill('');await page.locator('[data-action="battle"]').click();await page.locator('[name="modifier"]').fill('4');before=await page.evaluate(()=>testMessages.length);
  await page.locator('[data-action="damage"][data-check="combat:MeleeWeapons:0:attack"][data-blind="false"]').click();await idle();
  assert.equal(await page.evaluate(()=>testMessages.length),before+1);assert.equal(await page.evaluate(()=>testMessages.at(-1).testDamage),true);assert.equal(await page.locator('[name="modifier"]').inputValue(),'4');
  await page.locator('[data-action="damage"][data-check="combat:MeleeWeapons:0:attack"][data-blind="true"]').click();await idle();assert.equal(await page.evaluate(()=>testMessages.at(-1).testMode),'blind');assert.equal(await page.locator('[name="modifier"]').inputValue(),'4');
  console.log('PASS: Normal and blind damage rolls post through the Foundry dice path and leave the next skill modifier untouched.');

  await action('weapons');await page.locator('[name="setName"]').fill('Duell');await page.locator('[data-set-weapon="0"]').check();await page.locator('[name="setOffHand"]').selectOption('shield');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  const setId=await page.locator('[data-weapon-set] option').last().getAttribute('value');await page.locator('[data-weapon-set]').selectOption(setId);await idle();
  assert.equal(await page.locator('[data-check-id="combat:RangedWeapons:0:ranged"]').count(),0);assert.equal(await page.locator('.pp-companion-section').count(),4);
  saved=await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character'),actorId);assert.equal(saved.localState.offHand,'shield');assert.equal(saved.checks.find(row=>row.id==='combat:MeleeWeapons:0:parry').combat.weaponModifier,4);
  await page.locator('[data-weapon-set]').selectOption('');await idle();assert.equal(await page.locator('[data-check-id="combat:RangedWeapons:0:ranged"]').count(),1);
  console.log('PASS: A personal weapon set filters own weapons, keeps all companions and applies its selected off hand exactly once.');

  await action('preferences');await page.locator('[name="textScale"]').selectOption('130');await page.locator('[name="highContrast"]').check();await page.locator('[name="calmRows"]').check();await page.locator('[name="rememberFigureTheme"]').check();await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption('demonic');await page.locator('.pp-root[data-theme="demonic"]').waitFor();
  assert.equal(await page.locator('.pp-root').getAttribute('data-high-contrast'),'true');assert.equal(await page.locator('.pp-root').getAttribute('data-calm-rows'),'true');
  const globalTheme=await page.evaluate(()=>game.settings.get('pedipalpus-foundry','design'));assert.equal(globalTheme,'fantasy');
  const second={...retinueFixture(),Name:'Andere Figur'};await upload(second);assert.equal(await page.locator('.pp-root').getAttribute('data-theme'),'fantasy');await page.locator('[name="actor"]').selectOption(actorId);await idle();assert.equal(await page.locator('.pp-root').getAttribute('data-theme'),'demonic');
  for(const theme of ['fantasy','ork','dark','light','demonic','aristocrat','warrior','arcane','sneaky']){
    if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption(theme);await page.locator(`.pp-root[data-theme="${theme}"]`).waitFor();await page.evaluate(()=>{for(const app of foundry.applications.api.ApplicationV2.instances())app.setPosition({width:440,height:580});});
    assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,theme);
  }
  console.log('PASS: Text scaling, calm surfaces and contrast fit all nine themes at 440px; personal figure themes do not alter the global fallback.');

  await action('import');const batch=retinueFixture();batch.Name='Bildimport';batch.MeleeWeapons[0].Damage='1W6+2';await page.locator('[name="characterFile"]').setInputFiles({name:'Bildimport.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(batch))});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="destination"]').selectOption('');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOYmWb8HwAFAAIyPExoIAAAAABJRU5ErkJggg==','base64');
  await page.locator('[name="companionPictures"]').setInputFiles([{name:'Skelett.png',mimeType:'image/png',buffer:png},{name:'Testdämon.png',mimeType:'image/png',buffer:png}]);
  assert.equal(await page.locator('[data-companion-import-index="0"]').inputValue(),'new');assert.equal(await page.locator('[data-companion-import-index="1"]').inputValue(),'new');
  const actorCount=await page.evaluate(()=>game.actors.contents.length);await page.locator('.mock-dialog [data-action="import"]').click();await idle();
  assert.equal(await page.evaluate(()=>game.actors.contents.length),actorCount+3);const parentId=await page.locator('[name="actor"]').inputValue();
  const children=await page.evaluate(id=>game.actors.contents.filter(row=>row.getFlag('pedipalpus-foundry','companion')?.sourceActorId===id).map(row=>({id:row.id,img:row.img,token:row.prototypeToken.texture.src,key:row.getFlag('pedipalpus-foundry','companion').key})),parentId);
  assert.equal(children.length,2);assert.ok(children.every(row=>row.img!==row.token&&row.img!=='icons/svg/mystery-man.svg'));
  await page.locator('[name="actor"]').selectOption(children[0].id);await idle();await action('playstate');assert.equal(await page.locator('[data-complex]').count(),0);await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('5');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').resources[0].value,children[0].id),5);
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue[0].CurrentLe,parentId),5);
  assert.equal(await page.evaluate(id=>game.actors.get(id).img,children[0].id),children[0].img);
  await page.locator('[name="actor"]').selectOption(parentId);await idle();await action('playstate');await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('9');await page.locator('.mock-dialog [data-action="save"]').click();await idle();
  await page.locator('[name="actor"]').selectOption(children[0].id);await idle();await action('playstate');await page.locator('.mock-dialog [data-action="reset"]').click();await idle();
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').resources[0].value,children[0].id),14);
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').resources[0].value,parentId),9);
  console.log('PASS: Batch companion pictures create only selected linked actors with separate round tokens; energy edits from a child update the parent and preserve its art.');

  await page.locator('[name="actor"]').selectOption(parentId);await idle();await page.evaluate(()=>{for(const app of foundry.applications.api.ApplicationV2.instances())app.setPosition({width:560,height:650});});
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('.pp-root').screenshot({path:path.resolve(root,'../artifacts/spielkomfort-1.8.0.png')});
  await page.evaluate(()=>{for(const actor of game.actors.contents)actor.isOwner=false;});await page.evaluate(async()=>{for(const app of foundry.applications.api.ApplicationV2.instances())await app.render({force:true});});
  assert.equal(await page.locator('[data-action="playstate"]').isDisabled(),true);assert.ok(await page.locator('[data-action="roll"]:not([disabled])').count()===0);
  assert.deepEqual(errors,[]);
  console.log('PASS: Observers cannot change state or roll; no browser errors occurred throughout the new workflows.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
