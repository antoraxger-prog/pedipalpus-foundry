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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.6 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const imported=await page.evaluate(async raw=>{
  const {normalizeCharacter}=await import('/scripts/data.js'),{importSource}=await import('/scripts/import-source.js');game.user.isGM=true;window.importRaw=raw;
  const snapshot={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];
  window.sourceFile=new File([JSON.stringify(raw)],'character.json',{type:'application/json'});window.originalSettingSave=game.settings.set;
  game.settings.set=async(...args)=>{if(args[1]==='workbench')throw new Error('Synthetic preference failure');return originalSettingSave(...args);};
  const actor=await app.acceptImport({snapshot,includeImages:false,includeCompanions:false,tokenFrame:'concrete',source:{fileHandle:{getFile:async()=>window.sourceFile}}});window.importActorId=actor.id;
  const source=await importSource(actor.id);return {id:actor.id,name:actor.name,count:game.actors.contents.length,source:Boolean(source?.fileHandle),selected:app.actorId,warnings:notifications.filter(row=>row.level==='warn').map(row=>row.message),errors:notifications.filter(row=>row.level==='error')};
 },fixture());
 assert.equal(imported.count,1);assert.equal(imported.source,true);assert.equal(imported.selected,imported.id);assert.equal(imported.name,'Testcharakter');assert.ok(imported.warnings.some(text=>/Charakter wurde importiert.*Auswahl/.test(text)));assert.deepEqual(imported.errors,[]);
 console.log('PASS: A completed import returns its single actor, stays selected and remembers the refresh source despite unavailable personal-selection storage.');
 await page.evaluate(async()=>{const raw=structuredClone(importRaw);raw.HobbySkills[0].Value=3;window.sourceFile=new File([JSON.stringify(raw)],'character.json',{type:'application/json'});const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];window.refreshImport=app.refreshCharacter();});
 await page.locator('.pp-import-diff').waitFor();await page.locator('.mock-dialog [data-action="accept"]').click();await page.evaluate(()=>window.refreshImport);await idle();
 assert.equal(await page.evaluate(()=>game.actors.contents.length),1);assert.equal(await page.evaluate(()=>game.actors.get(importActorId).getFlag('pedipalpus-foundry','character').checks.find(row=>row.name==='Schach').value),3);
 await page.evaluate(()=>{game.settings.set=originalSettingSave;});
 console.log('PASS: Refresh remains usable after that warning and updates the same character from the remembered source instead of creating a duplicate.');
 const failure=await page.evaluate(async()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0],{normalizeCharacter}=await import('/scripts/data.js'),create=foundry.documents.Actor.create,before=game.actors.contents.length,noticeCount=notifications.length;foundry.documents.Actor.create=async()=>{throw new Error('Synthetic actor write failure');};try{await app.acceptImport({snapshot:normalizeCharacter(importRaw),includeImages:false,includeCompanions:false});return {resolved:true};}catch(error){return {error:error.message,before,after:game.actors.contents.length,notifications:notifications.slice(noticeCount)};}finally{foundry.documents.Actor.create=create;}});
 assert.equal(failure.error,'Synthetic actor write failure');assert.equal(failure.before,failure.after);assert.deepEqual(failure.notifications,[]);
 console.log('PASS: A genuine actor-write failure still rejects without a false success notification or a duplicate character.');
 const file=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=180;canvas.height=500;const ctx=canvas.getContext('2d');ctx.fillStyle='#3b5777';ctx.fillRect(0,0,180,500);ctx.fillStyle='#dca466';ctx.fillRect(50,20,80,80);window.testPortraitData=canvas.toDataURL('image/png');return testPortraitData.split(',')[1];});
 await page.locator('[data-action="portrait-edit"]').click();await page.locator('[name="portraitFile"]').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(file,'base64')});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="image"]')?.disabled===false);
 await page.evaluate(()=>{game.actors.get(importActorId).prototypeToken.texture={src:'independent-token.webp'};});const uploadBefore=uploadedImages.size;
 await page.locator('.mock-dialog [data-action="image"]').click();await idle();assert.match(await page.locator('#notice').textContent(),/inzwischen geändert/);assert.equal(uploadedImages.size,uploadBefore);assert.equal(await page.evaluate(()=>game.actors.get(importActorId).prototypeToken.texture.src),'independent-token.webp');
 console.log('PASS: Changing only the prototype token while the real portrait editor is open rejects the old crop before any upload.');
 await page.evaluate(async()=>{const actor=game.actors.get(importActorId),raw=JSON.parse(actor.getFlag('pedipalpus-foundry','character').sourceJSON),{normalizeCharacter}=await import('/scripts/data.js'),{preparePortrait}=await import('/scripts/portraits.js'),app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];raw.HobbySkills[0].Value=4;const portrait=await preparePortrait(new File([await(await fetch(testPortraitData)).blob()],'portrait.png',{type:'image/png'}));window.imageImport=app.acceptImport({snapshot:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actorId:actor.id,portrait,tokenFrame:'concrete',includeCompanions:false}).then(()=>({ok:true}),error=>({error:error.message}));});
 await page.locator('.pp-import-diff').waitFor();await page.evaluate(()=>{game.actors.get(importActorId).prototypeToken.texture.src='new-comparison-token.webp';});await page.locator('.mock-dialog [data-action="accept"]').click();const comparison=await page.evaluate(()=>window.imageImport);
 assert.match(comparison.error,/Charakterbild wurde inzwischen geändert/);assert.equal(uploadedImages.size,uploadBefore);assert.equal(await page.evaluate(()=>game.actors.get(importActorId).getFlag('pedipalpus-foundry','character').checks.find(row=>row.name==='Schach').value),3);
 console.log('PASS: A token-only change during the import comparison preserves both the newer token and the old character values without uploading the proposed images.');
 await page.evaluate(async()=>{const actor=game.actors.get(importActorId),raw=JSON.parse(actor.getFlag('pedipalpus-foundry','character').sourceJSON),{normalizeCharacter}=await import('/scripts/data.js'),app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];raw.HobbySkills[0].Value=4;window.noImageImport=app.acceptImport({snapshot:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actorId:actor.id,includeImages:false,includeCompanions:false});});
 await page.locator('.pp-import-diff').waitFor();await page.evaluate(()=>{game.actors.get(importActorId).prototypeToken.texture.src='kept-with-images-off.webp';});await page.locator('.mock-dialog [data-action="accept"]').click();await page.evaluate(()=>window.noImageImport);await idle();assert.equal(await page.evaluate(()=>game.actors.get(importActorId).prototypeToken.texture.src),'kept-with-images-off.webp');assert.equal(await page.evaluate(()=>game.actors.get(importActorId).getFlag('pedipalpus-foundry','character').checks.find(row=>row.name==='Schach').value),4);assert.equal(uploadedImages.size,uploadBefore);assert.deepEqual(errors,[]);
 console.log('PASS: Importing with images disabled still accepts changed character values and leaves an independently changed token untouched.');
 await page.evaluate(async()=>{
  const actor=game.actors.get(importActorId),raw=structuredClone(importRaw),app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];
  const {rememberImportSource}=await import('/scripts/import-source.js');
  raw.HobbySkills[0].Value=5;raw.PortraitFileName='optional.png';
  actor.img='kept-portrait.png';actor.prototypeToken.texture.src='kept-token.png';
  window.sourceFile=new File([JSON.stringify(raw)],'character.json',{type:'application/json'});
  game.user.isGM=false;game.user.can=()=>false;
  await rememberImportSource(actor.id,{includeImages:true,includeCompanions:false,fileHandle:{getFile:async()=>window.sourceFile},directoryHandle:{queryPermission(){throw new Error('Optional portrait was queried');}}});
  window.noUploadRefresh=app.refreshCharacter();
 });
 await page.locator('.pp-import-diff').waitFor();await page.locator('.mock-dialog [data-action="accept"]').click();await page.evaluate(()=>window.noUploadRefresh);
 assert.deepEqual(await page.evaluate(async()=>{
  const actor=game.actors.get(importActorId),{importSource}=await import('/scripts/import-source.js');
  return [actor.img,actor.prototypeToken.texture.src,actor.getFlag('pedipalpus-foundry','character').checks.find(row=>row.name==='Schach').value,(await importSource(actor.id)).includeImages];
 }),['kept-portrait.png','kept-token.png',5,true]);
 assert.equal(uploadedImages.size,uploadBefore);
 assert.ok(await page.evaluate(()=>notifications.some(row=>row.level==='warn'&&row.message.includes('Upload-Rechte fehlen'))));
 console.log('PASS: Refresh without upload permission skips a remembered portrait request, saves changed values, and retains both images and the remembered preference.');
 await page.evaluate(()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];window.noUploadDialog=app.importCharacter();});
 const imageOption=page.locator('.mock-dialog [name="includeImages"]');
 await imageOption.waitFor();assert.equal(await imageOption.isDisabled(),true);assert.equal(await imageOption.isChecked(),false);
 assert.equal(await page.locator('.mock-dialog [data-image-options]').isVisible(),false);
 assert.match(await page.locator('.mock-dialog').textContent(),/Upload-Rechte fehlen/);
 await page.locator('.mock-dialog [data-action="cancel"]').click();await page.evaluate(()=>window.noUploadDialog);
 assert.deepEqual(errors,[]);
 console.log('PASS: The normal import dialog disables picture controls and explains the missing upload permission.');
 await page.evaluate(async member=>{
  const actor=game.actors.get(importActorId),app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];
  const {normalizeCharacter}=await import('/scripts/data.js');
  const {companionKey,companionSnapshot}=await import('/scripts/companions.js');
  const {rememberImportSource}=await import('/scripts/import-source.js');
  const raw={...structuredClone(importRaw),Undead:[member]},previous={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
  await actor.setFlag('pedipalpus-foundry','character',previous);
  const linked=await foundry.documents.Actor.create({name:member.Name,img:'companion-portrait.png',type:'character',
   prototypeToken:{name:member.Name,actorLink:true,texture:{src:'companion-token.png'}},flags:{'pedipalpus-foundry':{
    character:companionSnapshot(previous,0),companion:{sourceActorId:actor.id,key:companionKey(previous,0),active:true}
   }}});
  window.linkedRefreshId=linked.id;
  const token=(name,actorLink=true,allowed=true)=>({name,actorId:linked.id,actorLink,canUserModify:()=>allowed,async update(data){Object.assign(this,data);}});
  window.linkedRefreshTokens=[token(member.Name),token('Spitzname'),token(member.Name,false),token(member.Name,true,false)];
  game.scenes={contents:[{tokens:{contents:window.linkedRefreshTokens}}]};
  raw.Undead[0]={...member,Name:'Neue Wache',CurrentLe:13,Attacks:[{...member.Attacks[0],AttackValue:11}]};
  window.sourceFile=new File([JSON.stringify(raw)],'character.json',{type:'application/json'});
  await rememberImportSource(actor.id,{includeImages:true,includeCompanions:true,fileHandle:{getFile:async()=>window.sourceFile}});
  window.companionRefresh=app.refreshCharacter();
 },retinueFixture().Undead[0]);
 await page.locator('.pp-import-diff').waitFor();
 assert.match(await page.locator('.pp-import-diff').textContent(),/Neue Wache.*Gefolge/);
 await page.locator('.mock-dialog [data-action="accept"]').click();await page.evaluate(()=>window.companionRefresh);
 assert.deepEqual(await page.evaluate(()=>{
  const actor=game.actors.get(linkedRefreshId),snapshot=actor.getFlag('pedipalpus-foundry','character');
  return [actor.name,actor.prototypeToken.name,actor.img,actor.prototypeToken.texture.src,snapshot.resources[0].value,
   snapshot.checks.find(check=>check.kind==='combat').value,game.actors.contents.length,linkedRefreshTokens.map(token=>token.name)];
 }),['Neue Wache','Neue Wache','companion-portrait.png','companion-token.png',13,11,2,['Neue Wache','Spitzname','Wache','Wache']]);
 assert.equal(uploadedImages.size,uploadBefore);assert.deepEqual(errors,[]);
 console.log('PASS: Refresh without upload permission updates the same companion’s name, values and default linked token names, preserving its artwork and custom or protected token names.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
