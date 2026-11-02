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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.14 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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




 await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),{checkReference}=await import('/scripts/workbench.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.focusActor=actor;window.focusBefore=JSON.stringify(actor.flags);window.focusApp=await game.modules.get('pedipalpus-foundry').api.open(actor.id);await focusApp.persist({...focusApp.preferences,highContrast:true,animations:'none',sound:false,favorites:{[actor.id]:[checkReference(character.checks.find(row=>row.name==='Geographie'))]}});await focusApp.render();},retinueFixture());
 const idle=()=>page.waitForFunction(()=>!focusApp.busy&&!focusApp.referenceBusy),query=page.locator('[name="search"]');await query.fill('Geographie');const row='.pp-check-row:not([hidden])',rating=page.locator(row+' .pp-rating');await query.press('ArrowDown');await page.keyboard.press('Shift+Tab');assert.equal(await rating.evaluate(el=>el===document.activeElement),true);assert.equal(await rating.evaluate(el=>getComputedStyle(el).outlineWidth),'3px');assert.equal(await rating.evaluate(el=>getComputedStyle(el).outlineOffset),'2px');
 console.log('PASS: Keyboard navigation reaches the rating with a distinct 3px focus ring in high contrast instead of its permanent 1px value outline.');
 const themes=['fantasy','dark','light','ork','demonic','aristocrat','warrior','arcane','sneaky'];const configure=async(theme,highContrast)=>{await page.evaluate(async({theme,highContrast})=>{await (await import('/scripts/design.js')).saveDesign(theme);await focusApp.persist({...focusApp.preferences,highContrast});await focusApp.render();},{theme,highContrast});await query.fill('Geographie');};
 const targets=['[name="actor"]','[name="search"]',row+' .pp-check-name',row+' .pp-rating',row+' .pp-dice-button[data-blind="false"]',row+' .pp-dice-button[data-blind="true"]',row+' .pp-favorite-button'];
 for(const theme of themes)for(const highContrast of [false,true]){await configure(theme,highContrast);await query.press('ArrowDown');for(const target of targets){const control=page.locator(target);await control.focus();const style=await control.evaluate(el=>{const s=getComputedStyle(el);return {visible:el.matches(':focus-visible'),width:s.outlineWidth,style:s.outlineStyle,offset:s.outlineOffset};});assert.deepEqual(style,{visible:true,width:highContrast?'3px':'2px',style:'solid',offset:highContrast?'2px':'1px'},theme+' '+target);}}
 console.log('PASS: Figure/search fields, names, ratings, normal/blind dice and favorite stars retain visible keyboard focus in all nine designs, with independent normal/high-contrast styles.');
 await configure('aristocrat',false);const favorite=page.locator(row+' .pp-favorite-button');assert.equal(await favorite.getAttribute('aria-pressed'),'true');for(const control of await page.locator('.pp-favorite-button[aria-pressed="true"]').all())assert.equal(await control.evaluate(el=>getComputedStyle(el).color),'rgb(133, 87, 8)');await favorite.click();await idle();assert.equal(await favorite.getAttribute('aria-pressed'),'false');await favorite.click();await idle();assert.equal(await favorite.getAttribute('aria-pressed'),'true');await page.screenshot({path:path.resolve(root,'../artifacts/aristocrat-favorite-1.11.14.png')});await configure('dark',false);assert.equal(await favorite.evaluate(el=>getComputedStyle(el).color),'rgb(211, 164, 76)');
 console.log('PASS: Selected Aristocrat favorites use darker gold in list and quickbar, still toggle normally and preserve the existing dark-theme palette.');
 await page.emulateMedia({reducedMotion:'reduce'});await configure('fantasy',true);await query.press('ArrowDown');await page.keyboard.press('Shift+Tab');assert.equal(await rating.evaluate(el=>getComputedStyle(el).outlineWidth),'3px');await page.screenshot({path:path.resolve(root,'../artifacts/high-contrast-focus-1.11.14.png')});await configure('fantasy',false);await query.press('ArrowDown');await page.keyboard.press('Shift+Tab');assert.equal(await rating.evaluate(el=>getComputedStyle(el).outlineWidth),'2px');await page.emulateMedia({reducedMotion:'no-preference'});
 console.log('PASS: Reduced motion keeps the static focus marker, and disabling high contrast restores the normal focus style without changing animation preferences.');
 await query.press('ArrowDown');await page.keyboard.press('Enter');await idle();assert.equal(await page.evaluate(()=>testMessages.length),1);assert.match(await page.evaluate(()=>testMessages[0].content),/Geographie/);assert.equal(await page.evaluate(()=>JSON.stringify(focusActor.flags)),await page.evaluate(()=>focusBefore));await page.evaluate(async()=>{focusActor.isOwner=false;focusActor.canUserModify=()=>false;await focusApp.render();});await query.focus();await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');assert.equal(await page.evaluate(()=>testMessages.length),1);assert.deepEqual(errors,[]);
 console.log('PASS: Keyboard activation submits one normal roll, preserves character data and leaves observer dice disabled with no browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
