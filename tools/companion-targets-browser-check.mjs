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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.28 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.(?:png|jpg|jpeg|bmp|webp)$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type',/\.jpe?g$/.test(url.pathname)?'image/jpeg':/\.webp$/.test(url.pathname)?'image/webp':'image/png');return response.end(uploadedImages.get(url.pathname));}
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
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1120,height:950}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(12000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
 const ids=await page.evaluate(async({raw,npc})=>{
  game.user.isGM=true;game.users=[{id:'gm',name:'Meister',isGM:true},{id:'player',name:'Spieler',isGM:false}];window.targetRaw=raw;
  const {normalizeCharacter,MODULE_ID}=await import('/scripts/data.js'),{companionSnapshot,companionKey}=await import('/scripts/companions.js');
  const snapshot={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},make=(name,c,link)=>foundry.documents.Actor.create({name,type:'character',img:'own.webp',ownership:{observer:2},prototypeToken:{name,actorLink:true,width:2,texture:{src:'own-token.webp'}},flags:{[MODULE_ID]:{character:c,...(link?{companion:link}:{})}}});
  const parent=await make('Alter Hauptcharakter',snapshot),child=await make('Skelett bisher',companionSnapshot(snapshot,0),{sourceActorId:parent.id,key:companionKey(snapshot,0),active:true});child.folder={name:'Skelette',folder:{name:'Gefolge'}};
  const standalone=await make('Dämon bisher',companionSnapshot(snapshot,1));standalone.folder={name:'Dämonen',folder:{name:'Gefolge'}};
  const other=await make('Unberührt',companionSnapshot(snapshot,2),{sourceActorId:parent.id,key:companionKey(snapshot,2),active:true});const mainNpc=await make('Geschützter NSC',normalizeCharacter(npc));
  window.targetProtected=JSON.stringify([parent,other,mainNpc]);window.targetBefore={child:JSON.parse(JSON.stringify(child)),standalone:JSON.parse(JSON.stringify(standalone)),count:game.actors.contents.length};
  return {parent:parent.id,child:child.id,standalone:standalone.id,other:other.id,npc:mainNpc.id};
 },{raw:retinueFixture(),npc:npcFixture()});
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const open=async()=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="import"]').click();await page.locator('[data-import-kind="character"]').click();await page.locator('[name="characterFile"]').setInputFiles({name:'held.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(retinueFixture()))});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="includeImages"]').uncheck();};
 const submit=async()=>{await page.locator('.mock-dialog [data-action="import"]').click();await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();await idle();};
 await open();await page.locator('[name="destination"]').selectOption('');
 const first=page.locator('[data-companion-import-index="0"]');assert.match(await first.textContent(),/Gefolge \/ Skelette \/ Skelett bisher aktualisieren \(anderer Import\)/);assert.match(await first.textContent(),/Gefolge \/ Dämonen \/ Dämon bisher/);
 for(const id of [ids.parent,ids.npc])assert.equal(await first.locator(`option[value="${id}"]`).count(),0);
 await first.selectOption(ids.child);await page.locator('[data-companion-import-index="1"]').selectOption(ids.standalone);
 await page.locator('[name="ownerId"]').selectOption('player');await page.screenshot({path:path.resolve(root,'../artifacts/companion-targets-1.11.28.png')});
 console.log('PASS: Per-creature directory targets include prior-import and standalone companions with folder paths; main characters and NPCs are excluded.');
 await submit();const newParent=await page.locator('[name="actor"]').inputValue();assert.notEqual(newParent,ids.parent);
 const result=await page.evaluate(({ids,newParent})=>{const child=game.actors.get(ids.child),standalone=game.actors.get(ids.standalone);return {count:game.actors.contents.length,before:targetBefore,child:JSON.parse(JSON.stringify(child)),standalone:JSON.parse(JSON.stringify(standalone)),protected:JSON.stringify([game.actors.get(ids.parent),game.actors.get(ids.other),game.actors.get(ids.npc)])===targetProtected,newParent};},{ids,newParent});
 assert.equal(result.count,result.before.count+1);assert.equal(result.protected,true);
 for(const key of ['child','standalone']){assert.equal(result[key].id,result.before[key].id);assert.equal(result[key].img,result.before[key].img);assert.deepEqual(result[key].folder,result.before[key].folder);assert.equal(result[key].prototypeToken.texture.src,'own-token.webp');assert.equal(result[key].prototypeToken.width,2);assert.equal(result[key].ownership.observer,2);assert.equal(result[key].ownership.player,3);assert.equal(result[key].flags['pedipalpus-foundry'].companion.sourceActorId,newParent);}
 console.log('PASS: Import updates the chosen actor identities in place, preserves folder, art, token size and old rights, and only adds the explicitly chosen owner; unrelated figures stay byte-identical.');
 await open();assert.equal(await page.locator('[name="destination"]').inputValue(),newParent);assert.equal(await first.inputValue(),ids.child);assert.equal(await page.locator('[data-companion-import-index="1"]').inputValue(),ids.standalone);await submit();assert.equal(await page.evaluate(()=>game.actors.contents.length),result.count);
 console.log('PASS: Reimport selects the newly assigned directory figures and creates no duplicate companions.');
 await open();await page.locator('[data-companion-import-index="1"]').selectOption(ids.child);const beforeDuplicate=await page.evaluate(()=>JSON.stringify(game.actors.contents));await page.locator('.mock-dialog [data-action="import"]').click();await page.waitForFunction(()=>notifications.some(row=>row.level==='error'&&row.message.includes('denselben')));assert.equal(await page.evaluate(()=>JSON.stringify(game.actors.contents)),beforeDuplicate);await page.locator('.mock-dialog [data-action="cancel"]').click();
 console.log('PASS: Two companions cannot overwrite the same existing figure; the rejected selection writes no actor data.');
 const stale=await page.evaluate(async({ids,newParent})=>{const {prepareCompanionImport}=await import('/scripts/companions.js'),{normalizeCharacter}=await import('/scripts/data.js'),app=Array.from(foundry.applications.api.ApplicationV2.instances())[0],source=game.actors.get(newParent),saved=source.getFlag('pedipalpus-foundry','character'),snapshot={...normalizeCharacter(targetRaw),sourceJSON:JSON.stringify(targetRaw)},plan=prepareCompanionImport(snapshot,null,[{index:0,targetId:ids.child}]);source.flags['pedipalpus-foundry'].character={...saved,profile:{...saved.profile,name:'Zwischenzeitlich geändert'}};const before=JSON.stringify(game.actors.contents);let error='';try{await app.acceptImport({snapshot,actorId:null,companionPlan:plan,includeImages:false,includeCompanions:true});}catch(e){error=e.message;}const unchanged=JSON.stringify(game.actors.contents)===before;source.flags['pedipalpus-foundry'].character=saved;return {error,unchanged};},{ids,newParent});assert.match(stale.error,/inzwischen/);assert.equal(stale.unchanged,true);
 assert.deepEqual(errors,[]);console.log('PASS: A changed old source invalidates reassignment before creating or updating any figure; no browser errors.');
 const single={Format:'Pedipalpus.Gefolge',Version:1,Name:'Neue Wache',Undead:retinueFixture().Undead};
 const openSingle=async()=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="import"]').click();await page.locator('[data-import-kind="retinue"]').click();await page.locator('[name="retinueFile"]').setInputFiles({name:'wesen.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(single))});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="includeImages"]').uncheck();await page.locator('[name="destination"]').selectOption(ids.child);assert.equal(await page.getByText('Diese Begleiterfigur wird als eigenes Wesen aktualisiert und vom bisherigen Import gelöst.',{exact:false}).isVisible(),true);};
 await openSingle();const beforeSingle=await page.evaluate(()=>JSON.stringify(game.actors.contents));await page.locator('.mock-dialog [data-action="import"]').click();await page.locator('.pp-import-diff').waitFor();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.evaluate(()=>JSON.stringify(game.actors.contents)),beforeSingle);
 console.log('PASS: A single-creature file offers existing linked directory figures with an explicit reassignment note; cancelling its comparison preserves all data.');
 const parentBeforeSingle=await page.evaluate(id=>JSON.stringify(game.actors.get(id)),newParent);await openSingle();await submit();
 const singleResult=await page.evaluate(({id,parent})=>{const a=game.actors.get(id);return {count:game.actors.contents.length,source:a.getFlag('pedipalpus-foundry','companion')?.sourceActorId,profile:a.getFlag('pedipalpus-foundry','character').profile,img:a.img,token:a.prototypeToken.texture.src,folder:a.folder,parent:JSON.stringify(game.actors.get(parent))};},{id:ids.child,parent:newParent});
 assert.equal(singleResult.count,result.count);assert.equal(singleResult.source,null);assert.equal(singleResult.profile.retinueOnly,true);assert.equal(singleResult.profile.companionGroup,'undead');assert.equal(singleResult.img,'own.webp');assert.equal(singleResult.token,'own-token.webp');assert.deepEqual(singleResult.folder,result.before.child.folder);assert.equal(singleResult.parent,parentBeforeSingle);assert.deepEqual(errors,[]);
 console.log('PASS: Accepting a single-creature file updates that same directory actor as an independent creature, preserves folder and art, creates no actor and leaves its previous main character unchanged.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
