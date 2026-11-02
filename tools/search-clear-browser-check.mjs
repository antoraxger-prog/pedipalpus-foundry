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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.19 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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





 const raw=retinueFixture();for(let i=0;i<70;i++)raw.AcademicSkills[0].Subskills.push({Name:`Probe ${i}`,TotalValue:i%12});
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');window.clearActor=await foundry.documents.Actor.create({name:'Suchprüfung',type:'character',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});window.clearBefore=JSON.stringify(clearActor);window.clearApp=await game.modules.get('pedipalpus-foundry').api.open(clearActor.id);await clearApp.persist({...clearApp.preferences,sound:false,animations:'none'});await clearApp.render();},raw);
 const idle=()=>page.waitForFunction(()=>!clearApp.busy&&!clearApp.referenceBusy),query=page.locator('[name="search"]'),clear=page.locator('[data-search-clear]');
 assert.equal(await clear.isVisible(),false);await page.locator('[name="category"]').selectOption('AcademicSkills');await page.locator('[name="modifier"]').fill('3');await query.fill('Probe');assert.equal(await clear.isVisible(),true);await page.locator('.pp-check-list').evaluate(el=>el.scrollTop=200);assert.ok(await page.locator('.pp-check-list').evaluate(el=>el.scrollTop)>0);await clear.click();assert.equal(await query.inputValue(),'');assert.equal(await page.locator('[name="category"]').inputValue(),'AcademicSkills');assert.equal(await page.locator('[name="modifier"]').inputValue(),'3');assert.equal(await page.locator('.pp-check-list').evaluate(el=>el.scrollTop),0);assert.equal(await page.evaluate(()=>document.activeElement.name),'search');assert.equal(await clear.isVisible(),false);
 console.log('PASS: A single click clears only search, retains category and modifier, resets list scroll and returns focus without a roll.');
 await query.fill('Geographie');await page.evaluate(async()=>clearApp.render());assert.equal(await clear.isVisible(),true);assert.equal(await query.inputValue(),'Geographie');await query.press('Escape');assert.equal(await query.inputValue(),'');assert.equal(await clear.isVisible(),false);await query.fill('   ');assert.equal(await clear.isVisible(),true);await clear.click();await query.fill('Geographie');await page.locator('[name="category"]').selectOption('all');assert.equal(await clear.isVisible(),false);for(let i=0;i<4;i++){await query.fill('Geographie');await clear.click();}assert.equal(await clear.count(),1);
 console.log('PASS: Rerenders preserve nonempty search and its clear control; Escape, whitespace, category changes and repeated use synchronize visibility.');
 await query.fill('Geographie');await query.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-search-clear')),true);await page.keyboard.press('Enter');assert.equal(await query.inputValue(),'');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');await query.fill('Geographie');await query.focus();await page.keyboard.press('Tab');await page.keyboard.press('Space');assert.equal(await query.inputValue(),'');await query.fill('Geographie');await page.evaluate(()=>clearApp.busy=true);await clear.click();assert.equal(await query.inputValue(),'Geographie');await page.evaluate(()=>{clearApp.busy=false;clearApp.referenceBusy=true;});await clear.click();assert.equal(await query.inputValue(),'Geographie');await page.evaluate(()=>clearApp.referenceBusy=false);await clear.click();
 console.log('PASS: Tab/Enter and Space activate clear without dice; pending application actions guard against changes and normal use recovers.');
 await page.locator('[data-action="battle"]').click();await idle();await page.locator('[name="category"]').selectOption('animals');await query.fill('Träger');await clear.click();assert.equal(await page.locator('[name="category"]').inputValue(),'animals');assert.equal(await page.locator('[name="modifier"]').inputValue(),'3');assert.equal(await page.evaluate(()=>clearApp.mode),'battle');assert.equal(await page.locator('.pp-search-scope').isVisible(),false);await page.locator('[data-action="full"]').click();await idle();
 console.log('PASS: Combat companion search clears in place, keeps its selected area and unused modifier and does not switch windows or modes.');
 for(const theme of ['fantasy','ork','demonic','aristocrat','warrior','arcane','sneaky','dark','light']){await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await clearApp.render();},theme);for(const width of [900,460,412]){await page.setViewportSize({width,height:950});await query.fill('Ein langer Suchtext zur Platzprüfung');await page.locator('.pp-root').evaluate(el=>el.style.fontSize='16.25px');const geometry=await page.locator('.pp-search').evaluate(el=>{const input=el.querySelector('input'),button=el.querySelector('button'),i=input.getBoundingClientRect(),b=button.getBoundingClientRect(),root=el.closest('.pp-root');return {inside:b.left>=i.left&&b.right<=i.right&&b.top>=i.top-1&&b.bottom<=i.bottom+1,padding:parseFloat(getComputedStyle(input).paddingRight),width:b.width,overflow:root.scrollWidth>root.clientWidth+1};});assert.equal(geometry.inside,true,theme+width);assert.ok(geometry.padding>=geometry.width+6,theme);assert.equal(geometry.overflow,false,theme+width);assert.equal(await clear.getAttribute('aria-label'),theme==='ork'?'Suche weg':'Suche leeren');await clear.click();}}
 await page.setViewportSize({width:900,height:950});await page.evaluate(async()=>{await(await import('/scripts/design.js')).saveDesign('fantasy');await clearApp.render();});await query.fill('Geographie');await page.screenshot({path:path.resolve(root,'../artifacts/search-clear-1.11.19.png')});
 console.log('PASS: Clear fits all nine themes at wide and narrow widths with larger text, reserved input space, accessible labels and simple Ork wording.');
 await page.evaluate(async()=>{clearActor.isOwner=false;clearActor.canUserModify=()=>false;await clearApp.render();});await clear.click();assert.equal(await query.inputValue(),'');assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(clearActor.flags)),await page.evaluate(()=>JSON.stringify(JSON.parse(clearBefore).flags)));assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Observers can clear their search while rolls remain disabled; all character/companion data remain unchanged with no browser errors or chat.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
