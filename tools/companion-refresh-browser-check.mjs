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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.7 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 await page.evaluate(async raw=>{
  const {normalizeCharacter}=await import('/scripts/data.js'),{companionKey,companionSnapshot}=await import('/scripts/companions.js');const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
  const parent=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.parentId=parent.id;window.originalSource=character.sourceJSON;window.parentWrites=0;const setParent=parent.setFlag.bind(parent);parent.setFlag=async(...args)=>{parentWrites++;return setParent(...args);};window.childIds=[];window.childWrites={};window.childSaves={};
  for(let index=0;index<character.retinue.length;index++){const child=await foundry.documents.Actor.create({name:character.retinue[index].Name,type:'character',flags:{'pedipalpus-foundry':{character:companionSnapshot(character,index),companion:{sourceActorId:parent.id,key:companionKey(character,index)}}}});childIds.push(child.id);childWrites[child.id]=0;childSaves[child.id]=child.setFlag.bind(child);child.setFlag=async(...args)=>{if(child.id===childIds[0])throw new Error('Synthetic child storage failure');childWrites[child.id]++;return childSaves[child.id](...args);};}
  await game.modules.get('pedipalpus-foundry').api.open(parent.id);
 },retinueFixture());
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const state=()=>page.evaluate(()=>({parent:game.actors.get(parentId).getFlag('pedipalpus-foundry','character'),children:childIds.map(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character')),parentWrites,childWrites:{...childWrites},warnings:notifications.filter(row=>row.level==='warn').map(row=>row.message),errors:notifications.filter(row=>row.level==='error')}));
 await page.locator('[data-action="playstate"]').click();await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('9');await page.locator('[data-resource-row="1"][data-energy="LE"]').fill('2');await page.locator('.mock-dialog [data-action="save"]').click();await idle();let saved=await state();
 assert.equal(saved.parent.resources[0].value,9);assert.equal(saved.parent.retinue[0].CurrentLe,2);assert.equal(saved.children[0].resources[0].value,14);assert.ok(Object.values(saved.childWrites).slice(1).every(count=>count===1));assert.equal(saved.parent.sourceJSON,await page.evaluate(()=>originalSource));assert.deepEqual(saved.errors,[]);assert.ok(saved.warnings.some(text=>/Skelett.*erneut öffnen und speichern/.test(text)));
 console.log('PASS: Saving energies through the actual dialog keeps the parent successful when one linked child fails and still updates the later companions.');
 const writes=saved.parentWrites;
 await page.evaluate(async()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await app.persist({...app.preferences,language:'ork'});await app.render();});
 await page.locator('[data-action="playstate"]').click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();saved=await state();assert.equal(saved.parentWrites,writes);assert.ok(saved.warnings.some(text=>/Skelett: Neue Zahlen gingen nicht rüber.*Kraftfenster/.test(text)));assert.deepEqual(saved.errors,[]);
 console.log('PASS: Saving an unchanged dialog retries the synchronization without another parent write and reports the failing creature in the selected Ork language.');
 await page.evaluate(async()=>{const child=game.actors.get(childIds[0]);child.setFlag=async(...args)=>{childWrites[child.id]++;return childSaves[child.id](...args);};const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await app.persist({...app.preferences,language:'standard'});await app.render();});
 await page.locator('[data-action="playstate"]').click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();saved=await state();assert.equal(saved.children[0].resources[0].value,2);assert.equal(saved.parentWrites,writes);assert.equal(await page.evaluate(()=>game.actors.contents.length),4);
 console.log('PASS: A later unchanged save repairs the previously failed child, preserves actor identities and does not rewrite the saved parent.');
 await page.evaluate(async()=>{const first=game.actors.get(childIds[0]),save=first.setFlag.bind(first);first.setFlag=async(...args)=>{await save(...args);first.setFlag=save;const parent=game.actors.get(parentId),character=parent.getFlag('pedipalpus-foundry','character'),{withPlayState,memberStateKey}=await import('/scripts/play-state.js'),key=memberStateKey(character.retinue[1]);parent.flags['pedipalpus-foundry'].character=withPlayState(character,{...character.localState,resources:{...character.localState.resources,[key]:{LE:7}}});};window.secondWritesBefore=childWrites[childIds[1]];});
 await page.locator('[data-action="playstate"]').click();await page.locator('[data-resource-row="1"][data-energy="LE"]').fill('3');await page.locator('.mock-dialog [data-action="save"]').click();await idle();saved=await state();assert.equal(saved.parent.retinue[1].CurrentLe,7);assert.equal(saved.children[1].resources[0].value,14);assert.equal(saved.childWrites[await page.evaluate(()=>childIds[1])],await page.evaluate(()=>secondWritesBefore));assert.ok(saved.warnings.some(text=>/Hauptcharakter.*Weitere Begleiterwerte/.test(text)));assert.deepEqual(saved.errors,[]);
 console.log('PASS: A newer parent state during synchronization stops the remaining old child updates and leaves the newer energies intact.');
 const newerWrites=saved.parentWrites;
 await page.locator('[data-action="playstate"]').click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();saved=await state();assert.equal(saved.children[1].resources[0].value,7);assert.equal(saved.children[0].resources[0].value,3);assert.equal(saved.parentWrites,newerWrites);
 console.log('PASS: Reopening and saving the latest unchanged state synchronizes all children to the newer parent values without another parent write.');
 await page.locator('[data-action="playstate"]').click();const childBefore=saved.childWrites;
 await page.evaluate(()=>{const parent=game.actors.get(parentId),character=parent.getFlag('pedipalpus-foundry','character');parent.flags['pedipalpus-foundry'].character={...character,importedAt:'changed-while-dialog-open'};});await page.locator('.mock-dialog [data-action="save"]').click();await idle();saved=await state();assert.deepEqual(saved.childWrites,childBefore);assert.match(await page.locator('#notice').textContent(),/Daten wurden inzwischen geändert/);
 await page.locator('[data-action="playstate"]').click();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.deepEqual((await state()).childWrites,childBefore);assert.deepEqual(errors,[]);
 console.log('PASS: An unchanged but stale dialog cannot synchronize another saved state; canceling the reopened dialog performs no writes and no browser errors occur.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
