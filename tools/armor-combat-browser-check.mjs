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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.4 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 const raw=combatFixture();raw.DerivedValues=Array.from({length:9},(_,i)=>({ShortName:i===0?'LE':i===8?'TK':'',TotalValue:i===0?31:i===8?50:0}));raw.Armors=[{InventoryId:'armor-a',Name:'Kette',Protection:5,MobilityPenalty:2,BaseMobilityPenalty:2,Weight:8,OnPerson:true,IsEquiped:true},{InventoryId:'armor-b',Name:'Helm',Protection:2,MobilityPenalty:1,BaseMobilityPenalty:1,Weight:2,OnPerson:true,IsEquiped:false}];
 const actorId=await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),{withPlayState}=await import('/scripts/play-state.js'),{withFocus}=await import('/scripts/combat.js');const character=withFocus(withPlayState({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},{version:1,resources:{root:{LE:8}}}),2);const actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});await game.modules.get('pedipalpus-foundry').api.open(actor.id);return actor.id;},raw);
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 await page.locator('[data-action="battle"]').click();await idle();await page.locator('[name="category"]').selectOption('armors');
 const before=await page.evaluate(async id=>{const actor=game.actors.get(id),{normalizeCharacter}=await import('/scripts/data.js'),{withFocus}=await import('/scripts/combat.js'),{retainPlayState}=await import('/scripts/play-state.js'),previous=actor.getFlag('pedipalpus-foundry','character'),raw=JSON.parse(previous.sourceJSON);raw.Armors.reverse();actor.flags['pedipalpus-foundry'].character=withFocus(retainPlayState(previous,{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}),2);return JSON.stringify(actor.flags);},actorId);
 await page.locator('[data-armor="Armors:0"][data-armor-field="equipped"]').uncheck();await idle();assert.match(await page.locator('#notice').textContent(),/Rüstung.*neu sortiert/);assert.equal(await page.evaluate(id=>JSON.stringify(game.actors.get(id).flags),actorId),before);
 console.log('PASS: An armor checkbox rendered before list reordering is rejected without changing either armor or any stored character data.');
 await page.locator('[data-armor="Armors:1"][data-armor-field="equipped"]').uncheck();await idle();const after=await page.evaluate(id=>{const c=game.actors.get(id).getFlag('pedipalpus-foundry','character');return {raw:JSON.parse(c.sourceJSON),le:c.resources[0].value,focus:c.combat.offDefOffset};},actorId);assert.equal(after.raw.Armors[1].IsEquiped,false);assert.equal(after.le,8);assert.equal(after.focus,2);
 console.log('PASS: Selecting the current armor after refresh changes the intended piece and preserves local energy and focus.');
 const npc=npcFixture();npc.Npc.Techniques=[];
 await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js');const actor=await foundry.documents.Actor.create({name:raw.Npc.Name,type:'character',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});await game.modules.get('pedipalpus-foundry').api.open(actor.id);},npc);await idle();await page.locator('[name="category"]').selectOption('combat');
 for(const [id,blind,value] of [['combat:MeleeWeapons:0:attack',false,6],['combat:MeleeWeapons:0:parry',true,2],['combat:RangedWeapons:0:ranged',false,6]]){
  const button=page.locator(`.pp-dice-button[data-check="${id}"][data-blind="${blind}"]`);assert.equal(await button.isEnabled(),true);await button.click();await idle();const message=await page.evaluate(()=>testMessages.at(-1));assert.match(message.content,/Ohne Kampftechnik/);assert.match(message.content,/<strong>0<\/strong>/);assert.match(message.content,new RegExp(`<strong>${value}<\\/strong>`));assert.equal(message.testMode,blind?'blind':undefined);assert.equal(await page.locator('.mock-dialog').count(),0);
 }
 assert.equal(await page.evaluate(()=>testMessages.length),3);assert.deepEqual(errors,[]);
 console.log('PASS: Untrained NSC attack, blind parry and ranged checks post through the real handler with technique zero and their own basis/focus/impairment.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
