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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.8 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 const raw=combatFixture();Object.assign(raw.AcademicSkills[0].Subskills[0],{Description:'Hier steht der unveränderte Regeltext.',Rules:'Originalregel mit +2 bleibt genau so.',Range:'20 Schritt',Duration:'10 Minuten',Notes:'Quellhinweis unverändert.'});raw.MeleeWeapons[0].Damage='1W6+2';
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');window.editorActor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});await game.modules.get('pedipalpus-foundry').api.open(editorActor.id);},raw);await idle();
 const original=await page.evaluate(()=>JSON.stringify(editorActor.getFlag('pedipalpus-foundry','character')));
 const theme=async value=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[name="theme"]').selectOption(value);await page.locator(`.pp-root[data-theme="${value}"]`).waitFor();await idle();};
 const open=async()=>{await page.locator('[name="search"]').fill('Geographie');await page.locator('[data-check-id="AcademicSkills:0:0"] [data-action="info"]').click();};
 await theme('ork');await open();
 assert.equal(await page.locator('.mock-dialog [data-action="save"]').textContent(),'Merktext merken');assert.equal(await page.locator('.mock-dialog [data-action="cancel"]').textContent(),'Zu');assert.match(await page.locator('.pp-note-editor label').textContent(),/Mein Merktext/);assert.match(await page.locator('.mock-dialog h2').textContent(),/Welt wissen/);assert.equal(await page.locator('.mock-dialog .pp-original-name').textContent(),'Geographie');assert.match(await page.locator('.mock-dialog').textContent(),/Was Ding ist/);assert.match(await page.locator('.mock-dialog').textContent(),/So geht Ding/);assert.match(await page.locator('.mock-dialog').textContent(),/Wie weit/);assert.match(await page.locator('.mock-dialog').textContent(),/Hier steht der unveränderte Regeltext\./);assert.match(await page.locator('.mock-dialog').textContent(),/Originalregel mit \+2 bleibt genau so\./);assert.match(await page.locator('.mock-dialog').textContent(),/Nur dein Merktext/);
 await page.screenshot({path:path.resolve(root,'../artifacts/ork-notizfenster-1.11.8.png')});
 console.log('PASS: Ork note dialog localizes its title, UI labels and controls while retaining the original ability name and exact source rules.');
 const field=page.locator('[name="abilityNote"]');assert.equal(await field.evaluate(element=>element===document.activeElement),true);assert.equal(await page.locator('[data-note-count]').textContent(),'0 / 2000');await field.pressSequentially('Neue Zeile');await field.press('Enter');await field.pressSequentially('bleibt offen');assert.equal(await field.inputValue(),'Neue Zeile\nbleibt offen');assert.equal(await page.locator('[data-note-count]').textContent(),`${'Neue Zeile\nbleibt offen'.length} / 2000`);assert.equal(await page.locator('.mock-dialog').count(),1);assert.equal(await page.evaluate(()=>testMessages.length),0);
 await field.press('Control+Enter');await idle();assert.equal(await page.locator('.mock-dialog').count(),0);assert.equal(await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-note-mark').count(),1);
 await open();assert.equal(await field.inputValue(),'Neue Zeile\nbleibt offen');assert.equal(await field.evaluate(element=>element.selectionStart), 'Neue Zeile\nbleibt offen'.length);await field.fill('Nicht merken');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();await open();assert.equal(await field.inputValue(),'Neue Zeile\nbleibt offen');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
 console.log('PASS: Focus starts in the note, character count follows multiline input, Enter adds a line, Ctrl+Enter saves and closing discards only unsaved edits.');
 await theme('fantasy');await open();assert.equal(await page.locator('.mock-dialog h2').textContent(),'Geographie');assert.equal(await page.locator('.mock-dialog [data-action="save"]').textContent(),'Notiz speichern');assert.equal(await page.locator('.mock-dialog [data-action="cancel"]').textContent(),'Schließen');assert.match(await page.locator('.pp-note-editor').textContent(),/Nur für dich gespeichert/);assert.equal(await page.locator('.mock-dialog .pp-original-name').count(),0);await field.fill('x'.repeat(2000));assert.equal(await field.getAttribute('maxlength'),'2000');assert.equal(await page.locator('[data-note-count]').textContent(),'2000 / 2000');await field.press('Meta+Enter');await idle();await open();assert.equal((await field.inputValue()).length,2000);await field.fill('');assert.equal(await page.locator('[data-note-count]').textContent(),'0 / 2000');await field.press('Control+Enter');await idle();assert.equal(await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-note-mark').count(),0);
 console.log('PASS: Standard mode keeps its familiar labels, the existing 2000-character limit remains intact, Command+Enter saves and clearing removes the note marker.');
 await theme('ork');await page.locator('[name="search"]').fill('');await page.locator('[data-action="battle"]').click();await page.locator('[name="search"]').fill('Rapier');await page.locator('[data-check-id="combat:MeleeWeapons:0:attack"] [data-action="info"]').click();assert.match(await page.locator('.mock-dialog h2').textContent(),/Rapier.*Hau/);assert.match(await page.locator('.mock-dialog .pp-original-name').textContent(),/Rapier.*Angriff/);assert.match(await page.locator('.mock-dialog').textContent(),/Aua:/);assert.match(await page.locator('.mock-dialog').textContent(),/1W6\+2/);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.evaluate(()=>JSON.stringify(editorActor.getFlag('pedipalpus-foundry','character'))),original);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Combat damage stays exact under the Ork label; all editing controls preserve imported data and never trigger a roll or browser error.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}

