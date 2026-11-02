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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.20 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js'),{checkReference}=await import('/scripts/workbench.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.quickActor=await foundry.documents.Actor.create({name:'Schnellleistenprüfung',type:'character',flags:{'pedipalpus-foundry':{character}}});window.quickApp=await game.modules.get('pedipalpus-foundry').api.open(quickActor.id);await quickApp.persist({...quickApp.preferences,sound:false,animations:'none',density:'comfortable',textScale:130,favorites:{[quickActor.id]:character.checks.filter(row=>row.category==='AcademicSkills').map(checkReference)}});quickApp.setPosition({width:540,height:420});await quickApp.render();},raw);

 assert.equal(await page.evaluate(()=>quickApp.preferences.textScale),130);
 assert.equal(await page.locator('.pp-root').evaluate(el=>getComputedStyle(el).getPropertyValue('--pp-font-scale').trim()),'1.3');
 assert.ok(Math.abs(await page.locator('.pp-quick-check .pp-check-name').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))-18.2)<0.1);
 const idle=()=>page.waitForFunction(()=>!quickApp.busy&&!quickApp.referenceBusy),bar=page.locator('.pp-quickbar');const before=await page.evaluate(()=>JSON.stringify(quickActor.flags));
 const fits=()=>page.locator('.pp-root').evaluate(root=>{const r=root.getBoundingClientRect(),q=root.querySelector('.pp-quickbar'),b=q.getBoundingClientRect(),list=root.querySelector('.pp-check-list').getBoundingClientRect();return {inside:list.bottom<=r.bottom+1,listHeight:list.height,barHeight:b.height,rootHeight:r.height,scrollable:q.scrollHeight>q.clientHeight+1,overflow:root.scrollWidth>root.clientWidth+1};});
 for(const theme of ['fantasy','ork','demonic','aristocrat','warrior','arcane','sneaky','dark','light']){await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await quickApp.render();},theme);for(const [width,height,density] of [[412,420,'comfortable'],[900,520,'normal']]){await page.setViewportSize({width,height:900});await page.evaluate(async({height,density})=>{await quickApp.persist({...quickApp.preferences,density});quickApp.setPosition({height});await quickApp.render();},{height,density});const size=await fits();assert.equal(size.inside,true,theme+JSON.stringify(size));assert.ok(size.listHeight>=80,theme+JSON.stringify(size));assert.ok(size.barHeight<=size.rootHeight*.2+1,theme);assert.equal(size.overflow,false,theme);assert.equal(await page.locator('.pp-quick-check').count(),6);}}
 console.log('PASS: Six longer favorites retain a usable visible main list in all nine themes, short narrow comfortable windows and standard windows with larger text.');
 await page.setViewportSize({width:412,height:900});await page.evaluate(async()=>{await(await import('/scripts/design.js')).saveDesign('fantasy');await quickApp.persist({...quickApp.preferences,density:'comfortable'});quickApp.setPosition({height:420});await quickApp.render();});assert.equal((await fits()).scrollable,true);await bar.evaluate(el=>el.scrollTop=el.scrollHeight);const sticky=await bar.evaluate(el=>{const a=el.getBoundingClientRect(),s=el.querySelector('summary').getBoundingClientRect();return {top:s.top,bottom:s.bottom,min:a.top,max:a.bottom};});assert.ok(sticky.top>=sticky.min-1&&sticky.bottom<=sticky.max+1);await bar.locator('summary').click();assert.equal(await bar.evaluate(el=>el.open),false);assert.equal((await fits()).inside,true);await bar.locator('summary').click();assert.equal(await bar.evaluate(el=>el.open),true);assert.equal(await page.locator('.pp-quick-check').count(),6);
 console.log('PASS: The favorites panel scrolls independently while its summary stays reachable; collapsing and reopening keeps all six saved favorites.');
 const last=page.locator('.pp-quick-check').last(),removed=await last.getAttribute('data-quick-check');await last.locator('.pp-favorite-button').click();await idle();assert.equal(await page.locator('.pp-quick-check').count(),5);assert.equal(await page.locator(`.pp-check-row[data-check-id="${removed}"] .pp-favorite-button`).getAttribute('aria-pressed'),'false');assert.equal(await page.evaluate(()=>testMessages.length),0);assert.equal(await page.evaluate(()=>JSON.stringify(quickActor.flags)),before);assert.equal((await fits()).inside,true);await page.locator('.pp-quick-check').last().locator('.pp-dice-button[data-blind="true"]').focus();const focus=await bar.evaluate(el=>{const b=el.getBoundingClientRect(),r=document.activeElement.getBoundingClientRect();return {own:el.contains(document.activeElement),inside:r.top>=b.top&&r.bottom<=b.bottom+1};});assert.deepEqual(focus,{own:true,inside:true});await page.screenshot({path:path.resolve(root,'../artifacts/quick-layout-1.11.20.png')});
 console.log('PASS: Removing a scrolled favorite changes only the personal list, never rolls, and keyboard focus reveals a hidden quick die within the scroll area.');
 await page.evaluate(async()=>{quickActor.isOwner=false;quickActor.canUserModify=()=>false;await quickApp.render();});await bar.evaluate(el=>el.scrollTop=el.scrollHeight);await page.locator('.pp-quick-check').last().locator('.pp-favorite-button').click();await idle();assert.equal(await page.locator('.pp-quick-check').count(),4);assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(quickActor.flags)),before);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Observers can remove their personal favorites while dice remain disabled; all character data and rights are preserved with no browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
