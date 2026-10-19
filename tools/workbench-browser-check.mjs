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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.2.0 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
  const admin=async()=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();};
  const action=async name=>{await admin();await page.locator(`[data-action="${name}"]`).click();};
  const upload=async(raw,{destination,comparison='accept',keepFocus=false}={})=>{
    await action('import');
    await page.locator('[name="characterFile"]').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))});
    await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);
    if(destination!==undefined)await page.locator('[name="destination"]').selectOption(destination);
    await page.locator('.mock-dialog [data-action="import"]').click();
    await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));
    if(await page.locator('.pp-import-diff').count()){
      if(keepFocus)await page.locator('[name="keepFocus"]').check();
      await page.locator(`.mock-dialog [data-action="${comparison}"]`).click();
    }
    await page.waitForFunction(()=>!document.querySelector('.mock-dialog'));
    await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
  };
  const pref=async values=>{
    await action('preferences');
    for(const[name,value]of Object.entries(values)){
      const field=page.locator(`.mock-dialog [name="${name}"]`);
      if(typeof value==='boolean')await field.setChecked(value);
      else if(name==='volume')await field.evaluate((element,value)=>{element.value=value;},String(value));
      else await field.selectOption(value);
    }
    await page.locator('.mock-dialog [data-action="save"]').click();
    await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
  };
  const theme=async value=>{await admin();await page.locator('[name="theme"]').selectOption(value);await page.locator(`.pp-root[data-theme="${value}"]`).waitFor();};
  const visible=()=>page.locator('.pp-check-row:not([hidden])');
  const raw=combatFixture();await upload(raw);
  assert.equal(await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench').sound),true);
  assert.equal(await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench').volume),0.25);
  await page.waitForFunction(()=>previewAudioEvents.includes(0.04));
  assert.equal(await page.locator('[name="focus"]').count(),0);
  assert.equal(await page.locator('[name="category"] option[value="combat"]').count(),0);
  assert.equal(await page.locator('[name="category"] option[value="animals"]').count(),0);
  assert.equal(await visible().evaluateAll(rows=>rows.some(row=>['combat','animals'].includes(row.dataset.category))),false);
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  assert.equal(await page.locator('.pp-administration').isVisible(),false);
  const spaceClosed=(await page.locator('.pp-check-list').boundingBox()).height;
  await admin();const spaceOpen=(await page.locator('.pp-check-list').boundingBox()).height;
  assert.ok(spaceClosed>spaceOpen+25,'Collapsed tools must gain usable list height');
  await page.locator('[data-action="administration"]').click();
  console.log('PASS: Administrative controls collapse and gain actual list space.');

  await page.locator('[name="search"]').fill('Geographie');
  await visible().locator('[data-action="favorite"]').click();
  const panel=page.locator('.pedipalpus-app');
  const beforeBattle=await panel.boundingBox();
  await page.locator('[data-action="battle"]').click();
  assert.deepEqual(await panel.boundingBox(),beforeBattle,'Combat panel keeps the same size and position');
  await page.locator('[data-action="full"]').first().click();
  assert.deepEqual(await panel.boundingBox(),beforeBattle,'Returning from combat keeps the same size and position');
  assert.equal(await page.locator('[name="category"] option[value="recent"]').count(),0);
  const quick=page.locator('.pp-quick-check').first();
  assert.ok((await quick.boundingBox()).width<=151);
  assert.equal(await quick.locator('[data-action="favorite"]').count(),1);
  await quick.locator('[data-action="favorite"]').click();
  assert.equal(await page.locator('.pp-quick-check').count(),0);
  await page.locator('[name="search"]').fill('Geographie');
  await visible().locator('[data-action="favorite"]').click();
  assert.equal(await page.locator('.pp-quick-check').count(),1);
  assert.ok((await page.locator('.pp-quick-check').first().boundingBox()).width<=151);
  await pref({language:'ork'});await theme('ork');
  await page.locator('[name="search"]').fill('Mut');
  assert.match(await visible().locator('.pp-check-name').textContent(),/Keine Angst/);
  assert.equal(await visible().locator('.pp-original-name').textContent(),'Mut');
  await admin();assert.equal(await page.locator('[name="theme"] option[value="demonic"]').textContent(),'Dämonisch');
  await pref({language:'standard'});await theme('fantasy');
  await page.locator('[name="search"]').fill('Geographie');
  const categoryColor=await visible().evaluate(row=>({icon:getComputedStyle(row.querySelector('.pp-category-icon')).color,stripe:getComputedStyle(row.querySelector('td')).borderLeftColor}));
  assert.equal(categoryColor.icon,'rgb(52, 120, 188)');assert.equal(categoryColor.stripe,categoryColor.icon);
  assert.equal(await page.locator('.pp-blind-button .pp-blind-eye').count(),await page.locator('.pp-blind-button').count());
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/favoriten-1.2.0.png')});
  console.log('PASS: Compact quickbar removal, Ork attributes/original names, unmodified theme names, colored category stripe and blind-eye icons.');
  await page.locator('[data-action="battle"]').click();
  await page.locator('[name="search"]').fill('Rapier');
  await visible().locator('[data-action="favorite"]').first().click();
  await page.locator('[name="category"]').selectOption('favorites');
  assert.equal(await visible().count(),1);
  const favoriteOrder=await page.locator('.pp-quick-check').evaluateAll(rows=>rows.map(row=>row.textContent));
  const messageCount=await page.evaluate(()=>testMessages.length);
  await visible().locator('[data-action="roll"][data-blind="false"]').last().click();
  await page.waitForFunction(count=>testMessages.length===count+1,messageCount);
  assert.deepEqual(await page.locator('.pp-quick-check').evaluateAll(rows=>rows.map(row=>row.textContent)),favoriteOrder);
  assert.equal(await page.locator('[name="category"] option[value="recent"]').count(),0);
  console.log('PASS: Personal favorites, removed recent tab and stable favorite order after rolling.');

  await page.locator('[name="category"]').selectOption('combat');
  assert.equal(await page.locator('.pp-weapon-header:not([hidden])').count(),3);
  assert.equal(await visible().count(),5);
  const beforeFocusSamples=await page.evaluate(()=>previewSamples.length);
  const focus=page.locator('[name="focus"]');await focus.focus();await page.keyboard.press('End');
  await page.waitForFunction(before=>previewSamples.length>before,beforeFocusSamples);
  await page.waitForFunction(()=>game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').combat.offDefOffset===4);
  assert.equal(await page.locator('[data-check-id="combat:MeleeWeapons:0:attack"] .pp-rating').textContent(),'11');
  assert.equal(await page.locator('[data-check-id="combat:MeleeWeapons:0:parry"] .pp-rating').textContent(),'4');
  assert.equal(await page.locator('[data-check-id="combat:RangedWeapons:0:ranged"] .pp-rating').textContent(),'8');
  const next=combatFixture();next.Name='Neuer Import';next.AcademicSkills[0].Subskills[0].TotalValue=9;
  next.MeleeWeapons.unshift({...next.MeleeWeapons[0],Name:'Dolch'});
  await upload(next,{comparison:'cancel'});
  assert.equal(await page.evaluate(()=>game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').profile.name),'Testcharakter');
  await upload(next,{keepFocus:true});
  assert.equal(await page.evaluate(()=>game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').combat.offDefOffset),4);
  await page.locator('[name="category"]').selectOption('favorites');
  assert.equal(await visible().count(),1);
  assert.equal(await visible().evaluateAll(rows=>rows.some(row=>row.dataset.checkId==='combat:MeleeWeapons:1:attack')),true);
  const ref=await page.evaluate(async()=>{
    const {checkReference}=await import('/scripts/workbench.js');
    return checkReference(game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').checks.find(check=>check.name==='Geographie'));
  });
  const beforeMacro=await page.evaluate(()=>testMessages.length);
  await page.evaluate(reference=>Hooks.call('hotbarDrop',null,{type:'PedipalpusCheck',actorId:'actor-1',reference},4),ref);
  await page.waitForFunction(()=>testMacros.length===1&&testHotbar.length===1);
  const macro=await page.evaluate(()=>testMacros[0]);
  assert.equal(macro.type,'script');assert.equal(macro.ownership.player,3);assert.equal(await page.evaluate(()=>testHotbar[0].slot),4);
  assert.doesNotMatch(macro.command,/AcademicSkills:|skillValue/);
  await page.evaluate(async()=>{game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').checks.find(check=>check.name==='Geographie').value=12;await(new Function(`return (async()=>{${testMacros[0].command}})()`))();});
  await page.waitForFunction(count=>testMessages.length===count+1,beforeMacro);
  assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Qualität: <strong>9<\/strong>/);
  await page.evaluate(async()=>{
    const {checkReference}=await import('/scripts/workbench.js');
    const check=game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').checks.find(item=>item.id==='combat:MeleeWeapons:1:attack');
    await game.modules.get('pedipalpus-foundry').api.roll({actorId:'actor-1',reference:checkReference(check),modifier:2});
  });
  assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'battle');
  assert.match(await page.evaluate(()=>testMessages.at(-1).content),/<span>Erschwernis<\/span>\s*<strong>-2<\/strong>/);
  await page.evaluate(async reference=>{await game.modules.get('pedipalpus-foundry').api.roll({actorId:'actor-1',reference});},ref);
  assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'full');
  assert.equal(await page.locator('[name="focus"]').count(),0);
  const denied=await page.evaluate(async reference=>{
    game.actors.get('actor-1').isOwner=false;
    try{await game.modules.get('pedipalpus-foundry').api.roll({actorId:'actor-1',reference});return false;}catch(error){return /Besitzerrechte/.test(error.message);}finally{game.actors.get('actor-1').isOwner=true;}
  },ref);assert.equal(denied,true);
  const ambiguous=await page.evaluate(async reference=>{
    const actor=game.actors.get('actor-1'),snapshot=actor.getFlag('pedipalpus-foundry','character');
    const check=snapshot.checks.find(item=>item.name==='Geographie'),before=testMessages.length;
    snapshot.checks.push({...check,id:'AcademicSkills:duplicate:0'});
    try{await game.modules.get('pedipalpus-foundry').api.roll({actorId:'actor-1',reference});return false;}
    catch(error){return /mehrdeutig/.test(error.message)&&testMessages.length===before;}
    finally{snapshot.checks.pop();}
  },ref);assert.equal(ambiguous,true);
  await page.evaluate(reference=>{
    foundry.documents.Macro.canUserCreate=()=>false;Hooks.call('hotbarDrop',null,{type:'PedipalpusCheck',actorId:'actor-1',reference},5);
  },ref);
  await page.waitForFunction(()=>notifications.some(item=>item.message.includes('Erstellen von Makros')));
  assert.equal(await page.evaluate(()=>testMacros.length),1);
  await page.evaluate(()=>{foundry.documents.Macro.canUserCreate=()=>true;});
  console.log('PASS: Import cancellation, focus retained, favorites follow semantic identities after array insertion; hotbar resolves current values and rights.');

  await page.locator('[name="modifier"]').fill('2');await page.locator('[name="modifierDirection"]').hover();
  await page.mouse.wheel(0,100);await page.waitForFunction(()=>document.querySelector('[name="modifier"]').value==='1');
  await page.mouse.wheel(0,100);await page.waitForFunction(()=>document.querySelector('[name="modifier"]').value==='0');
  await page.mouse.wheel(0,100);await page.waitForFunction(()=>document.querySelector('[name="modifier"]').dataset.mode==='relief');
  assert.equal(await page.locator('[name="modifier"]').inputValue(),'1');
  await page.waitForFunction(()=>previewSamples.some(duration=>[.061,.064,.065].some(target=>Math.abs(duration-target)<1e-6)));
  await upload({...combatFixture(),Name:'Zweiter Charakter'},{destination:''});
  await page.locator('[name="modifier"]').fill('5');await page.locator('[name="actor"]').selectOption('actor-1');
  assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
  console.log('PASS: Wheel over direction label crosses zero; character switch consumes no stale modifier.');

  await admin();assert.equal(await page.locator('[data-action="presets"]').count(),0);
  console.log('PASS: Presets option removed from tools.');

  await pref({language:'standard',animations:'none',sound:false});await theme('ork');
  const mutedBefore=await page.evaluate(()=>previewAudioEvents.length);
  await page.locator('[name="modifierDirection"]').click();
  assert.equal(await page.evaluate(()=>previewAudioEvents.length),mutedBefore);
  await page.locator('[name="modifier"]').fill('0');
  assert.equal(await page.locator('[data-action="import"]').textContent(),'JSON importieren');
  await pref({language:'ork',sound:true,volume:0});await theme('fantasy');
  assert.equal(await page.locator('[data-action="import"]').textContent(),'Blatt holen');
  const sound=await page.evaluate(async()=>{
    const {playFeedback}=await import('/scripts/feedback.js');
    return {off:await playFeedback('roll',{sound:false,volume:1}),zero:await playFeedback('roll',{sound:true,volume:0}),on:await playFeedback('roll',{sound:true,volume:.1})};
  });assert.deepEqual(sound,{off:false,zero:false,on:true});
  assert.equal(await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench').animations),'none');
  assert.equal(await page.locator('.pp-root').getAttribute('data-animations'),'false');
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
  await page.locator('[name="category"]').selectOption('combat');await focus.focus();await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(()=>document.querySelector('.pp-root').dataset.ppAnimations==='off');
  assert.equal(await page.locator('.pp-root').getAttribute('data-theme'),'fantasy');
  assert.equal(await page.locator('[data-focus="off"]').textContent(),'Hau +3');
  assert.equal(await page.locator('[data-focus="def"]').textContent(),'Block -3');
  assert.match(await page.locator('[data-check-id="combat:MeleeWeapons:1:attack"] .pp-single-probe').getAttribute('title'),/Kampf-Laune 3/);
  assert.equal(await page.locator('.pp-feedback').evaluate(el=>getComputedStyle(el).animationName),'none');
  console.log('PASS: Language independent from appearance; sound off, enabled and zero-volume; feedback with animation disabled.');

  await pref({language:'standard',animations:'subtle',sound:false});
  await page.locator('[data-action="full"]').first().click();
  await page.locator('[name="category"]').selectOption('all');await page.locator('[name="search"]').fill('Geographie');
  const keyboard=await page.evaluate(()=>game.keybindings.bindings.get('pedipalpus-foundry.ring').onDown());
  assert.equal(keyboard,false);assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'full');
  await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.pp-check-row:not([hidden]) [data-action="roll"]').first().evaluate(el=>el===document.activeElement),true);
  await page.locator('[name="search"]').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('[name="search"]').inputValue(),'');
  await fs.mkdir(path.resolve(root,'../pedipalpus-checks/foundry-ui'),{recursive:true});
  for(const name of ['Mut','Klugheit','Intuition','Gewandtheit','Konstitution']){
    await page.locator('[name="search"]').fill(name);await visible().locator('[data-action="favorite"]').first().click();
  }
  await page.locator('[data-action="battle"]').click();assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'battle');
  assert.equal(await visible().evaluateAll(rows=>rows.every(row=>['combat','animals'].includes(row.dataset.category))),true);
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/kampfbrett-1.2.0.png')});
  await page.locator('[data-action="full"]').click();
  await page.locator('[data-action="ring"]').click();assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'ring');
  assert.equal(await page.locator('.pp-ring-card').count(),6);
  assert.equal(await page.locator('.pp-ring').evaluate(el=>getComputedStyle(el).display),'block');
  const ringGeometry=await page.locator('.pp-ring').evaluate(ring=>{
    const viewport=ring.closest('.pp-check-list').getBoundingClientRect();
    const cards=Array.from(ring.querySelectorAll('.pp-ring-card')).map(card=>card.getBoundingClientRect());
    return {clipped:cards.filter(card=>card.top<viewport.top-1||card.bottom>viewport.bottom+1||card.left<viewport.left-1||card.right>viewport.right+1).length,
      overlaps:cards.flatMap((a,i)=>cards.slice(i+1).filter(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)).length};
  });
  assert.deepEqual(ringGeometry,{clipped:0,overlaps:0},'Six ring cards must be visible and must not cover each other');
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/probenring-1.2.0.png')});
  await pref({language:'ork'});await theme('ork');
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  assert.equal(await page.locator('.pp-ring-card[data-check-id^="AcademicSkills"] .pp-original-name').textContent(),'Geographie');
  const orkOverlap=await page.locator('.pp-ring-card').evaluateAll(cards=>{
    const bounds=cards.map(card=>card.getBoundingClientRect());
    return bounds.flatMap((a,i)=>bounds.slice(i+1).filter(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)).length;
  });
  assert.equal(orkOverlap,0,'Original-name captions must not make ring cards cover each other');
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/probenring-1.2.0-ork.png')});
  await pref({language:'standard'});await theme('fantasy');
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('[data-action="full"]').first().click();assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'full');
  console.log('PASS: Shortcuts leave text inputs alone, search keyboard navigation, battle/ring and return to full view.');

  await admin();assert.equal(await page.locator('[data-action="export"]').count(),1,'Export must be reachable from administration');
  const downloadPromise=page.waitForEvent('download');
  // The public administration export action must generate a readable package.
  await action('export');const download=await downloadPromise;const bundleBytes=await fs.readFile(await download.path());
  const bundle=await page.evaluate(async bytes=>{
    const{readCharacterFile}=await import('/scripts/bundle.js');const result=await readCharacterFile(new File([new Uint8Array(bytes)],'export.zip',{type:'application/zip'}));return JSON.parse(result.json);
  },[...bundleBytes]);assert.equal(bundle.Name,'Neuer Import');assert.equal(bundle.OffDefOffset,3);assert.equal(bundle.OffOffset,3);assert.equal(bundle.DefOffset,-3);
  await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'export.zip',mimeType:'application/zip',buffer:bundleBytes});
  await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);
  await page.locator('[name="destination"]').selectOption('');await page.locator('.mock-dialog [data-action="import"]').click();
  await page.waitForFunction(()=>game.actors.contents.length===3);
  assert.equal(await page.evaluate(()=>game.actors.get('actor-3').getFlag('pedipalpus-foundry','character').combat.offDefOffset),3);
  console.log('PASS: Synthetic JSON import, UI ZIP export with current focus, package import into new character.');
  const portraitPackage=await page.evaluate(async raw=>{
    const {writeCharacterBundle}=await import('/scripts/bundle.js');
    const binary=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOYmWb8HwAFAAIyPExoIAAAAABJRU5ErkJggg==');
    const file=new File([Uint8Array.from(binary,char=>char.charCodeAt(0))],'portrait.png',{type:'image/png'});
    return [...new Uint8Array(await(await writeCharacterBundle(JSON.stringify(raw),file)).arrayBuffer())];
  },raw);
  await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'portrait-package.zip',mimeType:'application/zip',buffer:Buffer.from(portraitPackage)});
  await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);
  await page.locator('[name="destination"]').selectOption('');await page.locator('.mock-dialog [data-action="import"]').click();
  await page.waitForFunction(()=>game.actors.contents.length===4);
  assert.match(await page.evaluate(()=>game.actors.get('actor-4').img),/pedipalpus-portraits\/[a-f0-9]{64}\.png$/);
  console.log('PASS: ZIP package portrait decoded and applied through the real import UI.');

  await page.locator('[name="actor"]').selectOption('actor-1');
  await page.evaluate(()=>{canvas.tokens.controlled=[{document:{actorId:'actor-2',actorLink:true,name:'Zweiter Token'}}];Hooks.call('controlToken');});
  assert.equal(await page.locator('[name="actor"]').inputValue(),'actor-1');
  await pref({followToken:true});
  await page.evaluate(()=>Hooks.call('controlToken'));
  await page.waitForFunction(()=>document.querySelector('[name="actor"]').value==='actor-2');
  await page.evaluate(()=>{canvas.tokens.controlled=[{document:{actorId:'actor-1',actorLink:true}},{document:{actorId:'actor-2',actorLink:true}}];Hooks.call('controlToken');});
  assert.equal(await page.locator('[name="actor"]').inputValue(),'actor-2');
  await pref({followToken:false,density:'comfortable'});
  assert.equal(await page.locator('.pp-root').getAttribute('data-density'),'comfortable');
  assert.ok((await page.locator('.pp-dice-button').first().boundingBox()).height>=36,'Comfortable density increases the real hit target');
  await pref({density:'normal'});
  await page.evaluate(()=>{canvas.tokens.controlled=[];});await page.locator('[name="actor"]').selectOption('actor-3');
  console.log('PASS: Token following is optional and single-token only; comfortable density can be selected.');

  await fs.mkdir(path.resolve(root,'../pedipalpus-checks/foundry-ui'),{recursive:true});
  await pref({language:'theme'});
  for(const mode of ['fantasy','ork','dark','light','warrior','arcane','sneaky','aristocrat','demonic']){
    await theme(mode);if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
    if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
    await page.locator('[name="category"]').selectOption('combat');
    await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,`../pedipalpus-checks/foundry-ui/workbench-1.2.0-${mode}.png`)});
    await page.setViewportSize({width:440,height:760});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const app=await page.locator('.pedipalpus-app').boundingBox(),footer=await page.locator('.pp-check-list').boundingBox();
    assert.ok(footer.y+footer.height<=app.y+app.height+1,`${mode} footer fits`);
    assert.ok((await page.locator('.pp-check-list').boundingBox()).height>150,`${mode} leaves useful scroll area`);
    await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,`../pedipalpus-checks/foundry-ui/workbench-1.2.0-${mode}-schmal.png`)});
    await page.setViewportSize({width:1460,height:1000});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: All nine themes at normal and narrow widths, no page errors.');
  for(const [design,selector] of [['warrior','.pp-warrior-ornament'],['arcane','.pp-rune-orbit'],['sneaky','.pp-poison-glow']]){
    await theme(design);assert.notEqual(await page.locator(selector).evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});await pref({animations:'none'});assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).animationName),'none');
    await pref({animations:'subtle'});
  }
  await theme('aristocrat');
  const gem=page.locator('.pp-royal-crest .pp-cut-gem').first();
  assert.equal(await gem.evaluate(el=>getComputedStyle(el).animationName),'pp-jewel-glow');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await gem.evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});await pref({animations:'none'});
  assert.equal(await gem.evaluate(el=>getComputedStyle(el).animationName),'none');
  await pref({animations:'subtle'});await theme('demonic');
  const fire=page.locator('.pp-infernal-fire');
  assert.equal(await fire.evaluate(el=>getComputedStyle(el).animationName),'pp-fire-turn');
  const initialTurn=await fire.evaluate(el=>getComputedStyle(el).transform);
  await page.waitForFunction(initial=>getComputedStyle(document.querySelector('.pp-infernal-fire')).transform!==initial,initialTurn);
  const nameCell=visible().first(),beforeHover=await nameCell.boundingBox();
  await nameCell.hover();assert.ok(await nameCell.evaluate(el=>Math.abs(parseFloat(getComputedStyle(el,'::after').width)-el.getBoundingClientRect().width)<2));assert.equal(await nameCell.evaluate(el=>getComputedStyle(el,'::after').animationName),'pp-sheen');
  assert.deepEqual(await nameCell.boundingBox(),beforeHover);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await fire.evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await nameCell.evaluate(el=>getComputedStyle(el,'::after').animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await pref({animations:'none'});
  assert.equal(await fire.evaluate(el=>getComputedStyle(el).animationName),'none');
  await nameCell.hover();assert.equal(await nameCell.evaluate(el=>getComputedStyle(el,'::after').animationName),'none');
  await pref({animations:'subtle'});
  console.log('PASS: Real source samples, moving fire, hover without layout shift, reduced motion and animation off.');
  await page.locator('[data-action="full"]').first().click();
  await pref({language:'standard'});
  const personal=await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench'));
  await page.evaluate(()=>{
    const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];
    app.setPosition({width:480,height:440,left:120,top:95});
    // Simulate the shell's drag/resize applying its coordinates to the window.
    Object.assign(app.element.style,{position:'fixed',left:'120px',top:'95px'});
  });
  await page.waitForFunction(()=>{
    const saved=game.settings.get('pedipalpus-foundry','windowState')?.player;
    return saved?.width===480&&saved.height===440&&saved.left===120&&saved.top===95;
  });
  await page.evaluate(async()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await app.close();await game.modules.get('pedipalpus-foundry').api.open();});
  assert.equal(await page.locator('.pedipalpus-app').evaluate(el=>Math.round(el.getBoundingClientRect().width)),480);
  await page.reload();await page.waitForFunction(()=>window.previewReady);
  const geometry=await page.evaluate(()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];return {position:app.position,clamped:app.safePosition({width:480,height:440,left:10000,top:10000})};});
  assert.equal(geometry.position.width,480);assert.equal(geometry.position.height,440);assert.equal(geometry.position.left,120);assert.equal(geometry.position.top,95);
  assert.ok(geometry.clamped.left+geometry.clamped.width<=1460);assert.ok(geometry.clamped.top+geometry.clamped.height<=1000);
  console.log('PASS: Resize and movement auto-save geometry, close/open and reload restore dimensions and requested coordinates, off-screen positions clamp.');
  await page.evaluate(()=>sessionStorage.setItem('preview-user','second-player'));await page.reload();await page.waitForFunction(()=>window.previewReady);
  assert.equal(await page.locator('.pp-root').getAttribute('data-theme'),'fantasy');
  assert.deepEqual(await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench').favorites),{});
  await pref({language:'ork',sound:true,volume:.55});
  await page.evaluate(()=>sessionStorage.setItem('preview-user','player'));await page.reload();await page.waitForFunction(()=>window.previewReady);
  const restored=await page.evaluate(()=>game.settings.get('pedipalpus-foundry','workbench'));
  assert.deepEqual(restored.favorites,personal.favorites);assert.deepEqual(restored.recent,personal.recent);
  assert.equal(restored.language,'standard');assert.equal(restored.sound,false);
  console.log('PASS: Favorites, recent probes and preferences persist across reload and are isolated between users.');
  // Name and value clicks share the normal roll path, including modifiers.
  await upload(combatFixture());
  if(await page.locator('[data-action="full"]').count())await page.locator('[data-action="full"]').first().click();
  await page.locator('[name="search"]').fill('Geographie');
  const namedRow=page.locator('[data-check-id="AcademicSkills:0:0"]');
  for(const target of ['.pp-check-name','.pp-rating']){
    const before=await page.evaluate(()=>testMessages.length);
    await page.locator('[name="modifier"]').fill('2');
    await namedRow.locator(target).click();
    await page.waitForFunction(before=>testMessages.length===before+1,before);
    await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
    assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
    assert.equal(await page.evaluate(()=>Boolean(testMessages.at(-1).blind)),false);
    assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Geographie/);
  }
  const beforeKeyboard=await page.evaluate(()=>testMessages.length);
  await namedRow.locator('.pp-check-name').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(before=>testMessages.length===before+1,beforeKeyboard);
  await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
  if(await namedRow.locator('[data-action="favorite"]').getAttribute('aria-pressed')!=='true')await namedRow.locator('[data-action="favorite"]').click();
  const beforeQuick=await page.evaluate(()=>testMessages.length);
  await page.locator('.pp-quick-check[data-quick-check="AcademicSkills:0:0"] .pp-check-name').click();
  await page.waitForFunction(before=>testMessages.length===before+1,beforeQuick);
  await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
  await page.locator('[data-action="ring"]').click();
  const beforeRing=await page.evaluate(()=>testMessages.length);
  await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-rating').click();
  await page.waitForFunction(before=>testMessages.length===before+1,beforeRing);
  await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
  await page.locator('[data-action="full"]').first().click();
  const beforeDrag=await page.evaluate(()=>testMessages.length);
  const transfer=await page.evaluateHandle(()=>new DataTransfer());
  await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-check-name').dispatchEvent('dragstart',{dataTransfer:transfer});
  await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-check-name').click();
  assert.equal(await page.evaluate(()=>testMessages.length),beforeDrag);
  await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-check-name').dispatchEvent('dragend');
  console.log('PASS: Name/value/keyboard/quickbar/ring clicks post one normal roll and consume the modifier; dragging does not roll.');

  // Additional release checks use only a synthetic character and the privately selected frame pack.
  await upload(combatFixture());
  if(await page.locator('[data-action="full"]').count())await page.locator('[data-action="full"]').first().click();
  await page.locator('[name="modifier"]').fill('0');
  await page.locator('[data-modifier-step="1"]').click();assert.equal(await page.locator('[name="modifier"]').inputValue(),'1');
  await page.locator('[data-modifier-step="-1"]').click();await page.locator('[data-modifier-step="-1"]').click();
  assert.equal(await page.locator('[name="modifier"]').getAttribute('data-mode'),'relief');
  await page.locator('[data-modifier-step="1"]').hover();await page.mouse.wheel(0,-100);
  assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
  const equipped=combatFixture();equipped.Name='Rüstungsprüfung';equipped.Be=2;
  equipped.DerivedValues=Array.from({length:9},(_,index)=>({LongName:'Basiswert',TotalValue:index===8?20:0}));
  equipped.Armors=[{Name:'Kettenhemd',OnPerson:true,IsEquiped:true,Protection:5,BaseMobilityPenalty:2,MobilityPenalty:2,Weight:8,Quantity:1},{Name:'Helm',OnPerson:false,IsEquiped:false,Protection:2,BaseMobilityPenalty:1,MobilityPenalty:1,Weight:2,Quantity:1}];
  equipped.Animals.push({Name:'Pferd',Species:'Pferd',CurrentLe:30,MaxLe:30,Attacks:[]});
  await upload(equipped,{destination:'actor-1'});
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
  await page.locator('[name="category"]').selectOption('animals');assert.match(await page.locator('[data-inventory="animals"]').textContent(),/Wolf.*Pferd/s);
  await page.locator('[name="category"]').selectOption('armors');
  assert.equal(await page.locator('.pp-armor-panel').isVisible(),true);assert.equal(await page.locator('.pp-check-list').isVisible(),false);
  assert.equal(await page.locator('[data-armor="Armors:0"][data-armor-field="equipped"]').isChecked(),true);
  await page.locator('[data-armor="Armors:1"][data-armor-field="equipped"]').check();
  await page.waitForFunction(()=>JSON.parse(game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').sourceJSON).Be===3);
  assert.equal(await page.locator('[data-armor="Armors:1"][data-armor-field="carried"]').isChecked(),true);
  await page.locator('[data-armor="Armors:0"][data-armor-field="carried"]').uncheck();
  await page.waitForFunction(()=>document.querySelector('[data-armor="Armors:0"][data-armor-field="equipped"]')?.checked===false);
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/ruestungen-1.2.0.png')});
  await page.locator('[name="category"]').selectOption('combat');await theme('sneaky');assert.equal(await page.locator('[name="theme"] option[value="sneaky"]').textContent(),'Alchemy');
  const bubbles=page.locator('.pp-acid-bubbles').first();assert.equal(await bubbles.evaluate(el=>getComputedStyle(el).animationName),'pp-acid-bubble');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await bubbles.evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});await pref({animations:'none'});assert.equal(await bubbles.evaluate(el=>getComputedStyle(el).animationName),'none');await pref({animations:'subtle'});
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/alchemy-1.2.0.png')});
  console.log('PASS: Click/wheel hints, animal companions without attacks, imported armor states with live BE updates and bubbling Alchemy with motion off.');
  for(const design of ['fantasy','ork','dark','light','demonic','aristocrat','warrior','arcane','sneaky']){
    await theme(design);await page.locator('[name="category"]').selectOption('armors');
    const checked=page.locator('[data-armor="Armors:1"][data-armor-field="equipped"]');
    const colors=await checked.evaluate(field=>({appearance:getComputedStyle(field).appearance,background:getComputedStyle(field).backgroundColor,accent:getComputedStyle(field).accentColor}));
    assert.equal(colors.appearance,'none');assert.equal(colors.background,colors.accent);assert.notEqual(colors.background,'rgb(0, 117, 255)');
  }
  await theme('sneaky');if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/checkboxen-1.2.0-alchemy.png')});
  console.log('PASS: Checkbox backgrounds and ticks follow all nine designs.');

  if(process.env.PEDIPALPUS_PRIVATE_FRAMES){
    await page.evaluate(()=>{game.user.isGM=true;});await action('preferences');
    await page.locator('[name="tokenFramesZip"]').setInputFiles(process.env.PEDIPALPUS_PRIVATE_FRAMES);
    await page.waitForFunction(()=>document.querySelector('[data-frame-status]')?.textContent==='Originalrahmen importiert.');
    await page.locator('.mock-dialog [data-action="save"]').click();
    const pixels=await page.evaluate(async()=>{
      const {prepareTokenPortrait}=await import('/scripts/tokens.js');
      const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#324c76';ctx.fillRect(0,0,320,320);ctx.fillStyle='#c4a66b';ctx.beginPath();ctx.arc(160,115,58,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(160,285,102,105,0,0,Math.PI*2);ctx.fill();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')),portrait={file:new File([blob],'test.png',{type:'image/png'}),extension:'png'},results=[];
      for(const style of ['concrete','silver-thin','undead']){
        const framed=await prepareTokenPortrait(portrait,style),image=await createImageBitmap(framed.token.file),test=document.createElement('canvas');test.width=test.height=512;const c=test.getContext('2d');c.drawImage(image,0,0);image.close();
        results.push({style,corner:c.getImageData(0,0,1,1).data[3],center:c.getImageData(256,256,1,1).data[3],hasFrame:framed.hasFrame,png:test.toDataURL('image/png')});
      }
      return results;
    });
    for(const item of pixels){assert.equal(item.corner,0);assert.equal(item.center,255);assert.equal(item.hasFrame,true);await fs.writeFile(path.resolve(root,`../pedipalpus-checks/foundry-ui/token-1.2.0-${item.style}.png`),Buffer.from(item.png.split(',')[1],'base64'));}
    const directory=path.resolve(root,'../token-work/test-character-folder');await fs.mkdir(path.join(directory,'SavedCharacters'),{recursive:true});await fs.mkdir(path.join(directory,'CharacterPortraits'),{recursive:true});
    await fs.writeFile(path.join(directory,'SavedCharacters','Rüstungsprüfung.json'),JSON.stringify({...equipped,PortraitFileName:'synthetic.png'}));
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOYmWb8HwAFAAIyPExoIAAAAABJRU5ErkJggg==','base64');await fs.writeFile(path.join(directory,'CharacterPortraits','synthetic.png'),png);
    await action('import');await page.locator('[name="characterFolder"]').setInputFiles(directory);
    await page.waitForFunction(()=>document.querySelector('.pp-portrait-source')?.textContent==='Pedipalpus-Bild automatisch gefunden.');
    await page.locator('[name="destination"]').selectOption('actor-1');await page.locator('.mock-dialog [data-action="import"]').click();await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();
    await page.waitForFunction(()=>game.actors.get('actor-1').prototypeToken?.texture?.src&&game.actors.get('actor-1').prototypeToken.texture.src!==game.actors.get('actor-1').img);
    console.log('PASS: Private original-frame import, three transparent round token renders and folder portrait import with separate portrait/token paths.');
    if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
    await page.locator('[name="category"]').selectOption('animals');await page.locator('[data-action="animal-portrait"][data-animal="0"]').click();
    await page.locator('[name="portraitFile"]').setInputFiles({name:'wolf.png',mimeType:'image/png',buffer:png});
    await page.waitForFunction(()=>document.querySelector('[data-action="animal-image"]')?.disabled===false);
    await page.locator('[name="tokenFrame"]').selectOption('undead');await page.locator('[data-action="animal-image"]').click();
    await page.waitForFunction(()=>game.actors.contents.some(actor=>actor.getFlag('pedipalpus-foundry','companion')?.sourceActorId==='actor-1'));
    const petId=await page.evaluate(()=>game.actors.contents.find(actor=>actor.getFlag('pedipalpus-foundry','companion')?.sourceActorId==='actor-1').id);
    const pet=await page.evaluate(id=>{const actor=game.actors.get(id);return {name:actor.name,img:actor.img,token:actor.prototypeToken.texture.src,link:actor.prototypeToken.actorLink,checks:actor.getFlag('pedipalpus-foundry','character').checks.length,style:actor.getFlag('pedipalpus-foundry','companion').tokenStyle};},petId);
    assert.equal(pet.name,'Wolf');assert.notEqual(pet.img,pet.token);assert.equal(pet.link,true);assert.equal(pet.checks,2);assert.equal(pet.style,'undead');
    await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
    await page.locator('[data-action="animal-portrait"][data-animal="0"]').click();await page.locator('[name="tokenFrame"]').selectOption('silver-thin');await page.locator('[data-action="animal-image"]').click();
    await page.waitForFunction(id=>game.actors.get(id).getFlag('pedipalpus-foundry','companion').tokenStyle==='silver-thin',petId);
    assert.equal(await page.evaluate(()=>game.actors.contents.length),2);
    console.log('PASS: Animal portrait produces an owned linked actor with animal probes; changing frame reuses the same actor.');
    await page.evaluate(raw=>{window.liveCharacter=raw;window.showOpenFilePicker=async()=>[{kind:'file',name:'live-character.json',queryPermission:async()=> 'granted',getFile:async()=>new File([JSON.stringify(window.liveCharacter)],'live-character.json',{type:'application/json'})}];},equipped);
    await action('import');await page.locator('[data-pick-character]').click();await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('.mock-dialog [data-action="import"]').click();
    await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();
    await page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
    await page.evaluate(()=>{window.liveCharacter.HobbySkills[0].Value=3;});
    await action('refresh');await page.waitForFunction(()=>document.querySelector('.pp-import-diff'));
    assert.match(await page.locator('.pp-import-diff').textContent(),/Schach/);await page.locator('.mock-dialog [data-action="accept"]').click();
    await page.waitForFunction(()=>game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').checks.find(check=>check.id==='HobbySkills:0').value===3);
    assert.equal(await page.evaluate(()=>game.actors.contents.length),2);
    console.log('PASS: Refresh re-reads changed bytes from the previous handle, uses import comparison and keeps linked companion actors.');


  }


  // Retinue probes use the actual checks module through the same visible controls.
  const retinue=retinueFixture();await upload(retinue,{destination:'actor-1'});await pref({language:'standard'});await theme('fantasy');
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='battle')await page.locator('[data-action="battle"]').click();
  await page.locator('[name="category"]').selectOption('all');await page.locator('[name="search"]').fill('');
  for(const group of ['animals','demons','undead'])assert.equal(await page.locator(`[data-inventory="${group}"]`).isVisible(),true);
  const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
  for(const [category,id] of [['animals','animals:0:attribute:KL'],['demons','demons:0:0:attack'],['demons','demons:0:0:parry'],['demons','demons:0:1:ranged'],['undead','undead:0:0:ranged'],['undead','undead:0:resistance:MentalMagicResistance']]){
    await page.locator('[name="category"]').selectOption(category);const before=await page.evaluate(()=>testMessages.length);
    await page.locator(`.pp-dice-button[data-check="${id}"][data-blind="false"]`).click();
    await page.waitForFunction(before=>testMessages.length===before+1,before);await idle();
  }
  await page.locator('[name="category"]').selectOption('demons');
  const ability=page.locator('[data-check-id="demons:0:mundane:0"]');await page.locator('[name="modifier"]').fill('3');
  const beforeAbility=await page.evaluate(()=>testMessages.length);await ability.locator('.pp-check-name').click();
  assert.equal(await page.locator('[data-action="companion-check"]').isDisabled(),true);
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  assert.equal(await page.evaluate(()=>testMessages.length),beforeAbility);assert.equal(await page.locator('[name="modifier"]').inputValue(),'3');
  await ability.locator('[data-blind="true"]').click();
  for(const [index,key] of ['MU','MU','KO'].entries())await page.locator(`[name="companionAttribute${index}"]`).selectOption(key);
  await page.locator('[name="companionCheckName"]').fill('Wache überzeugen');
  await page.locator('[data-action="companion-check"]').click();await page.waitForFunction(before=>testMessages.length===before+1,beforeAbility);await idle();
  assert.equal(await page.evaluate(()=>testMessages.at(-1).testMode),'blind');assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Wache überzeugen/);
  assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
  assert.deepEqual(await page.evaluate(()=>game.actors.get('actor-1').getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='demons:0:mundane:0').companionAbility.keys),['MU','MU','KO']);
  await ability.locator('.pp-rating').click();assert.equal(await page.locator('[name="companionAttribute0"]').inputValue(),'MU');assert.equal(await page.locator('[name="companionAttribute2"]').inputValue(),'KO');
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  await page.locator('[name="category"]').selectOption('all');
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  assert.ok((await page.locator('.pp-companion-overviews').boundingBox()).height>=45,'Companion cards must not collapse to their heading');
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/gefolge-1.2.0.png')});
  await page.locator('[name="search"]').fill('Wache');
  assert.equal(await page.locator('[data-inventory="undead"]').isVisible(),true);assert.equal(await page.locator('[data-inventory="demons"]').isVisible(),false);
  await page.locator('[name="search"]').fill('');
  console.log('PASS: All creature groups, own attribute/resistance/melee/parry/ranged rolls, cancelled modifier retention and blind ability selection with remembered duplicate attributes.');

  if(process.env.PEDIPALPUS_PRIVATE_FRAMES){
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOYmWb8HwAFAAIyPExoIAAAAABJRU5ErkJggg==','base64');
    const ids=[];
    for(const [index,group,style] of [[0,'animals','concrete'],[1,'demons','silver-thin'],[2,'undead','undead']]){
      await page.locator('[name="category"]').selectOption(group);await page.locator(`[data-action="animal-portrait"][data-animal="${index}"]`).click();
      await page.locator('[name="portraitFile"]').setInputFiles({name:`${group}.png`,mimeType:'image/png',buffer:png});
      await page.waitForFunction(()=>document.querySelector('[data-action="animal-image"]')?.disabled===false);await page.locator('[name="tokenFrame"]').selectOption(style);await page.locator('[data-action="animal-image"]').click();await idle();
      const item=await page.evaluate(({group,key})=>{const actor=game.actors.contents.find(a=>a.getFlag('pedipalpus-foundry','companion')?.key===key&&a.getFlag('pedipalpus-foundry','companion')?.sourceActorId==='actor-1');return actor?{id:actor.id,img:actor.img,token:actor.prototypeToken.texture.src,linked:actor.prototypeToken.actorLink,group:actor.getFlag('pedipalpus-foundry','character').profile.companionGroup,checks:actor.getFlag('pedipalpus-foundry','character').checks.length}:null;},{group,key:`id:${group==='animals'?'old-skeleton':group==='demons'?'demon-1':'undead-1'}`});
      assert.ok(item);assert.equal(item.linked,true);assert.notEqual(item.img,item.token);assert.ok(item.checks>=11);ids.push(item.id);
    }
    const total=await page.evaluate(()=>game.actors.contents.length);
    await page.locator('[name="actor"]').selectOption(ids[1]);await idle();
    assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'battle');
    await page.locator('[name="category"]').selectOption('demons');
    await page.locator('[data-action="animal-portrait"][data-animal="0"]').click();await page.locator('[name="tokenFrame"]').selectOption('undead');await page.locator('[data-action="animal-image"]').click();await idle();
    assert.equal(await page.evaluate(()=>game.actors.contents.length),total,'Changing the standalone token must not create grandchildren');
    await page.locator('[name="actor"]').selectOption('actor-1');await idle();
    retinue.Demons[0].Attacks[0].AttackValue=23;await upload(retinue,{destination:'actor-1'});
    assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='demons:0:0:attack').value,ids[1]),23);
    assert.equal(await page.evaluate(()=>game.actors.contents.length),total);
    console.log('PASS: Animal, demon and undead framed token actors; standalone image changes reuse the actor and parent reimport refreshes the same linked entries.');
  }
  const beforeClosed=await page.evaluate(()=>testMessages.length);
  await page.evaluate(async()=>{const {checkReference}=await import('/scripts/workbench.js');const actor=game.actors.get('actor-1');window.closedAbility=checkReference(actor.getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='demons:0:mundane:0'));for(const app of foundry.applications.api.ApplicationV2.instances())await app.close();window.closedRoll=game.modules.get('pedipalpus-foundry').api.roll({actorId:'actor-1',reference:window.closedAbility,blind:false});});
  await page.locator('[name="companionAttribute0"]').waitFor();assert.equal(await page.locator('[name="companionAttribute0"]').inputValue(),'MU');
  await page.locator('[data-action="companion-check"]').click();await page.evaluate(()=>window.closedRoll);
  assert.equal(await page.evaluate(()=>testMessages.length),beforeClosed+1);assert.equal(await page.locator('.mock-dialog').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: Closed-window ability macro still offers remembered attributes and posts one normal roll without an extra modifier dialog.');


  // The standalone NPC format shares controls but never the main-character data model.
  await page.evaluate(async()=>game.modules.get('pedipalpus-foundry').api.open('actor-1'));await idle();
  const originalParent=await page.evaluate(()=>JSON.stringify(game.actors.get('actor-1').getFlag('pedipalpus-foundry','character')));
  const beforeNpc=await page.evaluate(()=>game.actors.contents.length),npc=npcFixture();
  await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'Alrik.nsc.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(npc))});
  await page.waitForFunction(()=>document.querySelector('.pp-import-preview')?.textContent.includes('NSC · Dateiversion 1'));
  assert.equal(await page.locator('[name="destination"]').inputValue(),'');assert.equal(await page.locator('[name="destination"] option[value="actor-1"]').evaluate(option=>option.disabled),true);
  const npcPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOYmWb8HwAFAAIyPExoIAAAAABJRU5ErkJggg==','base64');
  await page.locator('[name="portraitFile"]').setInputFiles({name:'npc.png',mimeType:'image/png',buffer:npcPng});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);
  await page.locator('.mock-dialog [data-action="import"]').click();await idle();
  assert.equal(await page.evaluate(()=>game.actors.contents.length),beforeNpc+1);
  const npcId=await page.evaluate(()=>game.actors.contents.find(actor=>actor.getFlag('pedipalpus-foundry','character')?.profile.npc).id);
  assert.equal(await page.evaluate(()=>JSON.stringify(game.actors.get('actor-1').getFlag('pedipalpus-foundry','character'))),originalParent);
  assert.equal(await page.evaluate(id=>game.actors.get(id).prototypeToken.actorLink,npcId),true);
  if(process.env.PEDIPALPUS_PRIVATE_FRAMES)assert.equal(await page.evaluate(id=>game.actors.get(id).img!==game.actors.get(id).prototypeToken.texture.src,npcId),true);
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='full')await page.locator('[data-action="full"]').first().click();
  await page.locator('[name="category"]').selectOption('NpcAbilities');await page.locator('[name="search"]').fill('');
  const npcRow=()=>page.locator('[data-check-id="NpcAbilities:0"]');const beforeNpcAbility=await page.evaluate(()=>testMessages.length);
  await page.locator('[name="modifier"]').fill('4');await npcRow().locator('.pp-check-name').click();
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.locator('[name="modifier"]').inputValue(),'4');assert.equal(await page.evaluate(()=>testMessages.length),beforeNpcAbility);
  await npcRow().locator('[data-blind="true"]').click();for(let index=0;index<3;index++)await page.locator(`[name="companionAttribute${index}"]`).selectOption('MU');
  assert.equal(await page.locator('[data-action="companion-check"]').isDisabled(),true);
  await page.locator('[name="companionAttribute2"]').selectOption('KO');await page.locator('[name="companionCheckName"]').fill('Tür öffnen');
  await page.locator('.mock-dialog').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/nsc-attributwahl-1.2.0.png')});
  await page.locator('[data-action="companion-check"]').click();await page.waitForFunction(before=>testMessages.length===before+1,beforeNpcAbility);await idle();
  assert.equal(await page.evaluate(()=>testMessages.at(-1).testMode),'blind');assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Tür öffnen/);
  assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');
  await npcRow().locator('[data-action="favorite"]').click();await idle();
  await page.locator('[name="category"]').selectOption('magic');await page.locator('[data-check-id="Spells:0"] .pp-rating').click();
  assert.equal(await page.locator('[name="companionAttribute0"]').inputValue(),'KL');assert.equal(await page.locator('[name="companionAttribute1"]').inputValue(),'FF');assert.equal(await page.locator('[name="companionAttribute2"]').inputValue(),'KO');
  for(const [index,key]of ['MU','MU','IN'].entries())await page.locator(`[name="companionAttribute${index}"]`).selectOption(key);
  const beforePower=await page.evaluate(()=>testMessages.length);await page.locator('[data-action="companion-check"]').click();await page.waitForFunction(before=>testMessages.length===before+1,beforePower);await idle();
  assert.equal(await page.evaluate(id=>JSON.parse(game.actors.get(id).getFlag('pedipalpus-foundry','character').sourceJSON).Npc.Powers[0].FirstAttribute,npcId),'KL');
  assert.deepEqual(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='Spells:0').attributes.map(a=>a.short),npcId),['KL','FF','KO']);
  assert.equal(await page.locator('[data-check-id="Spells:2"]').count(),0);
  console.log('PASS: NPC file creates a separate owned token actor, wrong-format import targets disabled, old character untouched, general ability cancellation/blind cast/triple restriction and temporary spell attributes.');

  await page.locator('[data-action="battle"]').click();await page.locator('[name="category"]').selectOption('combat');
  const dodge=page.locator('[data-check-id="combat:NpcDodge:0:parry"] .pp-rating'),oldDodge=await dodge.textContent();
  await page.locator('[name="focus"]').focus();await page.keyboard.press('End');await idle();
  assert.equal(await dodge.textContent(),oldDodge);assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').combat.offDefOffset,npcId),4);
  const beforeDodge=await page.evaluate(()=>testMessages.length);await dodge.click();await page.waitForFunction(before=>testMessages.length===before+1,beforeDodge);await idle();
  await page.locator('[data-check-id="combat:RangedWeapons:0:ranged"] .pp-rating').click();await idle();
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='combat:RangedWeapons:0:ranged').combat.mobilityPenalty,npcId),1);
  await page.locator('[name="category"]').selectOption('armors');assert.equal(await page.locator('[data-armor-field="carried"]').count(),0);
  await page.locator('[data-armor-field="equipped"]').uncheck();await idle();
  assert.equal(await page.evaluate(id=>JSON.parse(game.actors.get(id).getFlag('pedipalpus-foundry','character').sourceJSON).Npc.Armors[0].Equipped,npcId),false);
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='combat:RangedWeapons:0:ranged').combat.mobilityPenalty,npcId),0);
  console.log('PASS: NPC dodge ignores focus, ranged uses NPC tolerance, armor has only its actual Equipped field and updates NPC combat values.');

  let npcChildId;
  if(process.env.PEDIPALPUS_PRIVATE_FRAMES){
    for(const category of ['animals','demons','undead','chimeras','persons','elementals','golems']){await page.locator('[name="category"]').selectOption(category);assert.equal(await page.locator(`[data-inventory="${category}"] [data-action="animal-portrait"]`).isEnabled(),true);}
    await page.locator('[name="category"]').selectOption('undead');await page.locator('[data-inventory="undead"] [data-action="animal-portrait"]').click();
    await page.locator('[name="portraitFile"]').setInputFiles({name:'npc-companion.png',mimeType:'image/png',buffer:npcPng});await page.waitForFunction(()=>document.querySelector('[data-action="animal-image"]')?.disabled===false);await page.locator('[name="tokenFrame"]').selectOption('undead');await page.locator('[data-action="animal-image"]').click();await idle();
    npcChildId=await page.evaluate(parent=>game.actors.contents.find(actor=>actor.getFlag('pedipalpus-foundry','companion')?.sourceActorId===parent).id,npcId);
    assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').sourceFormat,npcChildId),'Pedipalpus.Npc');
  }
  npc.Npc.Abilities.unshift({Name:'Neue Fähigkeit',Grade:'Amateur'});npc.Npc.Abilities[1].Grade='Meister';npc.Npc.Retinue.find(member=>member.Kind==='Untoter').Attacks[0].AttackValue=9;npc.Npc.Retinue.reverse();
  const totalBeforeNpcUpdate=await page.evaluate(()=>game.actors.contents.length);await upload(npc,{destination:npcId,keepFocus:true});
  assert.equal(await page.evaluate(()=>game.actors.contents.length),totalBeforeNpcUpdate);assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').combat.offDefOffset,npcId),4);
  assert.deepEqual(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='NpcAbilities:1').npcChoice.keys,npcId),['MU','MU','KO']);
  if(npcChildId)assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='undead:0:0:attack').value,npcChildId),9);
  await page.locator('[data-action="full"]').first().click();await page.locator('[name="category"]').selectOption('NpcAbilities');
  assert.equal(await page.locator('[data-check-id="NpcAbilities:1"] [data-action="favorite"]').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{for(const app of foundry.applications.api.ApplicationV2.instances())app.setPosition({width:540,height:520});});
  if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();
  await page.locator('.pedipalpus-app').screenshot({path:path.resolve(root,'../pedipalpus-checks/foundry-ui/nsc-proben-1.2.0.png')});
  const npcZipDownload=page.waitForEvent('download');await action('export');const npcZip=await npcZipDownload;const zipBytes=await fs.readFile(await npcZip.path());
  const exportedNpc=await page.evaluate(async bytes=>{const {readCharacterFile}=await import('/scripts/bundle.js');const bundle=await readCharacterFile(new File([new Uint8Array(bytes)],'npc.zip'));return {file:JSON.parse(bundle.json),portrait:Boolean(bundle.portrait)};},Array.from(zipBytes));
  assert.equal(exportedNpc.file.Format,'Pedipalpus.Npc');assert.equal(exportedNpc.file.Npc.Focus,4);assert.equal('OffOffset' in exportedNpc.file,false);assert.equal('PortraitFileName' in exportedNpc.file,false);assert.equal(exportedNpc.portrait,true);
  console.log('PASS: NPC reimport retains actor/token identity, attribute choices and favorites after reordering, refreshes linked undead and exports the original NPC format with current focus.');

  await page.evaluate(raw=>{window.liveNpc=raw;window.showOpenFilePicker=async()=>[{kind:'file',name:'live.nsc.json',queryPermission:async()=> 'granted',getFile:async()=>new File([JSON.stringify(window.liveNpc)],'live.nsc.json',{type:'application/json'})}];},npc);
  await action('import');await page.locator('[data-pick-character]').click();await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('.mock-dialog [data-action="import"]').click();await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();await idle();
  await page.evaluate(()=>{window.liveNpc.Npc.Features[1].Grade='Legende';});await action('refresh');await page.locator('.pp-import-diff').waitFor();assert.match(await page.locator('.pp-import-diff').textContent(),/Testzauber/);await page.locator('.mock-dialog [data-action="accept"]').click();await idle();
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='Spells:0').value,npcId),20);
  assert.equal(await page.evaluate(()=>JSON.stringify(game.actors.get('actor-1').getFlag('pedipalpus-foundry','character'))),originalParent);
  // Another edit during the import comparison must not be silently overwritten.
  const changed=structuredClone(npc);changed.Npc.Abilities[1].Grade='Legende';await action('import');await page.locator('[name="characterFile"]').setInputFiles({name:'changed.nsc.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changed))});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('.mock-dialog [data-action="import"]').click();await page.locator('.pp-import-diff').waitFor();
  await page.evaluate(async id=>{const {withFocus}=await import('/scripts/combat.js'),actor=game.actors.get(id);await actor.setFlag('pedipalpus-foundry','character',withFocus(actor.getFlag('pedipalpus-foundry','character'),-2));},npcId);
  await page.locator('.mock-dialog [data-action="accept"]').click();await idle();assert.match(await page.evaluate(()=>notifications.at(-1).message),/inzwischen geändert/);
  assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').combat.offDefOffset,npcId),-2);
  console.log('PASS: NPC refresh reads fresh source bytes; a concurrent edit during comparison is rejected and never touches the existing player character.');
  if(await page.locator('.pp-root').getAttribute('data-mode')!=='full')await page.locator('[data-action="full"]').first().click();await page.locator('[name="category"]').selectOption('NpcAbilities');
  const macroRef=await page.evaluate(async id=>{const {checkReference}=await import('/scripts/workbench.js');return checkReference(game.actors.get(id).getFlag('pedipalpus-foundry','character').checks.find(c=>c.id==='NpcAbilities:1'));},npcId);
  const beforeNpcMacro=await page.evaluate(()=>testMessages.length);await page.evaluate(async({id,reference})=>{for(const app of foundry.applications.api.ApplicationV2.instances())await app.close();window.npcMacro=game.modules.get('pedipalpus-foundry').api.roll({actorId:id,reference});},{id:npcId,reference:macroRef});
  await page.locator('[name="companionAttribute0"]').waitFor();assert.equal(await page.locator('[name="companionAttribute0"]').inputValue(),'MU');await page.locator('[data-action="companion-check"]').click();await page.evaluate(()=>window.npcMacro);
  assert.equal(await page.evaluate(()=>testMessages.length),beforeNpcMacro+1);
  assert.deepEqual(errors,[]);console.log('PASS: Closed-window NPC macro uses remembered own attributes and posts exactly one roll.');

  await page.evaluate(async id=>{const actor=game.actors.get(id);actor.isOwner=false;actor.canUserModify=()=>false;await game.modules.get('pedipalpus-foundry').api.open(id);},npcId);await idle();
  assert.equal(await page.locator('[data-action="roll"]:enabled').count(),0);
  const observerError=await page.evaluate(async({id,reference})=>{try{await game.modules.get('pedipalpus-foundry').api.roll({actorId:id,reference});return null;}catch(error){return error.message;}},{id:npcId,reference:macroRef});
  assert.match(observerError,/Besitzerrechte/);assert.equal(await page.locator('.mock-dialog').count(),0);
  await page.evaluate(async id=>{const actor=game.actors.get(id);actor.isOwner=true;actor.canUserModify=()=>true;await game.modules.get('pedipalpus-foundry').api.open(id);},npcId);await idle();
  await pref({language:'ork'});await page.locator('[name="category"]').selectOption('NpcAbilities');await page.locator('[data-check-id="NpcAbilities:1"] .pp-check-name').click();
  assert.equal(await page.locator('.mock-dialog h2').textContent(),'Anderer tut Ding');assert.match(await page.locator('.mock-dialog').textContent(),/Zwei Werte gleich geht/);
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();await pref({language:'standard'});
  assert.deepEqual(errors,[]);console.log('PASS: Read-only NPC users cannot roll or alter data; NPC attribute selection supports the independent Ork language.');


}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}


