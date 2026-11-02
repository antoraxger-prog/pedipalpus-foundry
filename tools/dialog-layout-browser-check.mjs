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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.10 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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

 await page.addStyleTag({content:'.mock-dialog{box-sizing:border-box;width:min(470px,calc(100vw - 24px));max-height:calc(100vh - 24px);top:12px;padding:16px;font-size:18.2px}.mock-dialog *{box-sizing:border-box}.mock-dialog input,.mock-dialog button,.mock-dialog select,.mock-dialog textarea{font:inherit}'});
 await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),{checkReference}=await import('/scripts/workbench.js');raw.AcademicSkills[0].Subskills[0].Description='https://regeln.example/'+('Langeregelerklärung'.repeat(12));const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.layoutActor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.layoutApp=await game.modules.get('pedipalpus-foundry').api.open(layoutActor.id);const hash='a'.repeat(64);await game.settings.set('pedipalpus-foundry','customTokenFrames',{['custom-'+hash]:{id:'custom-'+hash,name:'Mein persönlicher Rahmen mit langem Namen für das Charakterportrait',overlay:'worlds/test-world/pedipalpus-portraits/'+hash+'.png',clip:'worlds/test-world/pedipalpus-portraits/'+'b'.repeat(64)+'.png',width:16,height:16,window:{x:3,y:3,width:10,height:10}}});await layoutApp.persist({...layoutApp.preferences,textScale:130,favorites:{[layoutActor.id]:[checkReference(character.checks.find(row=>row.name==='Geographie'))]}});await layoutApp.render({force:true});},combatFixture());
 const idle=()=>page.waitForFunction(()=>!layoutApp.busy&&!layoutApp.referenceBusy);
 const original=await page.evaluate(()=>JSON.stringify(layoutActor.getFlag('pedipalpus-foundry','character')));
 const description=await page.evaluate(()=>JSON.parse(layoutActor.getFlag('pedipalpus-foundry','character').sourceJSON).AcademicSkills[0].Subskills[0].Description);
 const openPreferences=async()=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="preferences"]').click();await page.locator('.pp-custom-frame-import > summary').click();};
 const openNote=async()=>{await page.locator('[name="search"]').fill('Geographie');await page.locator('[data-check-id="AcademicSkills:0:0"] [data-action="info"]').click();};
 const fits=async()=>{const result=await page.locator('.mock-dialog').evaluate(dialog=>{const root=dialog.querySelector('.pp-preferences')??dialog.querySelector('form'),bounds=root.getBoundingClientRect();return {client:root.clientWidth,scroll:root.scrollWidth,fields:Array.from(root.querySelectorAll('input,select,textarea,button')).filter(field=>field.getClientRects().length&&field.checkVisibility()).flatMap(field=>{const a=field.getBoundingClientRect();return a.right>bounds.right+1||a.left<bounds.left-1?[field.name||field.dataset.favoriteOperation||field.textContent.trim()]:[]})};});assert.ok(result.scroll<=result.client+1,JSON.stringify(result));assert.deepEqual(result.fields,[]);};
 const measurements=[];
 for(const width of [640,360,320]){
  await page.setViewportSize({width,height:720});const prefsBefore=await page.evaluate(()=>JSON.stringify(layoutApp.preferences));await openPreferences();await fits();
  if(width===640){await page.locator('[name="density"]').selectOption('comfortable');await page.locator('[name="sound"]').uncheck();await page.locator('[name="volume"]').evaluate(field=>{field.value='.35';field.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.locator('[data-volume]').textContent(),'35%');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.equal(await page.evaluate(()=>layoutApp.preferences.volume),.35);assert.equal(await page.evaluate(()=>layoutApp.preferences.sound),false);}
  else{await page.locator('[name="density"]').selectOption('compact');if(width===320){await page.locator('[name="customFrameFile"]').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});await page.waitForFunction(()=>document.querySelector('[data-custom-frame-status]')?.textContent&&!document.querySelector('[name="customFrameFile"]').disabled);assert.equal(await page.locator('.mock-dialog [data-action="save"]').isEnabled(),true);await fits();await page.screenshot({path:path.resolve(root,'../artifacts/dialog-layout-1.11.10.png')});}await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.evaluate(()=>JSON.stringify(layoutApp.preferences)),prefsBefore);}
  await openNote();await fits();assert.ok((await page.locator('.pp-check-info > p').first().textContent()).endsWith(description));if(width===320){await page.locator('[name="abilityNote"]').fill('Schmales Fenster bleibt bedienbar.');await page.locator('[name="abilityNote"]').press('Control+Enter');await idle();}else{await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();}measurements.push(width);
  console.log(`PASS: Preferences and note fields fit at ${width}px with enlarged UI text; source text is exact and save/cancel remains reachable.`);
 }
 for(const theme of ['fantasy','ork','dark','light','demonic','aristocrat','warrior','arcane','sneaky']){
  await page.setViewportSize({width:360,height:720});await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await layoutApp.render({force:true});},theme);await openPreferences();await fits();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();await openNote();await fits();assert.equal(await page.locator('[name="abilityNote"]').inputValue(),'Schmales Fenster bleibt bedienbar.');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(layoutActor.getFlag('pedipalpus-foundry','character'))),original);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: All nine themes retain bounded settings/note fields, the saved note and original source values without any roll or browser error.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
