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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.7 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 const raw=combatFixture();
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');window.noteRaw=raw;window.noteActor=await foundry.documents.Actor.create({name:raw.Name,type:'character',img:'icons/svg/mystery-man.svg',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});await game.modules.get('pedipalpus-foundry').api.open(noteActor.id);},raw);await idle();
 const sourceBefore=await page.evaluate(()=>noteActor.getFlag('pedipalpus-foundry','character').sourceJSON);
 const geography=()=>page.locator('.pp-check-row').filter({has:page.locator('.pp-check-name').filter({hasText:'Geographie'})});
 const results=()=>page.locator('.pp-check-row:not([hidden])');
 const note='<img src=x onerror="window.noteInjected=true"> Reise nach Brückenstadt';
 await page.locator('[name="search"]').fill('Geographie');await geography().locator('[data-action="info"]').click();await page.locator('[name="abilityNote"]').fill(note);await page.locator('.mock-dialog [data-action="save"]').click();await idle();
 assert.equal(await geography().locator('[data-has-note="true"] .pp-note-mark').count(),1);assert.match(await geography().locator('[data-action="info"]').getAttribute('aria-label'),/Notiz vorhanden/);
 await page.locator('[name="search"]').fill('brueckenstadt');assert.equal(await results().count(),1);assert.match(await results().locator('.pp-check-name').textContent(),/Geographie/);
 await page.locator('[name="search"]').fill('Geographie Reise');assert.equal(await results().count(),1);assert.equal(await page.locator('.pp-check-row img').count(),0);assert.equal(await page.evaluate(()=>window.noteInjected),undefined);assert.equal(await page.evaluate(()=>noteActor.getFlag('pedipalpus-foundry','character').sourceJSON),sourceBefore);
 console.log('PASS: A saved personal note marks its info button, is searchable with multiple words and umlauts, and stays escaped without altering source data.');
 const beforeRoll=await page.evaluate(()=>testMessages.length);await page.locator('[name="search"]').press('ArrowDown');await page.keyboard.press('Enter');await idle();assert.equal(await page.evaluate(()=>testMessages.length),beforeRoll+1);assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Geographie/);assert.doesNotMatch(await page.evaluate(()=>testMessages.at(-1).content),/Brückenstadt|noteInjected/);assert.equal(await page.evaluate(()=>noteActor.getFlag('pedipalpus-foundry','character').sourceJSON),sourceBefore);
 await geography().locator('[data-action="info"]').click();assert.equal(await page.locator('[name="abilityNote"]').inputValue(),note);await page.locator('[name="abilityNote"]').fill('Verworfen');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await geography().locator('[data-has-note="true"]').count(),1);
 await page.locator('[name="search"]').fill('Verworfen');assert.equal(await results().count(),0);await page.locator('[name="search"]').fill('Brückenstadt');assert.equal(await results().count(),1);
 await geography().locator('[data-action="info"]').click();await page.locator('[name="abilityNote"]').fill('  ');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.equal(await results().count(),0);await page.locator('[name="search"]').fill('Geographie');assert.equal(await geography().locator('.pp-note-mark').count(),0);
 await geography().locator('[data-action="info"]').click();await page.locator('[name="abilityNote"]').fill(note);await page.locator('.mock-dialog [data-action="save"]').click();await idle();
 console.log('PASS: Canceling note edits preserves the old marker/search text; saving a blank note removes both without changing the imported file.');
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');const actor=await foundry.documents.Actor.create({name:'Andere Figur',type:'character',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});await game.modules.get('pedipalpus-foundry').api.open(actor.id);},raw);await idle();await page.locator('[name="search"]').fill('Brückenstadt');assert.equal(await results().count(),0);assert.equal(await page.locator('.pp-note-mark').count(),0);
 await page.locator('[name="actor"]').selectOption(await page.evaluate(()=>noteActor.id));await idle();await page.locator('[name="search"]').fill('Brückenstadt');assert.equal(await results().count(),1);
 await page.evaluate(async()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];game.user.id='other-player';app.preferences=(await import('/scripts/workbench.js')).loadWorkbench();await app.render();});await idle();assert.equal(await page.locator('.pp-note-mark').count(),0);assert.equal(await results().count(),0);
 await page.evaluate(async()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];game.user.id='player';app.preferences=(await import('/scripts/workbench.js')).loadWorkbench();await app.render();});await idle();assert.equal(await results().count(),1);
 console.log('PASS: Notes and their search index stay separate between figures and users; returning to the original user restores only that user’s note.');
 await page.locator('[name="search"]').fill('');if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="import"]').click();const reordered=structuredClone(raw);reordered.AcademicSkills[0].Subskills.unshift({...reordered.AcademicSkills[0].Subskills[0],Name:'Neue Probe'});await page.locator('[name="characterFile"]').setInputFiles({name:'reordered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(reordered))});await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="includeImages"]').uncheck();await page.locator('.mock-dialog [data-action="import"]').click();await page.locator('.pp-import-diff').waitFor();await page.locator('.mock-dialog [data-action="accept"]').click();await idle();await page.locator('[name="search"]').fill('Brückenstadt');assert.equal(await results().count(),1);assert.equal(await results().getAttribute('data-check-id'),'AcademicSkills:0:1');assert.equal(await geography().locator('.pp-note-mark').count(),1);
 console.log('PASS: A real reimport with an inserted subskill keeps the note on its original semantic ability instead of assigning it by array position.');
 for(const theme of ['fantasy','ork','dark','light','demonic','aristocrat','warrior','arcane','sneaky']){
   if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption(theme);await page.locator(`.pp-root[data-theme="${theme}"]`).waitFor();await idle();
   const marked=results().locator('[data-action="info"][data-has-note="true"]');assert.equal(await marked.count(),1);const size=await marked.locator('.pp-note-mark').boundingBox();assert.ok(size?.width>=5&&size.height>=5,theme);assert.match(await marked.getAttribute('title'),theme==='ork'?/Merktext da/:/Notiz vorhanden/);
   assert.match(await page.locator('[name="search"]').getAttribute('placeholder'),theme==='ork'?/Merktext/:/Notiz/);assert.match(await page.locator('[name="search"]').getAttribute('title'),theme==='ork'?/Merktext wird auch gesucht/:/Spielnotizen werden mit durchsucht/);
 }
 await page.locator('[name="theme"]').selectOption('fantasy');await page.locator('.pp-root[data-theme="fantasy"]').waitFor();await idle();if(await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('.pp-root').screenshot({path:path.resolve(root,'../artifacts/spielnotizen-1.11.7.png')});
 console.log('PASS: The compact note marker and localized search help fit all nine themes without adding a new row or changing roll controls.');
 await page.locator('[data-action="battle"]').click();await idle();await page.locator('[name="search"]').fill('Rapier');await page.locator('[data-check-id="combat:MeleeWeapons:0:attack"] [data-action="info"]').click();await page.locator('[name="abilityNote"]').fill('Duell am Brunnen');await page.locator('.mock-dialog [data-action="save"]').click();await idle();await page.locator('[name="search"]').fill('Brunnen');assert.equal(await results().count(),1);assert.equal(await results().getAttribute('data-check-id'),'combat:MeleeWeapons:0:attack');
 await page.locator('[name="search"]').fill('Wolf');await page.locator('[data-check-id="animals:0:0:attack"] [data-action="info"]').click();await page.locator('[name="abilityNote"]').fill('Scharfe Nase');await page.locator('.mock-dialog [data-action="save"]').click();await idle();await page.locator('[name="search"]').fill('Nase');assert.equal(await results().count(),1);assert.equal(await results().getAttribute('data-check-id'),'animals:0:0:attack');assert.equal(await results().locator('.pp-note-mark').count(),1);
 await page.locator('[data-action="full"]').click();await idle();await page.locator('[name="search"]').fill('Brückenstadt');assert.equal(await results().count(),1);
 console.log('PASS: Note-only matches still roll the correct ability once; weapon and companion notes are searchable only on their own attack, including automatically expanded companion rows.');
 const savedNotes=await page.evaluate(()=>structuredClone(Array.from(foundry.applications.api.ApplicationV2.instances())[0].preferences.figures[noteActor.id].notes));
 await page.evaluate(async()=>{const{normalizeCharacter}=await import('/scripts/data.js');const data=JSON.parse(noteActor.getFlag('pedipalpus-foundry','character').sourceJSON);data.AcademicSkills[0].Subskills.push({...data.AcademicSkills[0].Subskills.find(row=>row.Name==='Geographie')});await noteActor.setFlag('pedipalpus-foundry','character',{...normalizeCharacter(data),sourceJSON:JSON.stringify(data)});});await idle();assert.equal(await results().count(),0);assert.equal(await page.locator('.pp-note-mark').count(),0);assert.deepEqual(await page.evaluate(()=>Array.from(foundry.applications.api.ApplicationV2.instances())[0].preferences.figures[noteActor.id].notes),savedNotes);assert.deepEqual(errors,[]);
 console.log('PASS: An ambiguous duplicated ability gets no guessed note marker or search hit; the stored personal note is preserved and the browser reports no errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}

