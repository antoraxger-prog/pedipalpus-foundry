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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.25 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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





 const raw=retinueFixture();raw.Be=4;raw.GRS=7;raw.DerivedValues=Array.from({length:9},(_,i)=>({ShortName:i===0?'LE':i===8?'TK':'',TotalValue:i===0?31:i===8?50:0}));raw.Armors=[{Name:'DrachenhautverstärkterVollplattenharnischderPalastgarde',InventoryId:'plate',Protection:7,MobilityPenalty:4,BaseMobilityPenalty:4,Weight:10,OnPerson:true,IsEquiped:true},{Name:'Helm',InventoryId:'helm',Protection:2,MobilityPenalty:1,BaseMobilityPenalty:1,Weight:2,OnPerson:true,IsEquiped:false},{Name:'Gefolgsrüstung',InventoryId:'pet',Protection:4,MobilityPenalty:2,BaseMobilityPenalty:2,Weight:0,OnPerson:true,IsEquiped:false,CarrierAnimalId:'old-skeleton'},...Array.from({length:12},(_,i)=>({Name:`Rüstungsstück ${i+1}`,InventoryId:`piece-${i}`,Protection:1,MobilityPenalty:0,BaseMobilityPenalty:0,Weight:0,OnPerson:false,IsEquiped:false}))];
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js'),{withPlayState}=await import('/scripts/play-state.js');const character=withPlayState({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},{version:1,resources:{root:{LE:12}}});window.layoutActor=await foundry.documents.Actor.create({name:'Rüstungsansicht',type:'character',ownership:{player:3,other:2},flags:{'pedipalpus-foundry':{character}}});window.layoutBefore=structuredClone(character);window.layoutApp=await game.modules.get('pedipalpus-foundry').api.open(layoutActor.id);await layoutApp.persist({...layoutApp.preferences,sound:false,animations:'none',density:'comfortable',textScale:130});await layoutApp.setMode('battle');},raw);await page.locator('[name="category"]').selectOption('armors');
 const idle=()=>page.waitForFunction(()=>!layoutApp.busy&&!layoutApp.referenceBusy),panel=page.locator('.pp-armor-panel'),field=(index,key)=>page.locator(`[data-armor="Armors:${index}"][data-armor-field="${key}"]`),state=()=>page.evaluate(()=>{const c=layoutActor.getFlag('pedipalpus-foundry','character'),raw=JSON.parse(c.sourceJSON);return {be:raw.Be,rs:raw.GRS,le:c.resources.find(r=>r.name==='LE').value,retinue:c.retinue};});
 const fits=async()=>{const result=await panel.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+2,cards:[...el.querySelectorAll('.pp-armor-card')].filter(card=>{const name=card.querySelector('strong').getBoundingClientRect(),value=card.querySelector('header span').getBoundingClientRect(),box=card.getBoundingClientRect();return card.scrollWidth>card.clientWidth+2||name.right>value.left+1||value.right>box.right-4;}).map(card=>card.textContent)}));assert.deepEqual(result,{overflow:false,cards:[]});};
 assert.equal(await page.evaluate(()=>layoutApp.preferences.textScale),130);for(const width of [412,500,900])for(const theme of ['fantasy','dark','light','ork','demonic','aristocrat','warrior','arcane','sneaky']){await page.setViewportSize({width,height:900});await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await layoutApp.render();},theme);await fits();}assert.equal(await page.locator('.pp-armor-card strong').first().textContent(),raw.Armors[0].Name);
 console.log('PASS: Unbroken long armor names and RS/BE values stay separate and inside every card in all nine themes at three widths with saved 130 percent text.');
 await page.setViewportSize({width:412,height:900});await page.evaluate(async()=>{await(await import('/scripts/design.js')).saveDesign('fantasy');await layoutApp.render();});await page.locator('[name="modifier"]').fill('3');await field(1,'equipped').check();await idle();assert.equal((await state()).be,5);assert.equal((await state()).rs,9);await field(0,'carried').uncheck();await idle();assert.equal((await state()).be,1);assert.equal((await state()).rs,2);await field(0,'equipped').check();await idle();await field(1,'equipped').uncheck();await idle();assert.equal((await state()).be,4);assert.equal((await state()).rs,7);assert.equal((await state()).le,12);assert.equal(await page.locator('[name="modifier"]').inputValue(),'3');assert.equal(await field(2,'equipped').isDisabled(),true);await fits();
 console.log('PASS: Carried/equipped checkboxes remain usable with wrapped names, keep expected BE/RS, local LE12 and pending modifier3, and retain the companion armor lock.');
 await field(14,'carried').focus();const before=await panel.evaluate(el=>el.scrollTop);assert.ok(before>0);await field(14,'carried').check();await idle();assert.ok(Math.abs(await panel.evaluate(el=>el.scrollTop)-before)<2,'Armor scroll position must survive a checkbox change');const saved=await panel.evaluate(el=>el.scrollTop);await page.evaluate(()=>layoutApp.render());assert.ok(Math.abs(await panel.evaluate(el=>el.scrollTop)-saved)<2);await field(14,'carried').uncheck();await idle();await fits();await panel.evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.resolve(root,'../artifacts/armor-layout-1.11.25.png')});
 console.log('PASS: A lower armor checkbox and a complete same-view rerender preserve the armor panel scroll position instead of returning to the first card.');
 const beforeObserver=await page.evaluate(()=>JSON.stringify(layoutActor.flags));await page.evaluate(async()=>{layoutActor.isOwner=false;layoutActor.canUserModify=()=>false;await layoutApp.render();});assert.equal(await page.locator('[data-armor]:not([disabled])').count(),0);await fits();assert.equal(await page.evaluate(()=>JSON.stringify(layoutActor.flags)),beforeObserver);assert.deepEqual((await state()).retinue,await page.evaluate(()=>layoutBefore.retinue));assert.deepEqual(await page.evaluate(()=>layoutActor.ownership),{player:3,other:2});assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Observers retain readable armor cards without edit rights; source companion data and ownership stay intact, with no rolls or browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
