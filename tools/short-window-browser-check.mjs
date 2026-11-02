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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.23 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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




 const raw=fixture();raw.AcademicSkills[0].Subskills=['Geistige Magieresistenz','Körperliche Magieresistenz','Etikette am höfischen Parkett','Geschichte des Mittelreichs','Alchimistische Analyse','Mechanische Konstruktionen'].map((Name,i)=>({Name,TotalValue:i+2}));
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js'),{checkReference}=await import('/scripts/workbench.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.quickActor=await foundry.documents.Actor.create({name:'Schnellleistenprüfung',type:'character',flags:{'pedipalpus-foundry':{character}}});window.quickApp=await game.modules.get('pedipalpus-foundry').api.open(quickActor.id);await quickApp.persist({...quickApp.preferences,sound:false,animations:'none',density:'comfortable',textScale:130,favorites:{[quickActor.id]:character.checks.filter(row=>row.category==='AcademicSkills').map(checkReference)}});quickApp.setPosition({width:540,height:320});await quickApp.render();},raw);

 assert.equal(await page.evaluate(()=>quickApp.preferences.textScale),130);
 assert.equal(await page.locator('.pp-root').evaluate(el=>getComputedStyle(el).getPropertyValue('--pp-font-scale').trim()),'1.3');
 assert.ok(Math.abs(await page.locator('.pp-quick-check .pp-check-name').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))-18.2)<0.1);

 const idle=()=>page.waitForFunction(()=>!quickApp.busy&&!quickApp.referenceBusy),rootField=page.locator('.pp-root'),list=page.locator('.pp-check-list');const before=await page.evaluate(()=>JSON.stringify(quickActor.flags));
 let overflowCases=0;for(const theme of ['fantasy','ork','demonic','aristocrat','warrior','arcane','sneaky','dark','light']){await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await quickApp.render();},theme);for(const [width,height] of [[412,320],[900,360]]){await page.setViewportSize({width,height:900});await page.evaluate(async height=>{quickApp.setPosition({height});await quickApp.render();},height);const size=await rootField.evaluate(root=>{root.scrollTop=root.scrollHeight;const r=root.getBoundingClientRect(),list=root.querySelector('.pp-check-list').getBoundingClientRect();return {overflow:root.scrollHeight>root.clientHeight+1,scrolled:root.scrollTop>0,overflowY:getComputedStyle(root).overflowY,inside:list.bottom<=r.bottom+1,horizontal:root.scrollWidth>root.clientWidth+1};});if(size.overflow)overflowCases++;assert.equal(size.overflowY,'auto');assert.equal(size.inside,true,theme+JSON.stringify(size));assert.equal(size.horizontal,false,theme);if(size.overflow)assert.equal(size.scrolled,true,theme);}}assert.ok(overflowCases>=9);
 console.log('PASS: Short narrow and wide windows in all nine themes let the main list scroll into reach at actual 130 percent text without horizontal overflow.');
 await page.setViewportSize({width:412,height:900});await page.evaluate(async()=>{await(await import('/scripts/design.js')).saveDesign('fantasy');quickApp.setPosition({height:320});await quickApp.render();});await rootField.evaluate(el=>el.scrollTop=el.scrollHeight);const die=page.locator('.pp-check-row .pp-dice-button[data-blind="false"]:not([disabled])').last();await die.focus();const location=()=>rootField.evaluate(root=>{const r=root.getBoundingClientRect(),a=document.activeElement.getBoundingClientRect();return {inside:a.top>=r.top&&a.bottom<=r.bottom+1,scroll:root.scrollTop,list:root.querySelector('.pp-check-list').scrollTop};});const saved=await location();assert.equal(saved.inside,true);assert.ok(saved.scroll>0);assert.ok(saved.list>0);await page.evaluate(async()=>quickApp.render());const restored=await location();assert.deepEqual(restored,saved);await page.locator('.pp-check-row .pp-favorite-button').last().click();await idle();const updated=await location();assert.equal(updated.inside,true);assert.equal(updated.scroll,saved.scroll);assert.equal(updated.list,saved.list);assert.equal(await page.evaluate(()=>testMessages.length),0);
 console.log('PASS: Focusing a deep list die reveals it; rerender and a favorite change retain both outer-window and inner-list scroll positions without rolling.');
 await die.focus();await page.keyboard.press('Control+f');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');assert.equal((await location()).inside,true);await page.locator('[name="search"]').fill('Analyse');await page.keyboard.press('Escape');assert.equal(await page.locator('[name="search"]').inputValue(),'');assert.equal((await location()).inside,true);assert.equal(await page.evaluate(()=>quickApp.rendered),true);
 console.log('PASS: The existing search shortcut returns from the lower list to an on-screen search field and Escape keeps the window usable.');
 if(!await page.locator('.pp-quickbar').evaluate(el=>el.open))await page.locator('.pp-quickbar > summary').press('Space');await page.locator('.pp-quickbar > summary').press('Space');assert.equal(await page.locator('.pp-quickbar').evaluate(el=>el.open),false);await page.locator('.pp-quickbar > summary').press('Space');assert.equal(await page.locator('.pp-quickbar').evaluate(el=>el.open),true);await rootField.evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:path.resolve(root,'../artifacts/short-window-1.11.23.png')});await page.evaluate(async()=>{quickApp.setPosition({height:520});await quickApp.render();});assert.equal(await rootField.evaluate(el=>el.scrollHeight<=el.clientHeight+1),true);await page.evaluate(async()=>{quickActor.isOwner=false;quickActor.canUserModify=()=>false;quickApp.setPosition({height:320});await quickApp.render();});await rootField.evaluate(el=>el.scrollTop=el.scrollHeight);assert.equal(await rootField.evaluate(el=>{const r=el.getBoundingClientRect(),list=el.querySelector('.pp-check-list').getBoundingClientRect();return list.bottom<=r.bottom+1;}),true);assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(quickActor.flags)),before);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Favorite disclosure remains usable, normal-height windows need no outer scrolling, and observers retain access without dice rights or character changes.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
